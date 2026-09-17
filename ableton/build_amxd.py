#!/usr/bin/env python3
"""Wrap lumidi.maxpat in the .amxd container so Live can load it as a device.

An unfrozen .amxd is a flat sequence of IFF-style chunks
([4-byte tag][uint32 LE length][data]):

  ampf  device type ("mmmm" = MIDI effect)
  meta  format version (7, matching devices saved by Max 8)
  ptch  the patcher JSON, null-terminated

The .amxd must live next to lumidi-engine.js so the [js] object finds it.
Verified against Ableton's factory devices (e.g. Melodic Steps.amxd).

Also copies the luMIDI logo (web/favicon.svg) next to the device, where the
patcher's [fpic] finds it by name.

With --freeze, the ptch chunk is instead the frozen container Max writes for
File > Freeze Device: the engine and logo are embedded, so the .amxd is
self-contained (what the site ships). Layout, all sizes big-endian:

  "mx@c" u32(16) u32(0) u32(offset of dlst)
  patcher JSON + NUL, then each dependency's raw bytes
  dlst: [dire: type fnam sz32 of32 vers flag mdat]...   (one dire per file,
        the patcher first with flag 0x11; each field is tag, u32 total size,
        payload padded to 4 bytes)

Reverse-engineered from frozen devices (Ableton's, Max for Live's, third-party).
"""
import json
import shutil
import struct
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent
MAXPAT = HERE / "lumidi.maxpat"
ENGINE = HERE / "lumidi-engine.js"
AMXD = HERE / "LumiDI.amxd"
LOGO_SRC = HERE.parent / "web" / "favicon.svg"
LOGO = HERE / "lumidi-logo.svg"

# Files a frozen device embeds, with Max's 4-char type code for each.
DEPS = [(b"TEXT", ENGINE), (b"svg ", LOGO)]

MAC_EPOCH = 2082844800  # seconds from 1904-01-01 (Max's mdat) to 1970-01-01


def chunk(tag: bytes, data: bytes) -> bytes:
    return tag + struct.pack("<I", len(data)) + data


def field(tag: bytes, payload: bytes) -> bytes:
    payload += b"\0" * (-len(payload) % 4)
    return tag + struct.pack(">I", 8 + len(payload)) + payload


def u32(tag: bytes, n: int) -> bytes:
    return field(tag, struct.pack(">I", n))


def frozen(raw: bytes) -> bytes:
    files = [(b"JSON", AMXD.name, raw + b"\0", 0x11, time.time())]
    files += [(t, p.name, p.read_bytes(), 0, p.stat().st_mtime) for t, p in DEPS]
    body, dires = b"", b""
    for ftype, name, data, flag, mtime in files:
        dires += field(
            b"dire",
            field(b"type", ftype)
            + field(b"fnam", name.encode() + b"\0")
            + u32(b"sz32", len(data))
            + u32(b"of32", 16 + len(body))
            + u32(b"vers", 0)
            + u32(b"flag", flag)
            + u32(b"mdat", int(mtime) + MAC_EPOCH),
        )
        body += data
    return b"mx@c" + struct.pack(">III", 16, 0, 16 + len(body)) + body + field(b"dlst", dires)


def build(freeze: bool) -> bytes:
    raw = MAXPAT.read_bytes()
    json.loads(raw)  # fail early on malformed patcher JSON
    return (
        chunk(b"ampf", b"mmmm")
        + chunk(b"meta", struct.pack("<I", 7))
        + chunk(b"ptch", frozen(raw) if freeze else raw + b"\x00")
    )


def fields(blob: bytes) -> list:
    out, off = [], 0
    while off < len(blob):
        tag = blob[off : off + 4]
        (size,) = struct.unpack(">I", blob[off + 4 : off + 8])
        out.append((tag, blob[off + 8 : off + size]))
        off += size
    assert off == len(blob), "trailing bytes in frozen directory"
    return out


def verify(blob: bytes, freeze: bool) -> None:
    off = 0
    chunks = {}
    while off < len(blob):
        tag = blob[off : off + 4]
        (size,) = struct.unpack("<I", blob[off + 4 : off + 8])
        chunks[tag] = blob[off + 8 : off + 8 + size]
        off += 8 + size
    assert off == len(blob), "trailing bytes after last chunk"
    assert chunks[b"ampf"] == b"mmmm", "device type is not MIDI effect"
    ptch = chunks[b"ptch"]
    if freeze:
        magic, hlen, _, dlst_off = struct.unpack(">4sIII", ptch[:16])
        assert magic == b"mx@c" and hlen == 16, "bad frozen header"
        [(tag, dlst)] = fields(ptch[dlst_off:])
        assert tag == b"dlst", "directory not at the header's offset"
        expected = [(b"JSON", AMXD.name, MAXPAT.read_bytes() + b"\0")]
        expected += [(t, p.name, p.read_bytes()) for t, p in DEPS]
        for (tag, dire), (ftype, name, data) in zip(fields(dlst), expected, strict=True):
            f = dict(fields(dire))
            assert f[b"type"] == ftype and f[b"fnam"].rstrip(b"\0") == name.encode(), name
            (size,) = struct.unpack(">I", f[b"sz32"])
            (start,) = struct.unpack(">I", f[b"of32"])
            assert ptch[start : start + size] == data, f"embedded {name} mismatch"
        ptch = ptch[16 : 16 + len(expected[0][2])]
    assert ptch.endswith(b"\x00"), "patcher not null-terminated"
    extracted = ptch[:-1]
    assert extracted == MAXPAT.read_bytes(), "round-trip mismatch with lumidi.maxpat"
    json.loads(extracted)


def main() -> int:
    freeze = "--freeze" in sys.argv[1:]
    shutil.copyfile(LOGO_SRC, LOGO)
    print(f"copied {LOGO_SRC} -> {LOGO}")
    blob = build(freeze)
    verify(blob, freeze)
    AMXD.write_bytes(blob)
    kind = "frozen, engine + logo embedded" if freeze else "unfrozen"
    print(f"wrote {AMXD} ({len(blob)} bytes, {kind}, round-trip verified)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
