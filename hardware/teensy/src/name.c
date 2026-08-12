// To give your project a unique name, this code must be
// placed into a .c file (its own tab).  It can not be in
// a .cpp file or your main sketch (the .ino file).

#include "usb_names.h"

// Default name, used until a custom name has been stored in EEPROM.
// startup_middle_hook() in main.cpp overwrites this descriptor from
// EEPROM before USB enumeration, so the array is padded out to
// MAX_DEVICE_NAME_LEN (31) characters to reserve room for longer names.

#define MIDI_NAME   {'l','u','M','I','D','I', \
                     0,0,0,0,0,0,0,0,0,0,0,0,0, \
                     0,0,0,0,0,0,0,0,0,0,0,0}
#define MIDI_NAME_LEN  6

// Do not change this part.  This exact format is required by USB.

struct usb_string_descriptor_struct usb_string_product_name = {
        2 + MIDI_NAME_LEN * 2,
        3,
        MIDI_NAME
};
