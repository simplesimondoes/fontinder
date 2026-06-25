#!/usr/bin/env python3
"""Convert Tajima font preview images (PCX/JPG) to web-friendly PNGs and emit a
manifest the Next.js app consumes. Run from the fontinder/ directory:

    python3 scripts/convert_previews.py /path/to/_extracted
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "../_extracted")
OUT_DIR = Path("public/previews")
MANIFEST = Path("lib/fonts.json")

# Trim/pad and normalise to a consistent canvas so cards look uniform.
PAD = 16
BG = (255, 255, 255)


def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    name = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return name or "font"


def clean_display_name(stem: str) -> str:
    # strip trailing "_fon" / " fon" markers
    n = re.sub(r"[ _]fon$", "", stem, flags=re.IGNORECASE)
    return n.strip()


def autocrop(im: Image.Image) -> Image.Image:
    """Crop surrounding solid border (the previews sit on a flat background)."""
    rgb = im.convert("RGB")
    bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
    from PIL import ImageChops

    diff = ImageChops.difference(rgb, bg)
    bbox = diff.getbbox()
    if bbox:
        # add a little breathing room
        l, t, r, b = bbox
        l = max(0, l - 4); t = max(0, t - 4)
        r = min(rgb.width, r + 4); b = min(rgb.height, b + 4)
        return rgb.crop((l, t, r, b))
    return rgb


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    previews = []
    for p in sorted(SRC.iterdir()):
        if not p.is_file():
            continue
        low = p.name.lower()
        # Only the per-font previews. Skip the PED008 software-catalog images.
        if low.startswith("ped008"):
            continue
        if not (low.endswith("_fon.pcx") or low.endswith("_fon.jpg")):
            continue
        display = clean_display_name(p.stem)
        slug = slugify(display)
        try:
            im = Image.open(p)
            im = autocrop(im)
        except Exception as e:  # noqa
            print(f"  skip {p.name}: {e}")
            continue
        # ensure unique slug
        out_name = f"{slug}.png"
        out_path = OUT_DIR / out_name
        n = 2
        while out_path.exists() and not any(x["slug"] == slug for x in previews):
            out_name = f"{slug}-{n}.png"; out_path = OUT_DIR / out_name; n += 1
        canvas = Image.new("RGB", (im.width + PAD * 2, im.height + PAD * 2), BG)
        canvas.paste(im, (PAD, PAD))
        canvas.save(out_path, "PNG", optimize=True)
        previews.append({
            "slug": slug,
            "name": display,
            "image": f"/previews/{out_name}",
            "w": canvas.width,
            "h": canvas.height,
        })

    # de-dupe by slug, keep first
    seen = set(); uniq = []
    for x in previews:
        if x["slug"] in seen:
            continue
        seen.add(x["slug"]); uniq.append(x)

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(uniq, indent=2))
    print(f"Converted {len(uniq)} font previews -> {OUT_DIR}")
    print(f"Manifest -> {MANIFEST}")


if __name__ == "__main__":
    main()
