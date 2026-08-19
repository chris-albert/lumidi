// lumidi-preview.js — on-device preview of the 19-LED strip, drawn in a
// [jsui]. Receives the engine's staged frame (list of NUM_LEDS*3 values,
// 0..255) on its preview outlet and repaints; the engine only emits when a
// frame actually changed, so idle costs nothing.
//
// Shows what the engine EMITTED — if this disagrees with the physical
// strip, the loss is downstream of the device (Live's note pipeline or
// routing), which is exactly the split the debug README describes.
//
// ES5 only ([jsui] runs the same SpiderMonkey engine as [js]).

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var NUM_LEDS = 19;
var vals = [];
var i;
for (i = 0; i < NUM_LEDS * 3; i++) vals[i] = 0;

function list() {
  vals = arrayfromargs(arguments);
  mgraphics.redraw();
}

function paint() {
  var w = this.box.rect[2] - this.box.rect[0];
  var h = this.box.rect[3] - this.box.rect[1];
  var pitch = w / NUM_LEDS;
  var r = Math.min(pitch, h) * 0.36;
  var cy = h / 2;
  var n, cx;

  // strip background
  mgraphics.set_source_rgba(0.08, 0.08, 0.08, 1);
  mgraphics.rectangle(0, 0, w, h);
  mgraphics.fill();

  for (n = 0; n < NUM_LEDS; n++) {
    cx = pitch * (n + 0.5);
    // socket ring so dark LEDs still read as present
    mgraphics.set_source_rgba(0.18, 0.18, 0.18, 1);
    mgraphics.ellipse(cx - r - 1, cy - r - 1, (r + 1) * 2, (r + 1) * 2);
    mgraphics.fill();
    mgraphics.set_source_rgba(
      (vals[n * 3] || 0) / 255,
      (vals[n * 3 + 1] || 0) / 255,
      (vals[n * 3 + 2] || 0) / 255,
      1
    );
    mgraphics.ellipse(cx - r, cy - r, r * 2, r * 2);
    mgraphics.fill();
  }
}

function onresize() {
  mgraphics.redraw();
}
