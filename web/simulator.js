// LumiDI strip simulator — renders the same MIDI note protocol the Teensy
// firmware consumes (see hardware/teensy/src/main.cpp):
//   notes 0..N*3-1 : note/3 = LED, note%3 = R/G/B channel
//   value          : velocity*2, except velocity*2 == 2 means 0 (firmware quirk)
//   velocity 0     : note-off, ignored (as the firmware does)
//   note 127       : latch the staged frame to the display
'use strict';

const MAX_NOTE_LEDS = 42; // notes 0..125; 127 is the show note

const stripEl = document.getElementById('strip');
const inputSel = document.getElementById('midi-input');
const countEl = document.getElementById('led-count');
const statsEl = document.getElementById('stats');
const logEl = document.getElementById('log');
const bannerEl = document.getElementById('banner');
const swatchEl = document.getElementById('color-swatch');
const swatchInfoEl = document.getElementById('color-info');

let numLeds = 19;
let staging = new Uint8Array(MAX_NOTE_LEDS * 3);
let ledEls = [];
let activeInput = null;
let frames = 0;
let msgs = 0;
let staged = 0;     // pixel writes since the last latch — stuck > 0 means note 127 went missing
let lastShowAt = 0; // Date.now() of the last latch, 0 = never
let logLines = [];
let logDirty = false;

function buildStrip() {
  numLeds = Math.min(MAX_NOTE_LEDS, Math.max(1, countEl.valueAsNumber || 19));
  stripEl.textContent = '';
  ledEls = [];
  for (let i = 0; i < numLeds; i++) {
    const el = document.createElement('div');
    el.className = 'led';
    stripEl.appendChild(el);
    ledEls.push(el);
  }
}

function latch() {
  staged = 0;
  lastShowAt = Date.now();
  for (let i = 0; i < numLeds; i++) {
    const r = staging[i * 3], g = staging[i * 3 + 1], b = staging[i * 3 + 2];
    const el = ledEls[i];
    // exact decoded color — no minimum floor, it would desaturate everything
    el.style.background = `rgb(${r}, ${g}, ${b})`;
    const glow = Math.max(r, g, b);
    el.style.boxShadow = glow > 8
      ? `0 0 ${6 + glow / 8}px ${2 + glow / 24}px rgba(${r}, ${g}, ${b}, 0.8)`
      : 'none';
  }
  updateColorPanel();
  frames++;
}

// square panel showing LED 0's exact decoded color, with numbers to compare
// against the device's Hue/Sat/Bright dials
function updateColorPanel() {
  const r = staging[0], g = staging[1], b = staging[2];
  swatchEl.style.background = `rgb(${r}, ${g}, ${b})`;
  const [h, s, v] = rgbToHsv(r, g, b);
  swatchInfoEl.textContent = `rgb(${r}, ${g}, ${b}) · H ${h}° S ${s}% V ${v}%`;
}

function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  const d = max - min;
  let h = 0;
  if (d > 0) {
    const rr = r / 255, gg = g / 255, bb = b / 255;
    if (max === rr) h = 60 * (((gg - bb) / d) % 6);
    else if (max === gg) h = 60 * ((bb - rr) / d + 2);
    else h = 60 * ((rr - gg) / d + 4);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [Math.round(h), Math.round(s * 100), Math.round(max * 100)];
}

function onMidiMessage(e) {
  const [status, note, velocity] = e.data;
  msgs++;
  if ((status & 0xf0) !== 0x90 || velocity === 0) return; // note-ons only, vel 0 = note-off
  if (note === 127) {
    latch();
    log('note 127 (show)      -> latch frame');
    return;
  }
  if (note < numLeds * 3) {
    let v = velocity * 2;
    if (v === 2) v = 0; // firmware's "velocity 1 writes zero" escape
    staging[note] = v;
    staged++;
    log(`note ${String(note).padStart(3)} vel ${String(velocity).padStart(3)}  -> led ${Math.floor(note / 3)} ${'RGB'[note % 3]} = ${v}`);
  }
}

// The MIDI handler runs per message (100s/sec while animating) — touching the
// DOM there stalls the page and backs up the whole MIDI event queue. log()
// only buffers; a 100ms interval in init() renders the log at most 10x/sec.
function log(line) {
  logLines.push(line);
  if (logLines.length > 400) logLines = logLines.slice(-200);
  logDirty = true;
}

function renderLog() {
  if (!logDirty) return;
  logDirty = false;
  logEl.textContent = logLines.slice(-200).join('\n');
  logEl.scrollTop = logEl.scrollHeight;
}

function banner(msg) {
  bannerEl.textContent = msg;
  bannerEl.style.display = msg ? 'block' : 'none';
}

function selectInput(midi, id) {
  if (activeInput) activeInput.onmidimessage = null;
  activeInput = null;
  if (id) {
    activeInput = midi.inputs.get(id) || null;
    if (activeInput) {
      activeInput.onmidimessage = onMidiMessage;
      localStorage.setItem('lumidi-input', activeInput.name);
      log(`--- listening on "${activeInput.name}" ---`);
    }
  }
}

function refreshInputs(midi) {
  const remembered = localStorage.getItem('lumidi-input');
  inputSel.textContent = '';
  inputSel.appendChild(new Option('— none —', ''));
  let pick = '';
  for (const input of midi.inputs.values()) {
    inputSel.appendChild(new Option(input.name, input.id));
    if (input.name === remembered || (!pick && /IAC/i.test(input.name))) pick = input.id;
  }
  inputSel.value = pick;
  selectInput(midi, pick);
}

async function init() {
  buildStrip();
  countEl.addEventListener('change', buildStrip);
  document.getElementById('force-show').addEventListener('click', () => {
    log('--- manual show ---');
    latch();
  });
  setInterval(renderLog, 100);
  setInterval(() => {
    // staged writes with no latch for a while = the note-127 show never
    // arrived — the strip (and the hardware) would sit on a stale frame
    const noShow = staged > 0 && (!lastShowAt || Date.now() - lastShowAt > 1500);
    let text = `${frames} fps · ${msgs} msg/s · staged ${staged}`;
    if (noShow) {
      const since = lastShowAt ? `${Math.round((Date.now() - lastShowAt) / 1000)}s ago` : 'never';
      text += ` — no show! (last: ${since})`;
    }
    statsEl.textContent = text;
    statsEl.classList.toggle('warn', noShow);
    frames = 0;
    msgs = 0;
  }, 1000);

  if (!navigator.requestMIDIAccess) {
    banner('This browser has no Web MIDI support — use Chrome, and serve this page from localhost (not file://).');
    return;
  }
  try {
    const midi = await navigator.requestMIDIAccess();
    refreshInputs(midi);
    midi.onstatechange = () => refreshInputs(midi);
    inputSel.addEventListener('change', () => selectInput(midi, inputSel.value));
  } catch (err) {
    banner(`MIDI access denied: ${err.message}`);
  }
}

init();
