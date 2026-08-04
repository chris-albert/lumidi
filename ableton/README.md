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
  device is open. A reload resets the engine's internal parameter state, so on
  its first tick after any compile the engine sends `resync` out its debug
  outlet and the patch answers by sending `outputvalue` to every control —
  the dials re-push their values automatically (no need to touch a control).
  Note `bang` would NOT work for this: it flips `live.toggle` state.
- Edit the UI by opening the device in Max (click the device's edit button in Live).
  If you save from Max, the `.amxd` on disk changes — extract the JSON back into
  `lumidi.maxpat` (the ptch chunk is the patcher JSON; see `build_amxd.py`).
- **Do not freeze the device**: freezing embeds a copy of the js that silently
  shadows the file on disk.
- The engine is testable without Max: see the harness pattern in the repo history
  (stub `outlet()`, load the file, feed it `tick`/parameter messages).

## Debugging

The device shows a live debug readout on its right edge:

- **top number ("alive")** — total engine ticks; it should climb continuously.
  Frozen = the metro or the js object is dead (check the Max window).
- **bottom number ("sent")** — MIDI messages emitted in the last second.
  Solid color sitting idle = 0; changing a color = a brief burst; a playing
  animation ≈ 3500.
- **gate word** — what the engine is doing / what's blocking output:
  `solid` (idle, event-driven), `playing` (streaming animation),
  `waiting-for-play` (animation selected but Live's transport is stopped),
  `off` (On toggle), `bypassed` (device activator), `error` (tick threw —
  the exception is posted to the Max window).

For more detail, right-click the device title bar → **Open Max Window**:
every engine hot-reload posts `lumidi-engine loaded` followed by
`fresh compile — requested parameter resync` (the engine re-pulling the
dials' values; if the resync line is missing, the device was built from a
stale patcher — re-drag the `.amxd`), tick exceptions are posted once per
distinct error, and sending the message `status` to the js object dumps
the complete engine state (params, transport, gate, counters).

The Max window also gets one line per event-driven MIDI batch (solid /
stopped-transport output; streaming animation is not posted):

```
burst: 57 on + 0 off + 1 show | gate=solid hue=240 sat=100 bright=80
burst: 0 on + 58 off + 0 show | gate=solid hue=240 sat=100 bright=80
```

A knob turn must post exactly that shape: the full frame (57 ons + 1 show),
then its deferred note-offs alone one tick later. Use it to split "the
device is broken" from "Live is eating the notes": if the burst line says
57/1 but MIDI Monitor.app on the IAC bus saw fewer, the loss is downstream
of the device; if the line itself is short or says `ONS WITHOUT SHOW`, the
engine broke mid-frame (gate will read `error` with the exception above).

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
