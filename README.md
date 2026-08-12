# LumiDI

Control a WS2812B LED strip from Ableton Live via a Teensy 4.0 running USB-MIDI firmware.

```
Ableton Live
  └─ LumiDI (Max for Live device — animation engine, streams pixel frames as MIDI notes)
       │ track "MIDI To"
       ├──> Teensy 4.0 USB-MIDI ──> LED strip          (the real thing)
       └──> IAC Driver bus ──> web simulator (Chrome)  (for testing, no hardware)
```

## Components

- **`hardware/teensy/`** — PlatformIO firmware. Notes 0–56 set one color channel of one pixel (note/3 = LED, note%3 = R/G/B, value = velocity×2, velocity 1 writes 0), note 127 latches the frame.
- **`ableton/`** — the LumiDI Max for Live MIDI effect: solid / pulse / chase / rainbow animations, HSV color, brightness, speed, tempo sync. See [ableton/README.md](ableton/README.md).
- **`web/`** — the landing page plus a browser strip simulator (under `/simulator/`) that listens to the same MIDI stream. See [web/README.md](web/README.md).

## One-time macOS setup for the simulator (IAC bus)

1. Open **Audio MIDI Setup** → Window → **Show MIDI Studio**.
2. Double-click **IAC Driver**, check **Device is online** (an "IAC Driver Bus 1" port appears).
3. In Live → Settings → Link/MIDI, make sure the IAC output is **not** used as a Track input elsewhere (avoid feedback loops); no other config needed.

## Workflow

1. Build the device: `python3 ableton/build_amxd.py`, then drag `ableton/LumiDI.amxd` onto a MIDI track.
2. Set that track's **MIDI To** → *IAC Driver Bus 1* and open the simulator (see `web/README.md`) to preview.
3. Switch **MIDI To** → *Teensy MIDI* to drive the physical strip.
