#!/usr/bin/env python3
"""Generate solid-color placeholder PWA icons (192x192, 512x512).
Uses only the Python standard library (struct + zlib), no extra
dependencies. Re-run this script if the theme color changes.
"""
import struct
import zlib
import pathlib

ACCENT_RGB = (0xC9, 0x91, 0x5D)  # matches --accent in css/style.css
OUTPUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "icons"


def make_png(path, width, height, rgb):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(
            ">I", zlib.crc32(tag + data)
        )

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    r, g, b = rgb
    row = bytes([r, g, b]) * width
    raw = (b"\x00" + row) * height
    idat = zlib.compress(raw, 9)
    png = signature + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    path.write_bytes(png)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    make_png(OUTPUT_DIR / "icon-192.png", 192, 192, ACCENT_RGB)
    make_png(OUTPUT_DIR / "icon-512.png", 512, 512, ACCENT_RGB)
    print(f"Wrote icon-192.png and icon-512.png to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
