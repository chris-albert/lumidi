# LED Teensy 4.0

Teensy has a 3.3v out pin

LED's i have are WS2812B
Model: AL-WS2812B-150BK-WP
Light source: 5050 RGB LED
LED Qty: 30pcs per meter
Power: 6W/M 60mA per pixel = 30 * .06 = 1.8A per meter
Voltage: DC 5V


My Current strips are 19 pixels, so at 60mA each, thats (19 * .06) = 1.14A total current draw.

The firmware always drives 42 pixels (the MIDI protocol's limit); a shorter strip
ignores the extra data, so one build fits every strip. Set the real length in the
LumiDI device's **Pixels** control.

Use a 330ohm resister on the data line, between the teensy and the leds.
Use a 100uF or 1000uF 6.3v cap across the + and - of the leds

## Renaming a device

The USB MIDI name defaults to `luMIDI`, but each device can be given its own
name so multiple units are distinguishable on one computer. Send this SysEx
message to the device:

```
F0 7D 4E <name as ascii bytes> F7
```

The name (max 31 characters) is saved to EEPROM and the device reboots,
re-enumerating with the new name. It persists across power cycles and
firmware re-flashes. Note that Windows may cache the old name until the
device is removed in Device Manager; macOS picks up the new name on replug.