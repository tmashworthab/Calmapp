# Pause

A break-glass tool for the minutes between wanting to send something and
sending it.

It is not a therapy app and not a chatbot. It does not analyse the situation,
form a view on who is right, or tell you what anyone else is thinking. It
assumes you are activated and that your judgement is temporarily impaired, and
it has one job: put time between the feeling and the action.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

For the production build:

```bash
npm run build        # static files in out/
npm start            # serves out/ at http://localhost:3000
```

`npm start` runs a zero-dependency static server (`scripts/serve.mjs`). Set
`PORT` to use a different port. Because the build is a plain static export, the
contents of `out/` can also be dropped onto any static host, or added to a phone
home screen from the browser's share menu — it installs as a standalone app.

After the first load it works with no connection at all; a service worker caches
the shell, and there is nothing else to fetch.

## Deploy

`railway.json` and `nixpacks.toml` build the static export and serve it with
`scripts/serve.mjs`, which honours Railway's injected `PORT` and binds
`0.0.0.0`. Point a Railway project at this repo and the branch; there is nothing
to configure and no environment variables to set — the app has no secrets and
makes no external calls.

Once it is on an HTTPS URL, open it on the phone and use **Add to Home Screen**
(Safari) or **Install app** (Chrome). It then launches full-screen and works
with no connection.

> On iOS, a home-screen app has its own storage, separate from Safari's. Install
> it before you start writing anything down, or those entries won't follow it.

## Privacy

- Everything is stored in `localStorage` on the device.
- No account, no cloud, no analytics, no external requests of any kind.
- The build is a static export, so there is no server or API route to send
  anything to and nothing to log.
- **Settings → Export my data** writes a JSON file in the browser.
  **Settings → Delete all data** removes everything.

## What's in it

| Screen | What it does |
| --- | --- |
| Home | `PAUSE.`, the three urges, and the red **BREAK GLASS** button |
| Emergency mode | `STOP.`, then a countdown showing one short statement at a time |
| Grounding | Feet on the floor with a 4-in/6-out breathing circle, 5‑4‑3, unclench |
| Journal | Facts, feelings and urges kept apart. Nothing is analysed |
| Paused messages | Paste what you want to send; it locks for 30 minutes |
| Emergency rules | The ten rules, reachable from every screen |
| Reset | Stop, breathe out, put the phone down, walk |
| Calm mode | Talk later / write it down / do nothing |
| Patterns | Counts and average intensity. No streaks, points or badges |

### The message lock

The core mechanism. A message you save is hidden and cannot be copied for the
lock period — the text is not rendered at all until it expires. Afterwards you
can keep it paused, delete it, or review it against a checklist. The app never
generates a replacement message; if you rewrite it, you write it yourself.

The pause length and the lock period can be made **longer** in Settings, never
shorter. Those floors are enforced in the data layer as well as the UI.

## Accessibility

- Dark, high contrast (body text 7.9:1, captions 5.8:1 against the background).
- Every target is at least 44px; primary buttons are 64px.
- Full keyboard navigation, a visible focus ring, and `Escape` to step back.
  `Escape` is ignored inside a text field so it can't discard what you're typing.
- Screen headings take focus on each screen change; the countdown announces once
  a minute rather than once a second.
- `prefers-reduced-motion` replaces the breathing animation with a written cue
  and a count, and stops all transitions.

## Stack

Next.js 16 (App Router, static export), React 19, Tailwind v4, TypeScript. No
runtime dependencies beyond React and Next itself.

```
app/
  components/
    screens/       one file per group of screens
    ui.tsx         buttons, fields, layout primitives
  lib/
    content.ts     every word the app says
    store.ts       localStorage, one key, no network
    actions.ts     every mutation
    nav.ts         the screen list
scripts/serve.mjs  static server for `npm start`
```

All of the copy lives in `app/lib/content.ts`. The rules that govern that copy
are written at the top of the file; anything added there should follow them.
