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
outlets = 2; // 0: "pitch velocity" lists -> [midiformat] -> [midiout]
             // 1: "r g b" floats (0..1) -> [swatch] display

var NUM_LEDS = 19;
var SHOW_NOTE = 127;

// Emit a paired velocity-0 note-off after every note-on so notes never hang
// in Live's pipeline. The Teensy has no note-off handler and the simulator
// ignores velocity 0, so this is invisible downstream. Set false to A/B test.
var SEND_NOTEOFFS = true;

// Animated modes only: re-send the complete frame every N ticks (~2s at
// 30fps) so a message dropped by Live's note pipeline can't leave a pixel
// stale. Solid mode is event-driven (full frame once per change, then
// silence) and never uses this.
var REFRESH_TICKS = 60;

// Solid mode debounce: during a dial drag every intermediate value would be
// a full-frame burst, flooding Live's note pipeline and lagging the strip.
// While values keep arriving we send a throttled preview at most every
// THROTTLE ms; the final frame goes out once the value settles for DEBOUNCE ms.
var SOLID_DEBOUNCE_MS = 100;
var SOLID_THROTTLE_MS = 250;

// Menu indices in the device's Sync Rate live.menu, in beats per cycle (4/4).
var SYNC_BEATS = [32, 16, 8, 4, 2, 1, 0.5, 0.25]; // 8bars..1/16

// --- parameters (pushed from the patch via [prepend <name>]) ---
var p = {
  anim: 0,        // 0 solid, 1 pulse, 2 chase, 3 rainbow
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
var lastTickMs = 0;
var deviceActive = 1;     // Live's device activator (live.thisdevice outlet 1)
var ticksSinceRefresh = 0;
var solidDirty = true;    // solid mode: full frame pending
var solidDirtyMs = 0;     // when the pending change last arrived (0 = send now)
var lastSolidSendMs = 0;  // last solid frame send, for the drag throttle
var frame = [];           // staged RGB values 0..255, length NUM_LEDS*3
var lastVel = [];         // last velocity sent per channel, -1 = never sent
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
function anim(i)       { p.anim = i | 0; invalidate(); solidNow(); }
function hue(v)        { p.hue = v; sendSwatch(); solidSoon(); }
function sat(v)        { p.sat = v; sendSwatch(); solidSoon(); }
function brightness(v) { p.brightness = v; solidSoon(); }
function rate(v)       { p.rate = v; }
function sync(v)       { p.sync = v | 0; }
function syncrate(i)   { p.syncrate = i | 0; }
function dir(i)        { p.dir = i | 0; }

// debounced: dial drags settle before the final frame goes out
function solidSoon() { solidDirty = true; solidDirtyMs = Date.now(); }
// immediate: discrete events (anim switch, re-enable) skip the debounce
function solidNow()  { solidDirty = true; solidDirtyMs = 0; }

function on(v) {
  p.on = v | 0;
  if (!p.on) blackout();
  else { invalidate(); solidNow(); } // full resend on re-enable
}

// Live's device activator (live.thisdevice outlet 1)
function active(v) {
  deviceActive = v | 0;
  if (!deviceActive) blackout();
  else { invalidate(); solidNow(); }
}

function invalidate() {
  var i;
  for (i = 0; i < NUM_LEDS * 3; i++) lastVel[i] = -1;
}

function ticks(t)   { transTicks = t; }
function tempo(b)   { if (b > 0) transTempo = b; }
function playing(s) { transPlaying = s | 0; }

// --- main loop, driven by [metro 33] (arrives as a bang) ---
function bang() { tick(); }

function tick() {
  var now = Date.now();
  var dt = lastTickMs ? (now - lastTickMs) / 1000 : 0;
  lastTickMs = now;
  if (dt < 0 || dt > 0.25) dt = 0.033; // reload / stall guard

  if (!p.on || !deviceActive) return;

  if (p.anim === 0) {
    // solid is event-driven: send the full frame once per change, then
    // nothing. Mid-drag values only get a throttled preview; the final
    // frame goes out once the value has settled.
    if (solidDirty) {
      var settled = now - solidDirtyMs >= SOLID_DEBOUNCE_MS;
      var preview = now - lastSolidSendMs >= SOLID_THROTTLE_MS;
      if (settled || preview) {
        if (settled) solidDirty = false;
        lastSolidSendMs = now;
        invalidate(); // full undiffed send so a prior drop can't leave a pixel stale
        renderFrame();
        sendFrame();
      }
    }
    return;
  }

  ticksSinceRefresh++;
  if (ticksSinceRefresh >= REFRESH_TICKS) {
    ticksSinceRefresh = 0;
    invalidate();
  }

  advancePhase(dt);
  renderFrame();
  sendFrame();
}

function advancePhase(dt) {
  var beatsPerCycle = SYNC_BEATS[p.syncrate] || 4;
  if (p.sync && transPlaying) {
    // beat-locked: derive phase directly from Live's transport position
    phase = (transTicks / 480) / beatsPerCycle;
  } else if (p.sync) {
    // transport stopped: free-run at the tempo-implied rate
    phase += dt * (transTempo / 60) / beatsPerCycle;
  } else {
    phase += dt * p.rate;
  }
  phase -= Math.floor(phase);
}

// --- animations: fill frame[] with 0..255 RGB ---
function renderFrame() {
  var master = clamp(p.brightness / 100, 0, 1);
  var s = clamp(p.sat / 100, 0, 1);
  var base = hsvToRgb(p.hue, s, 1);
  var i, level, rgb, pos, d, h;

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
    } else { // rainbow: hue gradient scrolling along the strip
      h = p.hue + (i / NUM_LEDS) * 360 + (p.dir ? -1 : 1) * phase * 360;
      rgb = hsvToRgb(h, s, 1);
    }
    frame[i * 3]     = rgb[0] * master;
    frame[i * 3 + 1] = rgb[1] * master;
    frame[i * 3 + 2] = rgb[2] * master;
  }
}

// --- MIDI output ---
function sendFrame() {
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
  if (SEND_NOTEOFFS) outlet(0, note, 0);
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
