#include <Arduino.h>
#include <FastLED.h>
#include <avr/eeprom.h>
#include "usb_names.h"

#define LED_PIN     7

// Pixels driven, fixed at the protocol's limit (notes 0..125 address 42).
// A shorter strip simply ignores the data past its last pixel, and unlit
// pixels cost nothing in the power estimate, so one build fits every strip:
// set the real length in the LumiDI device's Pixels control instead.
#define NUM_LEDS    42

// Current budget for the strip, in mA. FastLED scales brightness down only
// when a frame would draw more than this, so a full-white frame can't brown
// out the supply. 1000 suits a powered USB hub or a USB-C port; use 500 for a
// plain USB 2.0 port, or your supply's rating if the strip has its own PSU.
#define MAX_MILLIAMPS 1000

CRGB leds[NUM_LEDS];

#define SHOW_LED_NOTE  127

#define RED_MOD   0
#define GREEN_MOD 1
#define BLUE_MOD  2

/**
 * Device naming: the USB product name defaults to "luMIDI" (see name.c),
 * but each device can be renamed so multiple units are distinguishable on
 * one computer.  A custom name is stored in EEPROM as
 * [magic][length][chars...] and copied into the USB string descriptor by
 * startup_middle_hook(), which the Teensy core runs before usb_init().
 *
 * To rename, send SysEx: F0 7D 4E <ascii name> F7
 * The name is saved to EEPROM and the device reboots, re-enumerating
 * with the new name.
 */
#define NAME_EEPROM_ADDR     0
#define NAME_EEPROM_MAGIC    0xA5
#define MAX_DEVICE_NAME_LEN  31

#define SYSEX_MFG_ID    0x7D  // reserved for non-commercial use
#define SYSEX_SET_NAME  0x4E  // 'N'

extern "C" void startup_middle_hook(void) {
  if (eeprom_read_byte((const uint8_t *)NAME_EEPROM_ADDR) != NAME_EEPROM_MAGIC) return;
  uint8_t len = eeprom_read_byte((const uint8_t *)(NAME_EEPROM_ADDR + 1));
  if (len == 0 || len > MAX_DEVICE_NAME_LEN) return;
  for (uint8_t i = 0; i < len; i++) {
    usb_string_product_name.wString[i] =
        eeprom_read_byte((const uint8_t *)(NAME_EEPROM_ADDR + 2 + i));
  }
  usb_string_product_name.bLength = 2 + len * 2;
}

#ifdef USB_MIDI
void sysEx(uint8_t *data, unsigned int length) {
  if (length < 5 || data[0] != 0xF0 || data[1] != SYSEX_MFG_ID ||
      data[2] != SYSEX_SET_NAME || data[length - 1] != 0xF7) {
    return;
  }
  unsigned int len = length - 4;
  if (len > MAX_DEVICE_NAME_LEN) {
    return;
  }
  eeprom_write_byte((uint8_t *)(NAME_EEPROM_ADDR + 1), len);
  for (unsigned int i = 0; i < len; i++) {
    eeprom_write_byte((uint8_t *)(NAME_EEPROM_ADDR + 2 + i), data[3 + i]);
  }
  // Magic byte written last, so an interrupted write can't leave a
  // valid-looking but garbage name.
  eeprom_write_byte((uint8_t *)NAME_EEPROM_ADDR, NAME_EEPROM_MAGIC);
  SCB_AIRCR = 0x05FA0004;  // reboot to re-enumerate with the new name
}
#endif

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
  FastLED.setMaxPowerInVoltsAndMilliamps(5, MAX_MILLIAMPS);

  #ifdef USB_SERIAL
    Serial.begin(9600);
    while (!Serial && millis() < 4000 );
  #endif

  #ifdef USB_MIDI
    usbMIDI.setHandleNoteOn(noteOn);
    usbMIDI.setHandleSystemExclusive(sysEx);
  #endif
}

void loop() {
  #ifdef USB_MIDI
    while (usbMIDI.read()) ;
  #endif
}
