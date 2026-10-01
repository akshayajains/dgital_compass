# Aircare fan care

A small, standalone React dashboard prototype for the Crompton ESP32 fan-cleaning concept. It lives in this folder so the existing Digital Compass app remains intact.

## What is here

- Responsive dashboard with **Overview**, **Schedule**, **Cleaning**, and **Device** tabs.
- Add, edit, pause, and delete weekly cleaning schedules.
- Manual cleaning request with a safety confirmation; cloud mode queues a command for the ESP32.
- Supabase Auth, Postgres, Realtime schedule/device updates, owner-scoped RLS, and an Edge Function gateway.
- An interactive demo mode when Supabase credentials are not configured. Demo controls never operate hardware.

## Run the preview

From this folder:

```sh
npm install
npm run dev
```

The existing workspace already has React and Vite installed at its root, but this app has its own pinned dependency manifest. `npm install` generates the app-specific lockfile.

## Android app

This project includes its own Capacitor Android wrapper (`com.aircare.fancare`). It does not use the Digital Compass Android project.

```sh
npm run mobile:sync
npm run mobile:open
```

Open the `fan-control/android` project in Android Studio to run it on a phone or build a debug APK. Set the Supabase values in `.env` before the production build so the installed app can sign in and reach the backend. The web dashboard remains responsive for small screens, and the Android shell uses the same screens and Supabase data flow.

## Connect Supabase

1. Create a Supabase project and enable Email/Password Auth.
2. In **Project Settings → API**, copy the Project URL and publishable key. Add them to a local `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Do not put a service-role key in this file.
3. In **Integrations → Data API settings**, expose the `public` schema. New projects may not expose it automatically.
4. Apply `supabase/schema.sql` in the Supabase SQL Editor. It enables RLS, creates owner policies and explicit authenticated grants, and adds the tables to Realtime.
5. Deploy `supabase/functions/fan-device` with the Supabase CLI. The function uses the platform's `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` secrets. The service-role key must stay in Edge Function secrets. `supabase/config.toml` disables gateway JWT verification only because the function has two auth paths: verified user sessions for pairing and per-device credentials for ESP32 calls.
6. Restart the Vite dev server after changing `.env`.

The Supabase CLI is not present in this workspace, so the schema is provided as an SQL setup file rather than a generated CLI migration. Before tracking migrations, create one with `supabase migration new fan_control_core` and move the reviewed SQL into that generated file.

## ESP32 gateway contract

Pairing requires a UUID device key plus a high-entropy secret (at least 24 characters; generate 32 random bytes). The function stores only a SHA-256 hash of the device secret. Provision the same UUID and secret in the ESP32 firmware and keep them out of source control.

Call the deployed `fan-device` Edge Function with the matching `x-device-key` and `x-device-secret` headers:

| Action | JSON body | Purpose |
| --- | --- | --- |
| `telemetry` | `{ "action":"telemetry", "fanStopped":true, "armsParked":true, "temperatureC":27 }` | Send sensor status every 15–30 seconds. |
| `schedule` | `{ "action":"schedule" }` | Fetch active schedules and the device time zone; the firmware should keep and run the schedule locally. |
| `next-command` | `{ "action":"next-command" }` | Poll for the next queued manual request. |
| `command-result` | `{ "action":"command-result", "commandId":"…", "status":"completed", "result":{} }` | Report `running`, `completed`, or `failed`. |

For long-term use, provision a time source on the ESP32, check schedules against the returned IANA time zone, and keep a safe local copy when Wi-Fi is unavailable. The Edge Function and database gate stale or unsafe commands, but the firmware must independently verify that the fan has stopped and every cleaning arm is parked before moving the mechanism or restarting the fan. The web page cannot substitute for motor drivers, limit switches, an interlock, or physical safety validation.

## Current integration limits

No Supabase project was connected during this scaffold, and no ESP32 firmware or wire protocol was present in the workspace. Cloud writes, pairing, and device telemetry become active after the setup steps above; physical behavior still depends on matching firmware. The dashboard currently supports one selected fan per account.
