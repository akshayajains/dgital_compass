import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-device-key, x-device-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const encoder = new TextEncoder();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}
function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!['POST', 'GET'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
  try {
    const body = request.method === 'POST' ? await request.json() : {};
    const action = body.action ?? new URL(request.url).searchParams.get('action');

    // Pair once from a signed-in dashboard. The ESP32 keeps the returned secret
    // locally; only its SHA-256 digest is stored in the database.
    if (action === 'pair') {
      const bearer = request.headers.get('Authorization');
      if (!bearer?.startsWith('Bearer ')) return json({ error: 'Sign in before pairing a device.' }, 401);
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: bearer } }, auth: { persistSession: false } });
      const { data: authData, error: authError } = await userClient.auth.getUser();
      if (authError || !authData.user) return json({ error: 'Your session has expired. Sign in again.' }, 401);
      const { deviceKey, deviceSecret, displayName, timezone } = body;
      if (!isUuid(deviceKey) || typeof deviceSecret !== 'string' || deviceSecret.length < 24 || typeof displayName !== 'string' || !displayName.trim() || typeof timezone !== 'string' || timezone.length > 80) {
        return json({ error: 'Enter the ESP32 UUID, its 24+ character secret, device name, and a valid time zone.' }, 400);
      }
      const { data: device, error: deviceError } = await admin.from('devices').insert({
        owner_id: authData.user.id, device_key: deviceKey, display_name: displayName.trim().slice(0, 80), timezone,
      }).select('id,display_name,device_key').single();
      if (deviceError || !device) return json({ error: deviceError?.code === '23505' ? 'That ESP32 is already paired.' : 'Could not pair this device.' }, 409);
      const { error: secretError } = await admin.from('device_credentials').insert({ device_id: device.id, secret_hash: await sha256(deviceSecret) });
      if (secretError) {
        await admin.from('devices').delete().eq('id', device.id);
        return json({ error: 'Could not securely save the device credential.' }, 500);
      }
      return json({ device: { id: device.id, display_name: device.display_name }, paired: true });
    }

    const deviceKey = request.headers.get('x-device-key');
    const deviceSecret = request.headers.get('x-device-secret');
    if (!isUuid(deviceKey) || !deviceSecret || deviceSecret.length < 24) return json({ error: 'Device credentials required.' }, 401);
    const { data: device } = await admin.from('devices').select('id,timezone,fan_is_stopped,cleaning_arms_parked,last_seen')
      .eq('device_key', deviceKey).maybeSingle();
    if (!device) return json({ error: 'Device not paired.' }, 401);
    const { data: credential } = await admin.from('device_credentials').select('secret_hash').eq('device_id', device.id).maybeSingle();
    if (!credential || !safeEqual(credential.secret_hash, await sha256(deviceSecret))) return json({ error: 'Device credentials are invalid.' }, 401);

    if (action === 'telemetry') {
      if (typeof body.fanStopped !== 'boolean' || typeof body.armsParked !== 'boolean') return json({ error: 'fanStopped and armsParked must be booleans.' }, 400);
      const temperature = body.temperatureC == null ? null : Number(body.temperatureC);
      if (temperature != null && (!Number.isFinite(temperature) || temperature < -20 || temperature > 100)) return json({ error: 'Invalid temperature.' }, 400);
      const { error } = await admin.from('devices').update({
        is_online: true, fan_is_stopped: body.fanStopped, cleaning_arms_parked: body.armsParked,
        temperature_c: temperature, last_seen: new Date().toISOString(),
      }).eq('id', device.id);
      if (error) return json({ error: 'Could not save sensor status.' }, 500);
      return json({ received: true });
    }

    if (action === 'schedule') {
      await admin.from('devices').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', device.id);
      const { data, error } = await admin.from('cleaning_schedules').select('id,label,clean_at,days_of_week,enabled,updated_at')
        .eq('device_id', device.id).eq('enabled', true).order('clean_at');
      if (error) return json({ error: 'Could not read schedules.' }, 500);
      return json({ timezone: device.timezone, schedules: data ?? [] });
    }

    if (action === 'next-command') {
      const { data: command } = await admin.from('device_commands').select('id,command,payload,created_at')
        .eq('device_id', device.id).eq('status', 'pending').order('created_at').limit(1).maybeSingle();
      if (!command) return json({ command: null });
      const seenRecently = device.last_seen && Date.now() - new Date(device.last_seen).getTime() < 45000;
      if (command.command === 'clean_now' && !(device.fan_is_stopped && device.cleaning_arms_parked && seenRecently)) {
        await admin.from('device_commands').update({ status: 'rejected', result: { reason: 'Local safety preconditions are not met.' }, finished_at: new Date().toISOString() }).eq('id', command.id);
        return json({ command: null, rejected: true });
      }
      await admin.from('device_commands').update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() }).eq('id', command.id).eq('status', 'pending');
      return json({ command });
    }

    if (action === 'command-result') {
      const { commandId, status, result } = body;
      if (!isUuid(commandId) || !['running', 'completed', 'failed'].includes(status)) return json({ error: 'Invalid command result.' }, 400);
      const patch: Record<string, unknown> = { status, result: result ?? {}, ...(status === 'completed' || status === 'failed' ? { finished_at: new Date().toISOString() } : {}) };
      const { data, error } = await admin.from('device_commands').update(patch).eq('id', commandId).eq('device_id', device.id).select('id').maybeSingle();
      if (error || !data) return json({ error: 'Command was not found for this device.' }, 404);
      return json({ saved: true });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch {
    return json({ error: 'Request could not be processed.' }, 400);
  }
});
