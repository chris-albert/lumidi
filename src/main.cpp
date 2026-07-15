#include <Arduino.h>
#include <FastLED.h>

#define LED_PIN     7
#define NUM_LEDS    19

CRGB leds[NUM_LEDS];

#define SHOW_LED_NOTE  127

#define RED_MOD   0
#define GREEN_MOD 1
#define BLUE_MOD  2

/**
 * 255 - show led
 * 0 - led 0 r
 * 1 - led 0 g
 * 2 - led 0 b
 * 3 - led 1 r
 * 4 - led 1 g
 * 5 - led 1 b
 * 6 - led 2 r
 */
void noteOn(byte channel, byte note, byte velocity) {
  byte rgb = note % 3;
  byte led = note / 3;
  byte velo = velocity * 2;
  if(velo == 2) {
    velo = 0;
  }

  if(note == SHOW_LED_NOTE) {
    FastLED.show();
  } else if(led < NUM_LEDS) {
    if(rgb == RED_MOD) {
       leds[led] = CRGB(velo, leds[led].green, leds[led].blue);
    } else if(rgb == GREEN_MOD) {
       leds[led] = CRGB(leds[led].red, velo, leds[led].blue);
    } else if(rgb == BLUE_MOD) {
       leds[led] = CRGB(leds[led].red, leds[led].green, velo);
    }
  }
}

void setup() {
  FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);

  #ifdef USB_SERIAL
    Serial.begin(9600);
    while (!Serial && millis() < 4000 );
  #endif

  #ifdef USB_MIDI
    usbMIDI.setHandleNoteOn(noteOn);
  #endif
}

void loop() {
  #ifdef USB_MIDI
    while (usbMIDI.read()) ;
  #endif
}
