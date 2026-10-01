// LumiDI stage simulator — many virtual strips placed on a 2D stage, each one
// decoding the same MIDI note protocol as the single-strip simulator (see
// ../simulator/simulator.js and hardware/teensy/src/main.cpp):
//   notes 0..N*3-1 : note/3 = LED, note%3 = R/G/B channel
//   value          : velocity*2, except velocity*2 == 2 means 0 (firmware quirk)
//   velocity 0     : note-off, ignored (as the firmware does)
//   note 127       : latch the staged frame to the display
//
// A real Teensy is a whole MIDI port and ignores the MIDI channel. Here a
// device is addressed by input port + channel, so a layout can share one IAC
// bus (each Live track's MIDI To on its own channel) instead of needing one
// bus per strip.
'use strict';

const MAX_NOTE_LEDS = 42; // notes 0..125; 127 is the show note
const STORE_KEY = 'lumidi-stage';
const SAVED_FIELDS = ['id', 'name', 'input', 'channel', 'leds', 'x', 'y', 'rot'];

const stageEl = document.getElementById('stage');
const panelEl = document.getElementById('panel');
const statsEl = document.getElementById('stats');
const bannerEl = document.getElementById('banner');

// each device: the SAVED_FIELDS (x/y = strip center in stage px, rot in
// degrees, channel 0 = any) plus runtime state added by mount()
let devices = [];
let selectedId = null;
let midi = null;
let msgs = 0;

function clamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

function save() {
  const out = devices.map(d => Object.fromEntries(SAVED_FIELDS.map(k => [k, d[k]])));
  localStorage.setItem(STORE_KEY, JSON.stringify(out));
}

function inputNames() {
  return midi ? [...midi.inputs.values()].map(i => i.name) : [];
}

function newDevice() {
  const n = devices.length;
  const used = new Set(devices.map(d => d.channel));
  let channel = 0;
  for (let c = 1; c <= 16 && !channel; c++) if (!used.has(c)) channel = c;
  // same bus as the previous strip, else whatever the single-strip simulator
  // last listened on, else the first IAC bus
  const input = n ? devices[n - 1].input
    : localStorage.getItem('lumidi-input') || inputNames().find(name => /IAC/i.test(name)) || '';
  const rect = stageEl.getBoundingClientRect();
  return {
    id: 1 + Math.max(0, ...devices.map(d => d.id)),
    name: `Strip ${n + 1}`,
    input,
    channel,
    leds: 19,
    x: Math.round(rect.width / 2),
    y: Math.round(clamp(80 + n * 50, 0, rect.height)),
    rot: 0,
  };
}

// --- stage ---

function mount(d) {
  d.staging = new Uint8Array(MAX_NOTE_LEDS * 3);
  d.shown = new Uint8Array(MAX_NOTE_LEDS * 3); // last latched frame
  d.dirty = false;
  d.frames = 0;
  d.msgs = 0;

  d.el = document.createElement('div');
  d.el.className = 'device';
  d.nameEl = document.createElement('span');
  d.nameEl.className = 'name';
  d.rotateEl = document.createElement('div');
  d.rotateEl.className = 'rotate';
  d.rotateEl.title = 'Drag to rotate (shift snaps to 15°)';
  stageEl.appendChild(d.el);
  buildLeds(d);
  place(d);

  d.el.addEventListener('pointerdown', (e) => {
    select(d.id);
    d.el.setPointerCapture(e.pointerId);
    const rotating = e.target === d.rotateEl;
    const rect = stageEl.getBoundingClientRect();
    const dx = e.clientX - rect.left - d.x, dy = e.clientY - rect.top - d.y;
    d.el.onpointermove = (m) => {
      const px = m.clientX - rect.left, py = m.clientY - rect.top;
      if (rotating) {
        // the handle sits on the strip's axis past the last LED
        let rot = Math.atan2(py - d.y, px - d.x) * 180 / Math.PI;
        if (m.shiftKey) rot = Math.round(rot / 15) * 15;
        d.rot = (Math.round(rot) + 360) % 360;
        d.rotInput.value = d.rot;
      } else {
        d.x = Math.round(clamp(px - dx, 0, rect.width));
        d.y = Math.round(clamp(py - dy, 0, rect.height));
      }
      place(d);
    };
    e.preventDefault();
  });
  const end = () => { d.el.onpointermove = null; save(); };
  d.el.addEventListener('pointerup', end);
  d.el.addEventListener('pointercancel', end);
}

function buildLeds(d) {
  d.el.textContent = '';
  d.ledEls = [];
  for (let i = 0; i < d.leds; i++) {
    const el = document.createElement('div');
    el.className = 'led';
    d.el.appendChild(el);
    d.ledEls.push(el);
  }
  d.el.append(d.nameEl, d.rotateEl);
  d.dirty = true;
}

function place(d) {
  d.el.style.left = `${d.x}px`;
  d.el.style.top = `${d.y}px`;
  d.el.style.transform = `translate(-50%, -50%) rotate(${d.rot}deg)`;
  // counter-rotated so the name stays upright at any strip angle
  d.nameEl.style.transform = `translate(-50%, -50%) rotate(${-d.rot}deg)`;
  d.nameEl.textContent = d.name;
}

// The MIDI handler runs per message (100s/sec per animating strip) and only
// touches buffers; latched frames reach the DOM here, once per display frame.
function paint() {
  for (const d of devices) {
    if (!d.dirty) continue;
    d.dirty = false;
    for (let i = 0; i < d.leds; i++) {
      const r = d.shown[i * 3], g = d.shown[i * 3 + 1], b = d.shown[i * 3 + 2];
      const el = d.ledEls[i];
      el.style.background = `rgb(${r}, ${g}, ${b})`;
      const glow = Math.max(r, g, b);
      el.style.boxShadow = glow > 8
        ? `0 0 ${4 + glow / 12}px ${1 + glow / 40}px rgba(${r}, ${g}, ${b}, 0.8)`
        : 'none';
    }
  }
  requestAnimationFrame(paint);
}

function select(id) {
  selectedId = id;
  for (const d of devices) {
    d.el.classList.toggle('selected', d.id === id);
    d.cardEl.classList.toggle('selected', d.id === id);
  }
}

// --- panel ---

function renderPanel() {
  panelEl.textContent = '';
  if (!devices.length) {
    const empty = document.createElement('div');
    empty.id = 'empty';
    empty.textContent = 'No devices yet — press "+ Add device", then drag it into place on the stage.';
    panelEl.appendChild(empty);
  }
  const names = inputNames();
  for (const d of devices) {
    const card = document.createElement('div');
    card.className = 'card';
    card.addEventListener('pointerdown', () => select(d.id));
    const field = (label, control) => {
      const l = document.createElement('span');
      l.textContent = label;
      card.append(l, control);
      return control;
    };

    const name = field('Name', document.createElement('input'));
    name.type = 'text';
    name.value = d.name;
    name.addEventListener('input', () => { d.name = name.value; place(d); save(); });

    const input = field('MIDI input', document.createElement('select'));
    input.appendChild(new Option('— none —', ''));
    for (const n of names) input.appendChild(new Option(n, n));
    // keep a saved port that is currently unplugged selectable
    if (d.input && !names.includes(d.input)) input.appendChild(new Option(`${d.input} (missing)`, d.input));
    input.value = d.input;
    input.addEventListener('change', () => { d.input = input.value; save(); });

    const channel = field('Channel', document.createElement('select'));
    channel.appendChild(new Option('any', 0));
    for (let c = 1; c <= 16; c++) channel.appendChild(new Option(c, c));
    channel.value = d.channel;
    channel.addEventListener('change', () => { d.channel = +channel.value; save(); });

    const number = (label, key, min, max, apply) => {
      const el = field(label, document.createElement('input'));
      el.type = 'number';
      el.min = min;
      el.max = max;
      el.value = d[key];
      el.addEventListener('change', () => {
        d[key] = clamp(Math.round(el.valueAsNumber) || 0, min, max);
        el.value = d[key];
        apply();
        save();
      });
      return el;
    };
    number('LEDs', 'leds', 1, MAX_NOTE_LEDS, () => buildLeds(d));
    d.rotInput = number('Rotation °', 'rot', 0, 359, () => place(d));

    const row = document.createElement('div');
    row.className = 'row';
    d.statsEl = document.createElement('span');
    d.statsEl.className = 'stats';
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      d.el.remove();
      devices = devices.filter(o => o !== d);
      save();
      renderPanel();
    });
    row.append(d.statsEl, remove);
    card.appendChild(row);

    d.cardEl = card;
    panelEl.appendChild(card);
  }
  select(selectedId);
  renderStats();
}

function renderStats() {
  const names = inputNames();
  for (const d of devices) {
    let text = `${d.frames} fps · ${d.msgs} msg/s`;
    let warn = true;
    if (!d.input) text = 'no MIDI input';
    else if (!names.includes(d.input)) text = 'MIDI input missing';
    else warn = false;
    d.statsEl.textContent = text;
    d.statsEl.classList.toggle('warn', warn);
    d.frames = 0;
    d.msgs = 0;
  }
  statsEl.textContent = `${devices.length} device${devices.length === 1 ? '' : 's'} · ${msgs} msg/s`;
  msgs = 0;
}

// --- MIDI ---

function onMidiMessage(portName, e) {
  const [status, note, velocity] = e.data;
  msgs++;
  if ((status & 0xf0) !== 0x90 || velocity === 0) return; // note-ons only, vel 0 = note-off
  const channel = (status & 0x0f) + 1;
  for (const d of devices) {
    if (d.input !== portName || (d.channel && d.channel !== channel)) continue;
    d.msgs++;
    if (note === 127) {
      d.shown.set(d.staging);
      d.dirty = true;
      d.frames++;
    } else if (note < d.leds * 3) {
      const v = velocity * 2;
      d.staging[note] = v === 2 ? 0 : v; // firmware's "velocity 1 writes zero" escape
    }
  }
}

// every port is always listened to; devices filter by port name + channel
function attachInputs() {
  for (const input of midi.inputs.values()) {
    input.onmidimessage = (e) => onMidiMessage(input.name, e);
  }
}

function banner(msg) {
  bannerEl.textContent = msg;
  bannerEl.style.display = msg ? 'block' : 'none';
}

async function init() {
  try {
    devices = JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    devices = [];
  }
  devices.forEach(mount);
  renderPanel();
  requestAnimationFrame(paint);
  setInterval(renderStats, 1000);

  document.getElementById('add-device').addEventListener('click', () => {
    const d = newDevice();
    devices.push(d);
    mount(d);
    selectedId = d.id;
    save();
    renderPanel();
  });

  if (!navigator.requestMIDIAccess) {
    banner('This browser has no Web MIDI support — use Chrome, and serve this page from localhost (not file://).');
    return;
  }
  try {
    midi = await navigator.requestMIDIAccess();
    attachInputs();
    renderPanel();
    midi.onstatechange = () => {
      // ports come and go silently (sleep/wake, Live start/stop, IAC edits)
      attachInputs();
      renderPanel();
    };
  } catch (err) {
    banner(`MIDI access denied: ${err.message}`);
  }
}

init();
