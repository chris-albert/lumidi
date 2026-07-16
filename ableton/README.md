ok# LumiDI Max for Live device

A MIDI-effect device that animates the LED strip by streaming pixel frames (~30fps)
as raw MIDI notes in the firmware's protocol. All animation logic lives in
`lumidi-engine.js`; the patcher (`lumidi.maxpat`) is just controls + plumbing.

## Build

```sh
python3 build_amxd.py   # wraps lumidi.maxpat -> LumiDI.amxd (git-ignored)
```

The build also copies the luMIDI logo (`web/favicon.svg`) here as
`lumidi-logo.svg` (git-ignored) for the device's `[fpic]` to display.

The `.amxd` must stay in this folder — an unfrozen device finds
`lumidi-engine.js` and `lumidi-logo.svg` by looking next to itself.

## Use

1. Drag `LumiDI.amxd` onto a MIDI track in Live.
2. Set the track's **MIDI To** to the Teensy's MIDI port (hardware) or an IAC bus (simulator).
3. Controls: **On**, **Animation** (Solid / Pulse / Chase / Rainbow), **Direction**,
   **Hue / Sat / Bright** (color; swatch shows the result), **Rate** (free-run speed),
   **Sync + SyncRate** (lock the animation cycle to Live's transport, e.g. 1 bar).
   All parameters are automatable.

## Development

- Edit `lumidi-engine.js` in any editor — `autowatch = 1` hot-reloads it while the
  device is open (touch a control afterwards to re-push parameter state).
- Edit the UI by opening the device in Max (click the device's edit button in Live).
  If you save from Max, the `.amxd` on disk changes — extract the JSON back into
  `lumidi.maxpat` (the ptch chunk is the patcher JSON; see `build_amxd.py`).
- **Do not freeze the device**: freezing embeds a copy of the js that silently
  shadows the file on disk.
- The engine is testable without Max: see the harness pattern in the repo history
  (stub `outlet()`, load the file, feed it `tick`/parameter messages).

## Protocol notes

- Never send velocity 0 as a pixel write — it's a MIDI note-off and the firmware
  ignores it. Velocity 1 is the firmware's "write zero" escape.
- `SEND_NOTEOFFS` in `lumidi-engine.js` pairs every note-on with a velocity-0
  note-off so notes don't hang in Live's pipeline. The Teensy and the simulator
  both ignore them. Set it to `false` to A/B test if anything misbehaves.
- The engine only sends channels that changed, but re-sends the complete frame
  every ~2s (`REFRESH_TICKS`) so a message dropped by Live's note pipeline
  can't leave a pixel stale.
- Live's device activator gates the stream: deactivating blacks out the strip
  and stops emitting; reactivating forces a full-frame resend.
