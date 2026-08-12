# LumiDI web site + strip simulator

- **`index.html`** — the landing page: what LumiDI is, how to use the device,
  parts + circuit to build one, and a download link for `LumiDI.amxd`.
- **`virtual-device.js`** — the landing page's interactive device: it runs the
  real `ableton/lumidi-engine.js` in the page (Max shim: stubbed `outlet()`, a
  33ms loop for the metro/transport) and decodes its MIDI onto a virtual strip.
  It depends on the engine's message-handler names — if one is renamed there,
  update `HANDLERS`.
- **`simulator/`** — a browser page that renders the LED strip from the same MIDI
  stream the Teensy consumes, so you can test the Max for Live device (or any raw
  MIDI) without hardware.

The landing page references files that are copied in at deploy time (see
`.github/workflows/deploy-pages.yml`) and git-ignored here:

```sh
python3 ableton/build_amxd.py && cp ableton/LumiDI.amxd web/
cp ableton/lumidi-engine.js web/
cp hardware/teensy/circuit.svg web/
```

## Run

Web MIDI needs a secure context, so serve the folder instead of opening the file:

```sh
cd web
python3 -m http.server 8000
```

Open <http://localhost:8000/simulator/> in **Chrome** (Web MIDI required) and allow
MIDI access (the landing page is at the root).

## Use

- Pick the MIDI input (an enabled IAC bus is auto-selected — see the root README
  for one-time IAC setup) and point your Live track's **MIDI To** at that bus.
- **LEDs** sets the strip length (default 19, max 42 — the protocol's note-space limit).
- The footer logs decoded pixel writes; the header shows latched frames per second.

## Debugging "I turned a knob and the UI ignored it"

The chain is: **device engine → Live's MIDI To → IAC bus → Chrome Web MIDI →
this page**. Every link has a counter — turn the knob once and walk them in
order:

1. **Device "sent" number** (debug readout on the device, see
   `ableton/README.md`): no burst → the engine never sent. Read the gate word
   and the Max window.
2. **This page's `msg/s`**: stays 0 while the device's "sent" bursts → the
   messages are lost between Live and Chrome. Check the stats line for
   **"no MIDI input!"** and the log for a timestamped
   `midi input "...": disconnected` line (ports drop silently on sleep/wake or
   IAC changes). To split the bus in half, open MIDI Monitor.app on the IAC
   bus: notes visible there = Chrome-side problem; not visible = Live-side.
   The #1 Live-side cause (found the hard way): the track's **MIDI From must
   be "No Input"** — on "All Ins" the track hears its own IAC output, the
   feedback loop trips Live's protection, and output is silently clamped
   for seconds at a time. Also check: wrong MIDI To, IAC bus disabled.
3. **`msg/s` counts but `staged` sticks** and the stats line turns red
   ("no show!") → pixel writes arrived but the note-127 show didn't. Press
   **Show** to latch manually and see what was staged.
4. **`staged` returns to 0 but the color is wrong** → the frame latched but
   the engine rendered stale parameters. Check the Max window for the
   `requested parameter resync` line — if it's missing after a reload, the
   device is a pre-resync build; rebuild and re-drag the `.amxd`.

Every log line is timestamped (`HH:MM:SS.t`), and each latched frame logs a
one-line summary (`show: latched N writes · led0 rgb(...)`) so you can match
the moment you turned the knob against what actually arrived.
