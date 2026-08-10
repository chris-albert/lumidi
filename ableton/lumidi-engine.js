// lumidi-engine.js — animation engine for the LumiDI Max for Live device.
//
// Runs inside a [js] object, so this file is ES5 only (Live 11/12 bundle
// Max 8's SpiderMonkey engine — no let/const/arrows).
//
// Protocol (must match hardware/teensy/src/main.cpp):
//   notes 0..56  : note/3 = LED index, note%3 = channel (0=R 1=G 2=B)
//   velocity     : firmware value = velocity*2, except velocity 1 -> 0
//   velocity 0   : is a note-off, firmware ignores it — never used for writes
//   note 127     : latch ("show") the staged frame onto the strip

autowatch = 1;
inlets = 1;
outlets = 3; // 0: "pitch velocity" lists -> [midiformat] -> [midiout]
             // 1: "r g b" floats (0..1) -> [swatch] display
             // 2: debug status ("alive n" / "sent n" / "gate word"), ~1/sec

var NUM_LEDS = 19;
var SHOW_NOTE = 127;

// Velocity-0 note-off after every note-on, DEFERRED one tick so Live can't
// coalesce a zero-length pair (which would eat pixel writes or the show
// latch). REQUIRED for animated modes: Live bookkeeps open notes on its
// MIDI outputs, and streaming the same 57 pitches ~30x/sec with no offs
// grows that set by ~1700 notes/sec until the routing chokes — animations
// froze after a bar or two when this was off. Downstream doesn't care
// either way (the Teensy has no note-off handler, the simulator ignores
// velocity 0); the offs exist purely to keep Live's pipeline healthy.
var SEND_NOTEOFFS = true;

// Animated modes only: re-send the complete frame every N ticks (~2s at
// 30fps) so a message dropped by Live's note pipeline can't leave a pixel
// stale. Solid mode is event-driven (full frame once per change, then
// silence) and never uses this.
var REFRESH_TICKS = 60;

// Static-output debounce — solid mode, or any mode while the transport is
// stopped (animations only run with the song). During a dial drag every
// intermediate value would be a full-frame burst, flooding Live's note
// pipeline and lagging the strip. While values keep arriving we send a
// throttled preview at most every THROTTLE ms; the final frame goes out
// once the value settles for DEBOUNCE ms.
var PUSH_DEBOUNCE_MS = 100;
var PUSH_THROTTLE_MS = 250;

// Menu indices in the device's Sync Rate live.menu, in beats per cycle (4/4).
var SYNC_BEATS = [32, 16, 8, 4, 2, 1, 0.5, 0.25]; // 8bars..1/16

// --- parameters (pushed from the patch via [prepend <name>]) ---
var p = {
  anim: 0,        // 0 solid, 1 pulse, 2 chase, 3 rainbow, 4 strobe,
                  // 5 scanner, 6 breathe, 7 wipe, 8 theater, 9 burst,
                  // 10 hue drift, 11 sparkle, 12 fire, 13 flip, 14 wave
  hue: 0,         // degrees 0..360
  sat: 100,       // percent
  brightness: 80, // percent, master dimmer
  rate: 1,        // Hz, free-run speed
  sync: 0,        // 0/1
  syncrate: 3,    // index into SYNC_BEATS (default 1 bar)
  dir: 0,         // 0 forward, 1 reverse
  on: 1           // 0 -> blackout and stop emitting
};

// --- transport state (banged into us right before each tick) ---
var transTicks = 0;   // raw ticks, 480 per beat
var transTempo = 120; // BPM
var transPlaying = 0;

// --- animation state ---
var phase = 0;            // 0..1 position in the animation cycle
var phaseRaw = 0;         // unwrapped cycles — noise modes hash its integer part
var lastTickMs = 0;
var deviceActive = 1;     // Live's device activator (live.thisdevice outlet 1)
var ticksSinceRefresh = 0;
var pushDirty = true;     // static output: full frame pending
var pushDirtyMs = 0;      // when the pending change last arrived (0 = send now)
var lastPushMs = 0;       // last static frame send, for the drag throttle
var frame = [];           // staged RGB values 0..255, length NUM_LEDS*3
var lastVel = [];         // last velocity sent per channel, -1 = never sent
var pendingOffs = [];     // note-offs owed for the previous batch's note-ons

// A (re)compile — device load, or autowatch hot-reload after the file on
// disk changed (editing, git branch switches) — resets all of the state
// above to defaults, but Live does NOT re-push the dials' values. Without a
// resync the engine renders with stale defaults (e.g. a Sat change draws at
// hue 0 = red, not the Hue dial's color) until every control is touched.
// On the first tick after a compile we ask the patch (outlet 2 "resync")
// to send `outputvalue` to every control so they re-push what they hold.
var needsResync = true;

// --- debug state (reported on outlet 2 about once a second) ---
var DBG_STATUS_TICKS = 30;
var dbgAlive = 0;         // total metro bangs — a frozen counter means metro/js is dead
var dbgSent = 0;          // outlet-0 messages since the last status report
var dbgSinceStatus = 0;
var lastError = "";       // last exception thrown by tick(), "" when healthy
resetBuffers();

function resetBuffers() {
  var i;
  frame = [];
  lastVel = [];
  for (i = 0; i < NUM_LEDS * 3; i++) {
    frame[i] = 0;
    lastVel[i] = -1;
  }
}

// --- parameter messages from the patch ---
function anim(i)       { p.anim = i | 0; invalidate(); pushNow(); }
function hue(v)        { p.hue = v; sendSwatch(); pushSoon(); }
function sat(v)        { p.sat = v; sendSwatch(); pushSoon(); }
function brightness(v) { p.brightness = v; pushSoon(); }
function rate(v)       { p.rate = v; }
function sync(v)       { p.sync = v | 0; }
function syncrate(i)   { p.syncrate = i | 0; }
function dir(i)        { p.dir = i | 0; pushSoon(); }

// debounced: dial drags settle before the final frame goes out
function pushSoon() { pushDirty = true; pushDirtyMs = Date.now(); }
// immediate: discrete events (anim switch, re-enable) skip the debounce
function pushNow()  { pushDirty = true; pushDirtyMs = 0; }

function on(v) {
  p.on = v | 0;
  if (!p.on) blackout();
  else { invalidate(); pushNow(); } // full resend on re-enable
}

// Live's device activator (live.thisdevice outlet 1)
function active(v) {
  deviceActive = v | 0;
  if (!deviceActive) blackout();
  else { invalidate(); pushNow(); }
}

function invalidate() {
  var i;
  for (i = 0; i < NUM_LEDS * 3; i++) lastVel[i] = -1;
}

function ticks(t)   { transTicks = t; }
function tempo(b)   { if (b > 0) transTempo = b; }

function playing(s) {
  s = s | 0;
  if (s === transPlaying) return;
  transPlaying = s;
  // stop: push one final frame at the frozen phase, then go silent.
  // start: full resend to self-heal anything dropped while static.
  invalidate();
  pushNow();
}

// --- main loop, driven by [metro 33] (arrives as a bang) ---
function bang() {
  dbgAlive++;
  if (needsResync) {
    needsResync = false;
    outlet(2, "resync"); // synchronously triggers every control to re-push
    dbg("lumidi-engine: fresh compile — requested parameter resync");
  }
  try {
    tick();
    lastError = "";
  } catch (err) {
    var msg = String(err && err.message ? err.message : err);
    if (msg !== lastError) {
      lastError = msg;
      dbg("lumidi-engine: tick failed: " + msg);
    }
  }
  dbgSinceStatus++;
  if (dbgSinceStatus >= DBG_STATUS_TICKS) {
    dbgSinceStatus = 0;
    sendStatus();
  }
}

// which gate (if any) is blocking output right now
function gateWord() {
  if (lastError) return "error";
  if (!deviceActive) return "bypassed";
  if (!p.on) return "off";
  if (p.anim === 0) return "solid";
  if (!transPlaying) return "waiting-for-play";
  return "playing";
}

function sendStatus() {
  outlet(2, "alive", dbgAlive);
  outlet(2, "sent", dbgSent);
  outlet(2, "gate", gateWord());
  dbgSent = 0;
}

// send the message "status" to the js object (or use the Max window after
// right-click -> Open Max Window) for a full state dump
function status() {
  dbg("lumidi-engine status: gate=" + gateWord()
    + " lastError=" + (lastError ? "[" + lastError + "]" : "none")
    + " | anim=" + p.anim + " hue=" + Math.round(p.hue) + " sat=" + Math.round(p.sat)
    + " bright=" + Math.round(p.brightness) + " rate=" + p.rate
    + " sync=" + p.sync + " syncrate=" + p.syncrate + " dir=" + p.dir + " on=" + p.on
    + " | active=" + deviceActive + " playing=" + transPlaying
    + " ticks=" + Math.round(transTicks) + " tempo=" + transTempo
    + " phase=" + (Math.round(phase * 1000) / 1000)
    + " | alive=" + dbgAlive + " pendingOffs=" + pendingOffs.length);
}

function dbg(s) {
  if (typeof post === "function") post(s + "\n");
}

function tick() {
  var now = Date.now();
  var dt = lastTickMs ? (now - lastTickMs) / 1000 : 0;
  lastTickMs = now;
  if (dt < 0 || dt > 0.25) dt = 0.033; // reload / stall guard

  flushOffs(); // release the previous batch's note-offs (even when gated)

  if (!p.on || !deviceActive) return;

  if (p.anim === 0 || !transPlaying) {
    // static output — solid mode, or any animation while the song is
    // stopped (animations only move with the transport; the frame freezes
    // at the current phase). Event-driven: send the full frame once per
    // change, then nothing. Mid-drag values only get a throttled preview;
    // the final frame goes out once the value has settled.
    if (pushDirty) {
      var settled = now - pushDirtyMs >= PUSH_DEBOUNCE_MS;
      var preview = now - lastPushMs >= PUSH_THROTTLE_MS;
      if (settled || preview) {
        if (settled) pushDirty = false;
        lastPushMs = now;
        invalidate(); // full undiffed send so a prior drop can't leave a pixel stale
        renderFrame();
        sendFrame();
      }
    }
    return;
  }

  pushDirty = false; // streaming applies param changes every frame anyway

  ticksSinceRefresh++;
  if (ticksSinceRefresh >= REFRESH_TICKS) {
    ticksSinceRefresh = 0;
    invalidate();
  }

  advancePhase(dt);
  renderFrame();
  sendFrame();
}

// Only called while the transport is playing.
function advancePhase(dt) {
  var beatsPerCycle = SYNC_BEATS[p.syncrate] || 4;
  if (p.sync) {
    // beat-locked: derive phase directly from Live's transport position
    phaseRaw = (transTicks / 480) / beatsPerCycle;
  } else {
    phaseRaw += dt * p.rate;
  }
  phase = phaseRaw - Math.floor(phaseRaw);
}

// --- animations: fill frame[] with 0..255 RGB ---
function renderFrame() {
  var master = clamp(p.brightness / 100, 0, 1);
  var s = clamp(p.sat / 100, 0, 1);
  var base = hsvToRgb(p.hue, s, 1);
  var i, level, rgb, pos, d, h, t, step, idx, n0, n1;

  for (i = 0; i < NUM_LEDS; i++) {
    if (p.anim === 0) { // solid
      rgb = base;
    } else if (p.anim === 1) { // pulse: peaks on the beat (phase 0)
      level = 0.5 + 0.5 * Math.cos(2 * Math.PI * phase);
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 2) { // chase: comet head with fading tail
      pos = phase * NUM_LEDS;
      d = (p.dir ? pos - i : i - pos);         // pixels behind the head
      d -= Math.floor(d / NUM_LEDS) * NUM_LEDS; // wrap to 0..NUM_LEDS
      level = Math.max(0, 1 - d / (NUM_LEDS * 0.5));
      level = level * level;                    // sharper falloff
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 3) { // rainbow: hue gradient scrolling along the strip
      h = p.hue + (i / NUM_LEDS) * 360 + (p.dir ? -1 : 1) * phase * 360;
      rgb = hsvToRgb(h, s, 1);
    } else if (p.anim === 4) { // strobe: hard pulse — full on for the first
             // half of the cycle (lands on the beat, like pulse's peak), then off
      level = phase < 0.5 ? 1 : 0;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 5) { // scanner: comet bounces end-to-end, no wrap
      pos = (1 - Math.abs(2 * phase - 1)) * (NUM_LEDS - 1);
      level = Math.max(0, 1 - Math.abs(i - pos) / 3);
      level = level * level;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 6) { // breathe: eased pulse that dwells near dark
      level = 0.5 + 0.5 * Math.cos(2 * Math.PI * phase);
      level = level * level * level;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 7) { // wipe: fill from one end over the first half
             // of the cycle, then the lit block drains out the far end
      idx = p.dir ? NUM_LEDS - 1 - i : i;
      if (phase < 0.5) level = idx < phase * 2 * NUM_LEDS ? 1 : 0;
      else             level = idx >= (phase - 0.5) * 2 * NUM_LEDS ? 1 : 0;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 8) { // theater: marquee — every 3rd pixel, stepping
             // once per third of the cycle
      step = Math.floor(phase * 3);
      level = (((i + (p.dir ? -step : step)) % 3 + 3) % 3) === 0 ? 1 : 0;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 9) { // burst: soft-edged disk expands from the
             // center each cycle, fading as it grows
      d = Math.abs(i - (NUM_LEDS - 1) / 2);
      level = clamp(phase * (NUM_LEDS / 2 + 1) - d, 0, 1) * (1 - phase);
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 10) { // hue drift: solid color, hue rotates the
             // full wheel once per cycle (offset from the Hue dial)
      h = p.hue + (p.dir ? -1 : 1) * phase * 360;
      rgb = hsvToRgb(h, s, 1);
    } else if (p.anim === 11) { // sparkle: random pixels flash and decay over
             // a dim background; hashed so a transport position always
             // renders the same frame (beat-sync/loop safe)
      t = phaseRaw * 8; // 8 sparkle generations per cycle
      step = Math.floor(t);
      level = rand01(i + step * NUM_LEDS) > 0.8 ? 1 - (t - step) : 0.06;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else if (p.anim === 12) { // fire: per-pixel value noise, hue shifted
             // warmer where brighter; same deterministic hash as sparkle
      t = phaseRaw * 8;
      step = Math.floor(t);
      n0 = rand01(i + step * NUM_LEDS);
      n1 = rand01(i + (step + 1) * NUM_LEDS);
      level = 0.25 + 0.75 * (n0 + (n1 - n0) * (t - step));
      rgb = hsvToRgb(p.hue + (level - 0.5) * 50, s, 1);
      rgb = [rgb[0] * level, rgb[1] * level, rgb[2] * level];
    } else if (p.anim === 13) { // flip: left/right halves swap each half-cycle
      level = (((i < NUM_LEDS / 2 ? 1 : 0) ^ (phase < 0.5 ? 1 : 0) ^ (p.dir ? 1 : 0)) & 1) ? 0 : 1;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    } else { // wave: two brightness crests scrolling along the strip
      level = 0.5 + 0.5 * Math.cos(2 * Math.PI * (2 * i / NUM_LEDS + (p.dir ? phase : -phase)));
      level = level * level;
      rgb = [base[0] * level, base[1] * level, base[2] * level];
    }
    frame[i * 3]     = rgb[0] * master;
    frame[i * 3 + 1] = rgb[1] * master;
    frame[i * 3 + 2] = rgb[2] * master;
  }
}

// --- MIDI output ---
function sendFrame() {
  flushOffs(); // previous batch's offs always precede this batch's ons
  var i, vel, changed = false;
  for (i = 0; i < NUM_LEDS * 3; i++) {
    vel = toVel(frame[i]);
    if (vel !== lastVel[i]) {
      noteOut(i, vel);
      lastVel[i] = vel;
      changed = true;
    }
  }
  if (changed) noteOut(SHOW_NOTE, 64);
}

function blackout() {
  var i;
  for (i = 0; i < NUM_LEDS * 3; i++) frame[i] = 0;
  sendFrame(); // diffed: already-dark channels send nothing
}

function noteOut(note, vel) {
  outlet(0, note, vel);
  dbgSent++;
  if (SEND_NOTEOFFS) pendingOffs.push(note);
}

function flushOffs() {
  var i;
  for (i = 0; i < pendingOffs.length; i++) outlet(0, pendingOffs[i], 0);
  dbgSent += pendingOffs.length;
  pendingOffs = [];
}

// 0..255 brightness -> velocity, honoring the firmware's quirks:
// velocity 0 is a note-off (never send), velocity 1 means "write 0".
function toVel(b) {
  if (b < 2) return 1;
  var v = Math.round(b / 2);
  if (v < 2) v = 2;
  if (v > 127) v = 127;
  return v;
}

// --- helpers ---
function sendSwatch() {
  var rgb = hsvToRgb(p.hue, clamp(p.sat / 100, 0, 1), 1);
  outlet(1, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
}

function clamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

// deterministic hash -> 0..1 (GLSL-style sin hash); seeded from pixel index
// and cycle step so beat-synced noise replays identically after a loop jump
function rand01(n) {
  var x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// h in degrees (any), s/v 0..1 -> [r, g, b] 0..255
function hsvToRgb(h, s, v) {
  h = h - Math.floor(h / 360) * 360;
  var c = v * s;
  var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  var m = v - c;
  var r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// posted on every compile so hot-reloads are visible in the Max window
dbg("lumidi-engine loaded");
