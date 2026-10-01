import React, { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  Activity, AirVent, AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, Cloud, Fan, History, Home, Info,
  Leaf, Link2, LoaderCircle, Menu, MoreHorizontal, Plus, Power, RotateCcw, Settings2,
  ShieldCheck, Sparkles, Thermometer, Trash2, Wifi, X,
} from 'lucide-react';

type Tab = 'overview' | 'schedule' | 'cleaning' | 'device';
type Schedule = { id: string; label: string; time: string; days: number[]; enabled: boolean; };
type Device = { id: string; device_key: string; display_name: string; is_online: boolean; fan_is_stopped: boolean; cleaning_arms_parked: boolean; temperature_c: number | null; last_seen: string | null };
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const defaultSchedules: Schedule[] = [
  { id: 's1', label: 'Morning clean', time: '08:00', days: [1, 3, 5], enabled: true },
  { id: 's2', label: 'Weekend refresh', time: '10:30', days: [0, 6], enabled: true },
  { id: 's3', label: 'Evening check', time: '19:00', days: [2, 4], enabled: false },
];
const storedSchedules = () => {
  try { const value = localStorage.getItem('aircare-schedules'); return value ? JSON.parse(value) as Schedule[] : defaultSchedules; }
  catch { return defaultSchedules; }
};
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const cloudEnabled = Boolean(url && key && !url.includes('your-project'));
const supabase: SupabaseClient | null = cloudEnabled ? createClient(url!, key!) : null;

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  return now;
}
function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function relativeDay(day: number, today: number) {
  if (day === today) return 'Today';
  if (day === (today + 1) % 7) return 'Tomorrow';
  return dayNames[day];
}

export function App() {
  const now = useClock();
  const today = now.getDay();
  const [tab, setTab] = useState<Tab>('overview');
  const [schedules, setSchedules] = useState<Schedule[]>(() => cloudEnabled ? [] : storedSchedules());
  const [modal, setModal] = useState<'schedule' | 'clean' | 'none'>('none');
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [notice, setNotice] = useState('');
  const [fanStopped, setFanStopped] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [pairModal, setPairModal] = useState(false);
  const [authReady, setAuthReady] = useState(!cloudEnabled);

  useEffect(() => { if (!cloudEnabled) localStorage.setItem('aircare-schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setUser(data.session?.user ?? null); setAuthReady(true); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null); setAuthReady(true);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!supabase || !user) return;
    let alive = true;
    supabase.from('cleaning_schedules').select('id,label,clean_at,days_of_week,enabled').order('clean_at')
      .then(({ data, error }) => {
        if (alive && data && !error) setSchedules(data.map((row: any) => ({ id: row.id, label: row.label, time: row.clean_at.slice(0, 5), days: row.days_of_week, enabled: row.enabled })));
      });
    const channel = supabase.channel('fan-schedules').on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_schedules' }, () => {
      supabase!.from('cleaning_schedules').select('id,label,clean_at,days_of_week,enabled').order('clean_at').then(({ data }) => {
        if (alive && data) setSchedules(data.map((row: any) => ({ id: row.id, label: row.label, time: row.clean_at.slice(0, 5), days: row.days_of_week, enabled: row.enabled })));
      });
    }).subscribe();
    return () => { alive = false; void supabase!.removeChannel(channel); };
  }, [user]);
  useEffect(() => {
    if (!supabase || !user) return;
    let alive = true;
    const loadDevice = () => supabase!.from('devices').select('id,device_key,display_name,is_online,fan_is_stopped,cleaning_arms_parked,temperature_c,last_seen').limit(1).maybeSingle().then(({ data }) => { if (alive) setDevice(data as Device | null); });
    void loadDevice();
    const channel = supabase.channel('fan-device-status').on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => { void loadDevice(); }).subscribe();
    return () => { alive = false; void supabase!.removeChannel(channel); };
  }, [user]);  useEffect(() => {    if (!supabase || !user) return;    const channel = supabase.channel('fan-cleaning-command').on('postgres_changes', { event: '*', schema: 'public', table: 'device_commands' }, (payload) => {      const status = (payload.new as { status?: string } | undefined)?.status;      if (status === 'pending' || status === 'acknowledged' || status === 'running') setCleaning(true);      if (status === 'completed') { setCleaning(false); setNotice('Cleaning cycle complete'); }      if (status === 'failed' || status === 'rejected') { setCleaning(false); setNotice('The ESP32 could not start the cleaning cycle'); }    }).subscribe();    return () => { void supabase!.removeChannel(channel); };  }, [user]);  const upcoming = useMemo(() => schedules.filter((item) => item.enabled && item.days.length)
    .flatMap((item) => item.days.map((day) => {
      const offset = (day - today + 7) % 7;
      const [hours, minutes] = item.time.split(':').map(Number);
      const at = new Date(now); at.setHours(hours, minutes, 0, 0);
      if (offset > 0) at.setDate(at.getDate() + offset);
      else if (at <= now) at.setDate(at.getDate() + 7);
      return { ...item, day, at };
    })).sort((a, b) => a.at.getTime() - b.at.getTime()), [schedules, now, today]);
  const next = upcoming[0];
  const heartbeatFresh = Boolean(device?.last_seen && Date.now() - new Date(device.last_seen).getTime() < 60000);
  const deviceOnline = cloudEnabled ? Boolean(device?.is_online && heartbeatFresh) : isConnected;
  const safeToClean = cloudEnabled ? Boolean(device?.fan_is_stopped && device?.cleaning_arms_parked && heartbeatFresh) : fanStopped;

  async function saveSchedule(item: Schedule) {    if (supabase && user && !device) { setNotice('Pair an ESP32 before saving a cloud schedule'); return; }
    setSchedules((old) => {
      const found = old.some((x) => x.id === item.id);
      return found ? old.map((x) => x.id === item.id ? item : x) : [...old, item];
    });
    if (supabase && user) {
      const record = { label: item.label, clean_at: item.time, days_of_week: item.days, enabled: item.enabled };
      if (schedules.some((x) => x.id === item.id)) await supabase.from('cleaning_schedules').update(record).eq('id', item.id);
      else {
        if (device) await supabase.from('cleaning_schedules').insert({ ...record, device_id: device.id });
        else setNotice('Pair an ESP32 before saving a cloud schedule');
      }
    }
    setModal('none'); setNotice('Schedule saved');
  }
  async function removeSchedule(id: string) {
    setSchedules((old) => old.filter((x) => x.id !== id));
    if (supabase && user) await supabase.from('cleaning_schedules').delete().eq('id', id);
    setModal('none'); setNotice('Schedule removed');
  }
  async function toggleSchedule(item: Schedule) {
    const changed = { ...item, enabled: !item.enabled };
    setSchedules((old) => old.map((x) => x.id === item.id ? changed : x));
    if (supabase && user) await supabase.from('cleaning_schedules').update({ enabled: changed.enabled }).eq('id', item.id);
  }
  async function requestClean() {
    if (!safeToClean || cleaning) return;
    if (supabase && user) {
      if (!device) { setNotice('Pair a fan before sending a command'); return; }
      const { error } = await supabase.from('device_commands').insert({ device_id: device.id, command: 'clean_now', requested_by: user.id });
      if (error) { setNotice('Could not queue cleaning request'); return; }
    }
    setCleaning(true); setModal('none'); setNotice('Cleaning request sent to the device');
    if (!cloudEnabled) window.setTimeout(() => { setCleaning(false); setNotice('Demo cleaning cycle complete'); }, 8000);
  }

  if (!authReady) return <div className="auth-loader"><LoaderCircle className="spin" size={25} /> Checking your account…</div>;
  if (cloudEnabled && !user) return <SignIn />;

  const nav = [
    { key: 'overview' as Tab, title: 'Overview', icon: Home },
    { key: 'schedule' as Tab, title: 'Schedule', icon: CalendarDays },
    { key: 'cleaning' as Tab, title: 'Cleaning', icon: Sparkles },
    { key: 'device' as Tab, title: 'Device', icon: Settings2 },
  ];
  const dateText = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  return <div className="app-shell">
    {mobileNav && <button aria-label="Close menu" className="scrim" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-icon"><AirVent size={20} strokeWidth={2.2} /></div><div><b>aircare</b><span>HOME SYSTEMS</span></div></div>
      <div className="house-select"><span className="house-avatar">H</span><span><b>My home</b><small>Fan care system</small></span><ChevronDown size={15} /></div>
      <div className="nav-label">MENU</div>
      <nav>{nav.map(({ key: itemKey, title, icon: Icon }) => <button key={itemKey} onClick={() => { setTab(itemKey); setMobileNav(false); }} className={`nav-item ${tab === itemKey ? 'active' : ''}`}><Icon size={18} /><span>{title}</span>{itemKey === 'schedule' && <span className="nav-count">{schedules.filter((s) => s.enabled).length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Leaf size={17} /></div><b>A cleaner home,<br />without the effort.</b><p>Your fan takes care of itself.</p></div>
        <button className="user-menu" onClick={() => supabase?.auth.signOut()}><div className="user-avatar">{user?.email?.[0]?.toUpperCase() ?? 'A'}</div><span><b>{user?.email ?? 'Alex Morgan'}</b><small>{cloudEnabled ? 'Personal account' : 'Demo account'}</small></span><MoreHorizontal size={19} /></button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="breadcrumbs"><span>My home</span><ChevronRight size={14} /><b>{nav.find((x) => x.key === tab)?.title}</b></div><div className="top-actions"><div className={`connection ${deviceOnline ? 'is-connected' : ''}`}><span className="connection-dot" />{deviceOnline ? 'Fan connected' : cloudEnabled ? 'Device not connected' : 'Demo mode'}</div><button className="icon-btn" aria-label="Settings" onClick={() => setTab('device')}><Settings2 size={18} /></button><div className="top-avatar">{user?.email?.[0]?.toUpperCase() ?? 'A'}</div></div></header>
      {tab === 'overview' && <>
        <section className="welcome-row"><div><div className="eyebrow">{dateText}</div><h1>Your fan, <em>well cared for.</em></h1><p className="page-intro">A little care, on a schedule that works for you.</p></div><button className="button button-dark" onClick={() => { setEditing(null); setModal('schedule'); }}><Plus size={17} /> New schedule</button></section>
        <section className="hero-card"><div className="hero-content"><div className="hero-kicker"><span className="live-pulse" /> NEXT CLEANING</div><h2>{next ? <>{relativeDay(next.day, today)}<br /><span>at {formatTime(next.time)}</span></> : <>Ready when<br /><span>you are.</span></>}</h2><p>{next ? `${next.label} · ${dayNames[next.day]}${next.day === today ? ' · Today' : ''}` : 'Set a schedule or start a cleaning whenever you like.'}</p><button className="button button-light" onClick={() => setTab('schedule')}>View schedule <ArrowUpRight size={15} /></button></div><div className="hero-visual"><div className="sun-orbit orbit-one"/><div className="sun-orbit orbit-two"/><div className="fan-art"><div className="fan-blades"><i/><i/><i/><i/></div><div className="fan-hub"/></div><span className="floating-label"><span className="dot dot-sage"/> Scheduled care</span></div><div className="hero-grain"/></section>
        <section className="stat-grid"><Stat icon={Wifi} label="Device status" value={deviceOnline ? 'Connected' : device ? 'Offline' : 'Not paired'} detail={device?.last_seen && deviceOnline ? `Seen ${new Date(device.last_seen).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : cloudEnabled ? 'Ready to connect' : 'Interactive preview'} type={deviceOnline ? 'green' : 'neutral'} /><Stat icon={Fan} label="Fan status" value={cloudEnabled ? device?.fan_is_stopped ? 'Stopped' : 'Running' : fanStopped ? 'Stopped' : 'Running'} detail={safeToClean ? 'Safe to clean' : 'Safety check needed'} type={safeToClean ? 'green' : 'amber'} /><Stat icon={Clock3} label="This week" value={`${schedules.filter((s) => s.enabled).length} schedules`} detail="Your routine, your way" type="neutral" /></section>
        <div className="section-head"><div><div className="eyebrow">UP NEXT</div><h3>Your cleaning plan</h3></div><button className="text-button" onClick={() => setTab('schedule')}>All schedules <ArrowUpRight size={15}/></button></div>
        <div className="schedule-preview">{schedules.filter((s) => s.enabled).length ? schedules.filter((s) => s.enabled).slice(0, 3).map((s) => <ScheduleRow key={s.id} schedule={s} today={today} onEdit={() => { setEditing(s); setModal('schedule'); }} />) : <div className="empty-state"><CalendarDays size={22}/><span>No active schedules</span><button onClick={() => { setEditing(null); setModal('schedule'); }}>Add one</button></div>}</div>
        <div className="safety-note"><div className="safety-icon"><ShieldCheck size={17}/></div><p><b>Safety comes first.</b> Your fan should be fully stopped before the cleaning mechanism moves. The ESP32 must enforce this locally, even if Wi-Fi drops.</p><Info size={15} className="safety-info" /></div>
      </>}
      {tab === 'schedule' && <><section className="page-title-row"><div><div className="eyebrow">MAKE IT A ROUTINE</div><h1>Cleaning <em>schedule</em></h1><p className="page-intro">Choose when your fan gets a little refresh.</p></div><button className="button button-dark" onClick={() => { setEditing(null); setModal('schedule'); }}><Plus size={17}/> Add schedule</button></section><div className="schedule-list">{schedules.length ? schedules.map((s) => <ScheduleRow key={s.id} schedule={s} today={today} onEdit={() => { setEditing(s); setModal('schedule'); }} onToggle={() => toggleSchedule(s)} />) : <div className="large-empty"><CalendarDays size={26}/><b>No schedules yet</b><span>Build a simple routine for your fan.</span><button className="button button-dark" onClick={() => { setEditing(null); setModal('schedule'); }}><Plus size={17}/> Add a schedule</button></div>}</div><div className="schedule-tip"><div className="tip-glyph"><Clock3 size={17}/></div><span><b>Set it and forget it.</b> Schedules are sent to your ESP32 so cleaning can still run when your phone is away.</span></div></>}
      {tab === 'cleaning' && <><section className="page-title-row"><div><div className="eyebrow">ON YOUR TERMS</div><h1>Give it a <em>refresh.</em></h1><p className="page-intro">Ask your fan to clean now, or check its recent care.</p></div></section><div className="clean-now-card"><div className="clean-now-art"><div className="clean-ring ring-a"/><div className="clean-ring ring-b"/><div className="clean-orb"><Fan size={34}/></div></div><div className="clean-now-copy"><span className="pill pill-sage"><span className="connection-dot"/> {cleaning ? 'Cleaning in progress' : safeToClean ? 'Fan stopped \u00b7 Safe to clean' : 'Fan running \u00b7 Pause to clean'}</span><h2>{cleaning ? 'A little freshening up.' : 'Ready for a cleaner spin?'}</h2><p>{cleaning ? 'Your ESP32 is moving the cleaning mechanism through its cycle.' : 'The fan will stop, confirm it is still, then move the brush along each blade and park it safely.'}</p><button className={`button ${cleaning ? 'button-outline' : 'button-dark'}`} disabled={cleaning || !safeToClean || (cloudEnabled && !deviceOnline)} onClick={() => setModal('clean')}><Sparkles size={17}/>{cleaning ? 'Cycle in progress...' : 'Start cleaning'}</button>{!safeToClean && <div className="inline-warning"><AlertTriangle size={14}/> Cleaning is disabled until the fan is stopped and arms are parked.</div>}</div></div><div className="section-head clean-history-heading"><div><div className="eyebrow">ACTIVITY</div><h3>Recent cleanings</h3></div><button className="text-button"><History size={15}/> View all</button></div><div className="activity-empty"><div className="activity-empty-icon"><History size={18}/></div><div><b>No cleaning activity yet</b><span>Your fan's cleaning history will appear here.</span></div><span className="demo-tag">DEMO</span></div></>}
      {tab === 'device' && <><section className="page-title-row"><div><div className="eyebrow">YOUR HARDWARE</div><h1>Fan <em>connection</em></h1><p className="page-intro">Keep an eye on your ESP32 and fan sensors.</p></div><button className="button button-outline" onClick={() => cloudEnabled ? setPairModal(true) : setIsConnected((x) => !x)}><Link2 size={16}/>{cloudEnabled ? device ? 'Pair another' : 'Pair a device' : isConnected ? 'Disconnect demo' : 'Connect demo device'}</button></section><div className="device-card"><div className="device-card-header"><div className="device-symbol"><AirVent size={22}/></div><div><span className="eyebrow">FAN CONTROLLER</span><h3>{device?.display_name ?? 'Bedroom ceiling fan'}</h3><span className="device-id">ESP32 \u00b7 {device?.device_key ? `${device.device_key.slice(0, 8)}...` : isConnected ? 'Demo device' : 'Not paired'}</span></div><span className={`pill ${deviceOnline ? 'pill-sage' : 'pill-neutral'}`}><span className="connection-dot"/>{deviceOnline ? 'Online' : device ? 'Offline' : 'Not connected'}</span></div><div className="device-divider"/><div className="device-details"><DeviceInfo icon={Activity} label="Fan state" value={cloudEnabled ? device?.fan_is_stopped ? 'Stopped' : 'Running' : fanStopped ? 'Stopped' : 'Running'} note="Motor status"/><DeviceInfo icon={Thermometer} label="Ambient temp" value={device?.temperature_c != null ? `${device.temperature_c}\u00b0 C` : cloudEnabled ? '\u2014' : '27\u00b0 C'} note="Room sensor"/><DeviceInfo icon={Wifi} label="Signal" value={deviceOnline ? 'Strong' : '\u2014'} note={deviceOnline ? 'Wi-Fi connection' : 'Awaiting pairing'}/></div><button className="device-action" onClick={() => cloudEnabled ? setPairModal(true) : setIsConnected((x) => !x)}><span>{cloudEnabled ? 'Set up ESP32 connection' : isConnected ? 'Disconnect demo device' : 'Set up ESP32 connection'}<small>{cloudEnabled ? 'Pair with its device ID and secret' : 'Interactive preview \u00b7 no hardware connected'}</small></span><ChevronRight size={18}/></button></div><div className="section-head"><div><div className="eyebrow">SENSORS</div><h3>Safety checks</h3></div></div><div className="sensor-list"><SensorCheck label="Fan stopped sensor" detail="Confirms blades are no longer moving" ok={cloudEnabled ? Boolean(device?.fan_is_stopped && heartbeatFresh) : fanStopped}/><SensorCheck label="Cleaning arms parked" detail="Arms must retract before fan restart" ok={cloudEnabled ? Boolean(device?.cleaning_arms_parked && heartbeatFresh) : true}/><SensorCheck label="Mechanism ready" detail="Motor and cleaning system response" ok={deviceOnline}/></div><div className="safety-note"><div className="safety-icon"><ShieldCheck size={17}/></div><p><b>Local safety logic is essential.</b> Cloud schedules and app commands are requests only. Firmware should verify fan stoppage and arm position before moving or restarting.</p><Info size={15} className="safety-info" /></div></>}
      <footer className="page-footer"><span>aircare <span>·</span> Thoughtful care for your home</span><span>Prototype dashboard · v0.1</span></footer>
    </main>
    {notice && <div className="toast"><Check size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}
    {modal === 'schedule' && <ScheduleModal initial={editing} onSave={saveSchedule} onDelete={editing ? () => removeSchedule(editing.id) : undefined} onClose={() => setModal('none')}/>}
    {modal === 'clean' && <ConfirmClean onConfirm={requestClean} onClose={() => setModal('none')}/>}{pairModal && <PairDeviceModal onClose={() => setPairModal(false)} onPaired={(value) => { setDevice(value); setPairModal(false); setNotice('ESP32 paired. Start its firmware connection to bring it online.'); }}/>} 
  </div>;
}

function Stat({ icon: Icon, label, value, detail, type }: { icon: typeof Wifi; label: string; value: string; detail: string; type: string }) {
  return <div className="stat-card"><div className={`stat-icon ${type}`}><Icon size={17}/></div><div className="stat-copy"><span>{label}</span><b>{value}</b><small>{detail}</small></div><ArrowUpRight size={15} className="stat-arrow"/></div>;
}
function ScheduleRow({ schedule, today, onEdit, onToggle }: { schedule: Schedule; today: number; onEdit: () => void; onToggle?: () => void }) {
  const days = schedule.days.length === 7 ? 'Every day' : schedule.days.length === 5 && [1, 2, 3, 4, 5].every((x) => schedule.days.includes(x)) ? 'Weekdays' : schedule.days.map((d) => dayNames[d]).join(', ');
  return <div className={`schedule-row ${!schedule.enabled ? 'disabled' : ''}`}><div className="schedule-time"><span>{formatTime(schedule.time)}</span><small>{schedule.enabled && schedule.days.length ? schedule.days.map((x) => (x - today + 7) % 7).sort((a, b) => a - b)[0] === 0 ? 'Today' : 'Weekly' : 'Paused'}</small></div><div className="schedule-line"><span/></div><div className="schedule-name"><b>{schedule.label}</b><small>{days || 'Choose days'}</small></div><div className="schedule-type"><span className="mini-spark"><Sparkles size={13}/></span><span>Auto clean</span></div>{onToggle ? <button aria-label={schedule.enabled ? 'Pause schedule' : 'Enable schedule'} className={`toggle ${schedule.enabled ? 'on' : ''}`} onClick={onToggle}><span/></button> : <button className="row-edit" onClick={onEdit}>Edit <ChevronRight size={15}/></button>}</div>;
}
function DeviceInfo({ icon: Icon, label, value, note }: { icon: typeof Wifi; label: string; value: string; note: string }) { return <div className="device-info"><div className="device-info-icon"><Icon size={16}/></div><span>{label}</span><b>{value}</b><small>{note}</small></div>; }
function SensorCheck({ label, detail, ok }: { label: string; detail: string; ok: boolean }) { return <div className="sensor-check"><div className={`sensor-status ${ok ? 'ok' : 'waiting'}`}>{ok ? <Check size={13}/> : <Clock3 size={13}/>}</div><span><b>{label}</b><small>{detail}</small></span><em>{ok ? 'Ready' : 'Not paired'}</em></div>; }

function ScheduleModal({ initial, onSave, onDelete, onClose }: { initial: Schedule | null; onSave: (s: Schedule) => void; onDelete?: () => void; onClose: () => void }) {
  const [label, setLabel] = useState(initial?.label ?? 'New cleaning');
  const [time, setTime] = useState(initial?.time ?? '08:00');
  const [days, setDays] = useState<number[]>(initial?.days ?? [1, 3, 5]);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const toggleDay = (day: number) => setDays((old) => old.includes(day) ? old.filter((x) => x !== day) : [...old, day].sort());
  return <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title"><div className="modal-header"><div><div className="eyebrow">YOUR ROUTINE</div><h2 id="schedule-dialog-title">{initial ? 'Edit schedule' : 'New schedule'}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></div><label className="field-label">Name it<input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={42} placeholder="e.g. Morning clean" /></label><label className="field-label">Cleaning time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label><div className="field-label">Repeat on<div className="day-picker">{dayNames.map((day, i) => <button key={day} className={days.includes(i) ? 'selected' : ''} onClick={() => toggleDay(i)}>{day.slice(0, 1)}</button>)}</div><small className="field-help">Choose at least one day for automatic cleaning.</small></div><div className="modal-toggle-row"><span><b>Schedule active</b><small>Turn off to pause without deleting</small></span><button className={`toggle ${enabled ? 'on' : ''}`} onClick={() => setEnabled((x) => !x)}><span/></button></div><div className="modal-actions">{onDelete && <button className="delete-button" onClick={onDelete}><Trash2 size={15}/> Delete</button>}<button className="button button-outline" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={!label.trim() || !days.length} onClick={() => onSave({ id: initial?.id ?? crypto.randomUUID(), label: label.trim(), time, days, enabled })}><Check size={16}/> Save schedule</button></div></div></div>;
}
function ConfirmClean({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-card confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="confirm-mark"><Sparkles size={23}/></div><div className="eyebrow">MANUAL CLEAN</div><h2 id="confirm-title">Ready for a refresh?</h2><p>We’ll ask the ESP32 to start a cleaning cycle. The device must confirm the fan has stopped before moving the cleaning arms.</p><div className="confirm-check"><ShieldCheck size={17}/><span>Safety interlocks remain under local ESP32 control.</span></div><div className="modal-actions"><button className="button button-outline" onClick={onClose}>Not now</button><button className="button button-dark" onClick={onConfirm}><Sparkles size={16}/> Request cleaning</button></div></div></div>;
}
function PairDeviceModal({ onClose, onPaired }: { onClose: () => void; onPaired: (device: Device) => void }) {  const [name, setName] = useState('Bedroom ceiling fan');  const [deviceKey, setDeviceKey] = useState('');  const [secret, setSecret] = useState('');  const [busy, setBusy] = useState(false);  const [error, setError] = useState('');  async function pair(e: React.FormEvent) {    e.preventDefault();    if (!supabase) return;    setBusy(true); setError('');    const { data, error: pairError } = await supabase.functions.invoke('fan-device', { body: { action: 'pair', deviceKey: deviceKey.trim(), deviceSecret: secret.trim(), displayName: name.trim(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' } });    setBusy(false);    if (pairError || !data?.device) { setError(data?.error ?? 'Pairing failed. Check the Edge Function and your ESP32 credentials.'); return; }    onPaired({ id: data.device.id, device_key: data.device.device_key ?? deviceKey, display_name: data.device.display_name, is_online: false, fan_is_stopped: false, cleaning_arms_parked: false, temperature_c: null, last_seen: null });  }  return <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="pair-title"><div className="modal-header"><div><div className="eyebrow">DEVICE SETUP</div><h2 id="pair-title">Pair your ESP32</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></div><p className="pair-intro">Enter the device UUID and pairing secret configured in your ESP32 firmware. The secret is stored as a hash and is not kept in the browser.</p><form onSubmit={pair}><label className="field-label">Device name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}/></label><label className="field-label">ESP32 device UUID<input value={deviceKey} onChange={(e) => setDeviceKey(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required autoComplete="off"/></label><label className="field-label">Pairing secret<input value={secret} onChange={(e) => setSecret(e.target.value)} type="password" placeholder="At least 24 characters" required minLength={24} autoComplete="new-password"/></label>{error && <div className="auth-error">{error}</div>}<div className="confirm-check"><ShieldCheck size={16}/><span>Keep the secret private. It authenticates your ESP32 to the device gateway.</span></div><div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={busy || !supabase}>{busy ? 'Pairing…' : 'Pair device'} <ChevronRight size={16}/></button></div></form></div></div>;}function SignIn() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  async function signIn(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return; setBusy(true); setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (authError) setError(authError.message);
  }
  async function signUp() {
    if (!supabase || !email || password.length < 8) { setError('Enter your email and a password with at least 8 characters.'); return; }
    setBusy(true); setError(''); const { error: authError } = await supabase.auth.signUp({ email, password }); setBusy(false);
    if (authError) setError(authError.message); else setSent(true);
  }
  return <div className="auth-page"><div className="auth-card"><div className="brand auth-brand"><div className="brand-icon"><AirVent size={20}/></div><div><b>aircare</b><span>HOME SYSTEMS</span></div></div><div className="eyebrow">WELCOME HOME</div><h1>Good care, <em>starts here.</em></h1><p>Sign in to manage your fan’s cleaning routine.</p>{sent ? <div className="auth-message"><Check size={17}/> Check your email to confirm your account, then sign in.</div> : <form onSubmit={signIn}><label className="field-label">Email address<input autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label className="field-label">Password<input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <div className="auth-error">{error}</div>}<button className="button button-dark auth-submit" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'} <ArrowUpRight size={16}/></button><button type="button" className="signup-link" onClick={signUp}>New to aircare? <b>Create an account</b></button></form>}<span className="auth-foot"><ShieldCheck size={14}/> Your home data is private and protected.</span></div></div>;
}
