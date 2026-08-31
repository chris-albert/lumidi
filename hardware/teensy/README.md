# LED Teensy 4.0

Teensy has a 3.3v out pin

LED's i have are WS2812B
Model: AL-WS2812B-150BK-WP
Light source: 5050 RGB LED
LED Qty: 30pcs per meter
Power: 6W/M 60mA per pixel = 30 * .06 = 1.8A per meter
Voltage: DC 5V


My Current strips are 19 pixels, so at 60mA each, thats (19 * .06) = 1.14A total current draw.

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
firmware re-flashes.

Both major OSes cache the old name, so MIDI apps keep showing it even though
the USB descriptor changed (verify the real name with
`system_profiler SPUSBDataType` on macOS):

- **macOS**: CoreMIDI caches the name per device. Unplug the device, open
  Audio MIDI Setup → Window → Show MIDI Studio, delete the greyed-out old
  device, then replug.
- **Windows**: remove the device in Device Manager, then replug.