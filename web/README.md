# LumiDI strip simulator

A browser page that renders the LED strip from the same MIDI stream the Teensy
consumes, so you can test the Max for Live device (or any raw MIDI) without hardware.

## Run

Web MIDI needs a secure context, so serve the folder instead of opening the file:

```sh
cd web
python3 -m http.server 8000
```

Open <http://localhost:8000> in **Chrome** (Web MIDI required) and allow MIDI access.

## Use

- Pick the MIDI input (an enabled IAC bus is auto-selected — see the root README
  for one-time IAC setup) and point your Live track's **MIDI To** at that bus.
- **LEDs** sets the strip length (default 19, max 42 — the protocol's note-space limit).
- The footer logs decoded pixel writes; the header shows latched frames per second.
