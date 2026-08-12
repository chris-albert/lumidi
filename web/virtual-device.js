// virtual-device.js — the landing page's interactive LumiDI device.
//
// Runs the REAL animation engine (lumidi-engine.js, copied next to this file
// at deploy time) inside the page: a tiny Max shim provides outlet()/post,
// a 33ms loop stands in for the patcher's [metro 33] + [transport], and the
// engine's MIDI notes are decoded with the firmware's rules (note/3 = LED,
// note%3 = channel, value = velocity*2 with velocity 1 -> 0, note 127 shows)
// onto the virtual strip.
//
// Depends on the engine's message-handler names (anim, hue, ... bang); if a
// handler is renamed there, update HANDLERS below.

(function () {
  var NUM_LEDS = 19;
  var SHOW_NOTE = 127;
  var HANDLERS = ['anim', 'hue', 'sat', 'brightness', 'rate', 'sync',
                  'syncrate', 'dir', 'on', 'active', 'ticks', 'tempo',
                  'playing', 'bang'];

  var root = document.getElementById('virtual-device');
  if (!root) return;

  var state = {
    anim: 3,        // Rainbow — instant gratification
    hue: 0,
    sat: 88,
    brightness: 100,
    rate: 3,
    sync: 1,
    syncrate: 3,    // 1 bar
    dir: 0,
    on: 1
  };
  var playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bpm = 120;
  var engine = null;

  // --- virtual strip: decode the engine's MIDI like the firmware does ---
  var staged = [];
  for (var s = 0; s < NUM_LEDS * 3; s++) staged[s] = 0;

  var stripEl = document.getElementById('vd-strip');
  var leds = [];
  for (var l = 0; l < NUM_LEDS; l++) {
    var led = document.createElement('span');
    led.className = 'vd-led';
    stripEl.appendChild(led);
    leds.push(led);
  }

  function onNote(note, vel) {
    if (vel === 0) return; // note-off — firmware ignores it
    if (note === SHOW_NOTE) { latch(); return; }
    if (note >= NUM_LEDS * 3) return;
    staged[note] = vel === 1 ? 0 : Math.min(255, vel * 2);
  }

  function latch() {
    for (var i = 0; i < NUM_LEDS; i++) {
      var r = staged[i * 3], g = staged[i * 3 + 1], b = staged[i * 3 + 2];
      leds[i].style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
      leds[i].style.boxShadow =
        '0 0 9px 1px rgba(' + r + ',' + g + ',' + b + ',0.55)';
    }
  }

  var gateEl = document.getElementById('vd-gate');
  function outlet(n, a, b, c) {
    if (n === 0) onNote(a, b);
    else if (n === 2) {
      if (a === 'resync') pushAll(); // fresh compile asks the "patch" to re-push
      else if (a === 'gate') gateEl.textContent = b;
    }
    // outlet 1 (swatch) is covered by the color picker itself
  }

  function pushAll() {
    engine.anim(state.anim);
    engine.hue(state.hue);
    engine.sat(state.sat);
    engine.brightness(state.brightness);
    engine.rate(state.rate);
    engine.sync(state.sync);
    engine.syncrate(state.syncrate);
    engine.dir(state.dir);
    engine.on(state.on);
    engine.active(1);
  }

  function send(name, value) {
    state[name] = value;
    if (engine) engine[name](value);
  }

  // --- dials ---
  var ARC = 'M 10.69 33.31 A 16 16 0 1 1 33.31 33.31';
  function makeDial(parent, label, min, max, param, fmt) {
    var el = document.createElement('div');
    el.className = 'vd-dial';
    el.innerHTML =
      '<span class="vd-dial-label">' + label + '</span>' +
      '<svg viewBox="0 0 44 44">' +
        '<circle cx="22" cy="22" r="14" fill="#1c1c1c" stroke="#4d4d4d"/>' +
        '<path d="' + ARC + '" fill="none" stroke="#4d4d4d" stroke-width="3" stroke-linecap="round"/>' +
        '<path class="vd-arc" d="' + ARC + '" fill="none" stroke="#63d8ea" stroke-width="3" stroke-linecap="round" pathLength="100"/>' +
        '<g class="vd-needle"><line x1="22" y1="22" x2="22" y2="9" stroke="#e6e6e6" stroke-width="2.5" stroke-linecap="round"/></g>' +
      '</svg>' +
      '<span class="vd-dial-value"></span>';
    parent.appendChild(el);
    var arc = el.querySelector('.vd-arc');
    var needle = el.querySelector('.vd-needle');
    var valueEl = el.querySelector('.vd-dial-value');

    function render() {
      var frac = (state[param] - min) / (max - min);
      arc.setAttribute('stroke-dasharray', (frac * 100) + ' 100');
      needle.setAttribute('transform', 'rotate(' + (-135 + 270 * frac) + ' 22 22)');
      valueEl.textContent = fmt(state[param]);
    }

    var dragY = null, dragVal = 0;
    el.addEventListener('pointerdown', function (e) {
      dragY = e.clientY;
      dragVal = state[param];
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (dragY === null) return;
      var v = dragVal + (dragY - e.clientY) / 150 * (max - min);
      send(param, Math.min(max, Math.max(min, v)));
      render();
      if (param === 'hue' || param === 'sat') renderMarker();
    });
    el.addEventListener('pointerup', function () { dragY = null; });
    el.addEventListener('pointercancel', function () { dragY = null; });

    render();
    return { render: render };
  }

  var round = function (v) { return String(Math.round(v)); };
  var dialsEl = document.getElementById('vd-dials');
  var hueDial = makeDial(dialsEl, 'Hue', 0, 360, 'hue', round);
  var satDial = makeDial(dialsEl, 'Sat', 0, 100, 'sat', round);
  makeDial(dialsEl, 'Bright', 0, 100, 'brightness', round);
  makeDial(dialsEl, 'Rate', 0.1, 8, 'rate', function (v) {
    return String(Math.round(v * 10) / 10);
  });

  // --- color picker (hue across, saturation down-to-up) ---
  var picker = document.getElementById('vd-picker');
  var marker = document.getElementById('vd-marker');
  function renderMarker() {
    marker.style.left = (state.hue / 360 * 100) + '%';
    marker.style.top = ((1 - state.sat / 100) * 100) + '%';
  }
  var picking = false;
  function pick(e) {
    var r = picker.getBoundingClientRect();
    var x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    var y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    send('hue', x * 360);
    send('sat', (1 - y) * 100);
    hueDial.render();
    satDial.render();
    renderMarker();
  }
  picker.addEventListener('pointerdown', function (e) {
    picking = true;
    picker.setPointerCapture(e.pointerId);
    pick(e);
    e.preventDefault();
  });
  picker.addEventListener('pointermove', function (e) { if (picking) pick(e); });
  picker.addEventListener('pointerup', function () { picking = false; });
  renderMarker();

  // --- toggles, menus, tabs ---
  function wireToggle(id, param) {
    var btn = document.getElementById(id);
    btn.addEventListener('click', function () {
      var v = state[param] ? 0 : 1;
      send(param, v);
      btn.classList.toggle('on', !!v);
      btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    });
  }
  wireToggle('vd-on', 'on');
  wireToggle('vd-sync', 'sync');

  document.getElementById('vd-anim').addEventListener('change', function () {
    send('anim', +this.value);
  });
  document.getElementById('vd-syncrate').addEventListener('change', function () {
    send('syncrate', +this.value);
  });

  var fwd = document.getElementById('vd-fwd');
  var rev = document.getElementById('vd-rev');
  function setDir(d) {
    send('dir', d);
    fwd.classList.toggle('active', d === 0);
    rev.classList.toggle('active', d === 1);
  }
  fwd.addEventListener('click', function () { setDir(0); });
  rev.addEventListener('click', function () { setDir(1); });

  // --- transport (stands in for Live's) ---
  var playBtn = document.getElementById('vd-play');
  function renderPlay() {
    playBtn.textContent = playing ? '■ Stop' : '▶ Play';
    playBtn.classList.toggle('on', playing);
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }
  playBtn.addEventListener('click', function () {
    playing = !playing;
    renderPlay();
  });
  renderPlay();

  document.getElementById('vd-bpm').addEventListener('change', function () {
    var v = +this.value;
    if (v >= 40 && v <= 240) bpm = v;
  });

  // --- boot: fetch the real engine and run the metro ---
  fetch('lumidi-engine.js')
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    })
    .then(function (src) {
      var ret = 'return {' + HANDLERS.map(function (n) {
        return n + ': (typeof ' + n + ' === "function" ? ' + n + ' : null)';
      }).join(',') + '};';
      // non-strict scope on purpose: the engine assigns Max globals
      // (autowatch, inlets, outlets) without declaring them
      engine = new Function('outlet', 'post', src + '\n' + ret)(outlet, function () {});
      for (var i = 0; i < HANDLERS.length; i++) {
        if (!engine[HANDLERS[i]]) throw new Error('engine handler missing: ' + HANDLERS[i]);
      }
      pushAll();

      var ticks = 0;
      var lastMs = performance.now();
      setInterval(function () {  // the patcher's [metro 33]
        var now = performance.now();
        var dt = (now - lastMs) / 1000;
        lastMs = now;
        if (dt < 0 || dt > 0.25) dt = 0.033; // background-tab guard, like the engine's
        if (playing) ticks += dt * (bpm / 60) * 480;
        engine.tempo(bpm);
        engine.playing(playing ? 1 : 0);
        engine.ticks(ticks);
        engine.bang();
      }, 33);
    })
    .catch(function (err) {
      gateEl.textContent = 'engine not loaded';
      var note = document.getElementById('vd-note');
      note.hidden = false;
      note.textContent = 'Could not load lumidi-engine.js (' + err.message +
        ') — if you are running locally, copy it in: cp ableton/lumidi-engine.js web/';
    });
})();
