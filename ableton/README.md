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
4. Animations only run while the song is playing — stopped transport freezes the
   frame (color changes still apply). Sync is on by default, so the animation
   cycle follows Live's tempo and song position; turn Sync off to free-run at
   the Rate dial's speed instead (still gated by the transport).

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
- The strip only renders when note 127 ("show") arrives — pixel writes just
  stage. The engine ends every batch with note 127, and the simulator logs it
  (`note 127 (show) -> latch frame`) so you can verify latches are arriving.
- `SEND_NOTEOFFS` in `lumidi-engine.js` sends a velocity-0 note-off for every
  note-on so notes don't hang in Live's pipeline. Offs are *deferred* to the
  start of the next batch/tick — never sent in the same instant as their
  note-on, because Live can drop zero-length notes (which would eat pixel
  writes and the show latch). The Teensy and the simulator both ignore them.
  Set it to `false` to A/B test if anything misbehaves.
- **Solid** is event-driven: a color/brightness change sends the complete
  frame once, then the device goes silent — no idle MIDI stream. The full
  undiffed send means a previously dropped message can't leave a pixel stale.
- Dial drags on static output are debounced (`PUSH_DEBOUNCE_MS`): intermediate
  values only get a throttled preview frame every `PUSH_THROTTLE_MS`, and the
  final frame goes out once the dial settles — dragging can't back up the
  pipeline. Discrete events (anim switch, re-enable) skip the debounce.
- Animated modes stream only while Live's transport is playing; stopping sends
  one frame frozen at the current phase, then goes silent like solid mode.
- **Animated modes** stream diffed frames per tick and additionally re-send
  the complete frame every ~2s (`REFRESH_TICKS`) to self-heal drops in
  Live's note pipeline.
- Live's device activator gates the stream: deactivating blacks out the strip
  and stops emitting; reactivating forces a full-frame resend.
