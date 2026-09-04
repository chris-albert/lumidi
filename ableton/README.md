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
4. Controls: **On**, **Animation** (Solid / Pulse / Chase / Rainbow / Strobe /
   Scanner / Breathe / Wipe / Theater / Burst / Hue Drift / Sparkle / Fire /
   Flip / Wave), **Direction** (reverses chase, rainbow, scanner, wipe,
   theater, hue drift, wave; swaps flip's starting side), **Hue / Sat /
   Bright** (color; swatch shows the result), **Rate** (free-run speed),
   **Sync + SyncRate** (lock the animation cycle to Live's transport, e.g. 1 bar),
   **Pixels** (the strip's length, 1–42), **Strip** (0 = standalone, 1–8 = this
   strip's position in a multi-strip layout — see below).
   All parameters are automatable. Sparkle and Fire use deterministic noise
   hashed from the transport position, so a beat-synced loop replays the
   same twinkles every pass.
5. Animations only run while the song is playing — stopped transport freezes the
   frame (color changes still apply). Sync is on by default, so the animation
   cycle follows Live's tempo and song position; turn Sync off to free-run at
   the Rate dial's speed instead (still gated by the transport; the free-run
   cycle restarts from zero whenever the song starts).

## Multiple strips

Each Teensy gets its own MIDI track with its own LumiDI device, and each
device's **Pixels** is set to its strip's length. The firmware always drives
42 pixels, so no per-unit firmware build is needed — Pixels is the only place
the length lives. With **Strip** at 0 every device is standalone: it renders
its animation over its own strip and knows nothing about the others.

To run one animation across several strips, number them **Strip** 1, 2, 3 …
in physical order. Devices with a non-zero Strip discover each other inside
Live (each engine writes its number and length into a `Global("lumidi")`
namespace, which Max shares between every `[js]` instance, and reads the
others back once per tick). Together they form one canvas — the strips laid
end to end, ordered by number — and every animation is rendered on that
canvas, each device emitting only its own slice: a chase runs off the end of
strip 1 straight onto strip 2, a rainbow is one gradient across all of them.
Each device keeps its own controls, so for a seamless picture give them the
same Animation, Direction, Sync and Rate (or map them to one macro).

Details worth knowing:

- Nothing is stored beyond the two parameters: the layout is rebuilt every
  tick, so load order doesn't matter and gaps in the numbering are fine.
- A deleted or bypassed-and-removed device drops out of the layout after
  about a second and the rest re-flow.
- Two devices on the same number don't fight: the later one stays standalone
  and posts `2 conflict` (for strip 2) to the Max window.
- Alignment: with Sync on, every device derives its phase from the song
  position, so they are always in step. With Sync off the phase is integrated
  from transport time and restarted at every play, so devices present when
  the song starts stay in step; a device added mid-song lines up at the next
  play.
- The web simulator is one strip per page: open one tab per IAC bus to watch
  a layout.

## Development

- Edit `lumidi-engine.js` in any editor — `autowatch = 1` hot-reloads it while the
  device is open. A reload resets the engine's internal parameter state, so on
  its first tick after any compile the engine sends `resync` out its status
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

Right-click the device title bar → **Open Max Window**:
every engine hot-reload posts `lumidi-engine loaded` followed by
`fresh compile — requested parameter resync` (the engine re-pulling the
dials' values; if the resync line is missing, the device was built from a
stale patcher — re-drag the `.amxd`), tick exceptions are posted once per
distinct error, and sending the message `status` to the js object dumps
the complete engine state (params, transport, gate, counters).

If output ever goes missing again, split "device broken" from "Live eating
notes" by comparing `sentThisSec` in the `status` dump (messages the engine
emitted so far this second) against MIDI Monitor.app on the IAC bus (first
suspect: the MIDI From feedback loop — Use, step 3).
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
