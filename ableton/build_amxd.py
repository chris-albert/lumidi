#!/usr/bin/env python3
"""Wrap lumidi.maxpat in the .amxd container so Live can load it as a device.

An unfrozen .amxd is a flat sequence of IFF-style chunks
([4-byte tag][uint32 LE length][data]):

  ampf  device type ("mmmm" = MIDI effect)
  meta  format version (7, matching devices saved by Max 8)
  ptch  the patcher JSON, null-terminated

The .amxd must live next to lumidi-engine.js so the [js] object finds it.
Verified against Ableton's factory devices (e.g. Melodic Steps.amxd).
"""
import json
import struct
import sys
from pathlib import Path

HERE = Path(__file__).parent
MAXPAT = HERE / "lumidi.maxpat"
AMXD = HERE / "LumiDI.amxd"


def chunk(tag: bytes, data: bytes) -> bytes:
    return tag + struct.pack("<I", len(data)) + data


def build() -> bytes:
    raw = MAXPAT.read_bytes()
    json.loads(raw)  # fail early on malformed patcher JSON
    return (
        chunk(b"ampf", b"mmmm")
        + chunk(b"meta", struct.pack("<I", 7))
        + chunk(b"ptch", raw + b"\x00")
    )


def verify(blob: bytes) -> None:
    off = 0
    chunks = {}
    while off < len(blob):
        tag = blob[off : off + 4]
        (size,) = struct.unpack("<I", blob[off + 4 : off + 8])
        chunks[tag] = blob[off + 8 : off + 8 + size]
        off += 8 + size
    assert off == len(blob), "trailing bytes after last chunk"
    assert chunks[b"ampf"] == b"mmmm", "device type is not MIDI effect"
    assert chunks[b"ptch"].endswith(b"\x00"), "patcher not null-terminated"
    extracted = chunks[b"ptch"][:-1]
    assert extracted == MAXPAT.read_bytes(), "round-trip mismatch with lumidi.maxpat"
    json.loads(extracted)


def main() -> int:
    blob = build()
    verify(blob)
    AMXD.write_bytes(blob)
    print(f"wrote {AMXD} ({len(blob)} bytes, round-trip verified)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
