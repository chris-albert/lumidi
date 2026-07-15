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