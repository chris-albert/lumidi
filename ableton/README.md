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
3. Set the track's **MIDI From to "No Input"**. This is not optional: with
   MIDI From "All Ins" and Monitor In, the track hears the IAC bus it is
   sending to — the device's own output loops back through the `midiin →
   midiout` passthrough and Live's feedback protection silently clamps the
   track's output for seconds at a time (knob changes appear to be randomly
   ignored downstream while the engine logs perfect bursts).
4. Controls: **On**, **Animation** (Solid / Pulse / Chase / Rainbow / Strobe —
   Strobe is the hard pulse: full on for the first half of each cycle, no fade), **Direction**,
   **Hue / Sat / Bright** (color; swatch shows the result), **Rate** (free-run speed),
   **Sync + SyncRate** (lock the animation cycle to Live's transport, e.g. 1 bar).
   All parameters are automatable.
5. Animations only run while the song is playing — stopped transport freezes the
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

If output ever goes missing again, split "device broken" from "Live eating
notes" by comparing the device's "sent" counter against MIDI Monitor.app on
the IAC bus (first suspect: the MIDI From feedback loop — Use, step 3).
The repo history (PR #12) has a per-burst Max-window accounting mode that
can be restored for deeper digging.

## Protocol notes

- Never send velocity 0 as a pixel write — it's a MIDI note-off and the firmware
  ignores it. Velocity 1 is the firmware's "write zero" escape.
- The strip only renders when note 127 ("show") arrives — pixel writes just
  stage. The engine ends every batch with note 127, and the simulator logs it
  (`note 127 (show) -> latch frame`) so you can verify latches are arriving.
- `SEND_NOTEOFFS` in `lumidi-engine.js` sends a velocity-0 note-off for every
  note-on, *deferred* to the next tick — never in the same instant as its
  note-on, because Live can drop zero-length notes (which would eat pixel
  writes or the show latch). The offs are **required for animated modes**:
  Live bookkeeps open notes on its MIDI outputs, and streaming 57 pitches
  ~30x/sec with no offs grew that set until the routing choked — animations
  froze after a bar or two when this flag was briefly off. Downstream never
  sees a difference (the Teensy has no note-off handler; the simulator
  ignores velocity 0).
- **A misrouted track can silently eat entire bursts**: with MIDI From set
  to "All Ins" the track hears its own IAC output, the feedback loop trips
  Live's protection, and output is clamped for seconds at a time (the
  device emits perfectly while MIDI Monitor on the bus sees zero). The fix
  is MIDI From "No Input" (Use, step 3).
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
