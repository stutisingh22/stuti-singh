#!/usr/bin/env python3
"""Paint the walking company into the street plates.

Reads the clean photographs in art/plates, stands three figures in each view
(near, mid, far) so the same person is ahead in one frame and beside you in
the next, and writes art/raw. Then run scripts/prepare-art.py.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PLATES, FIGS, RAW = ROOT / "art" / "plates", ROOT / "art" / "figures", ROOT / "art" / "raw"
VIEWS = [
    "popolo", "via-del-corso", "colosseum", "via-appia", "aqueducts", "fori-imperiali",
    "forum", "via-del-seminario", "pantheon", "via-dei-cerchi", "circus", "ponte-sant-angelo",
    "vatican", "lungotevere", "bocca", "teatro-marcello", "capitoline", "via-condotti",
    "spanish", "via-giubbonari", "campo", "via-delle-muratte", "trevi",
]
PEOPLE = ["popolo", "colosseum", "aqueducts", "forum", "pantheon", "circus",
          "vatican", "bocca", "capitoline", "spanish", "campo", "trevi"]
HORIZON = 0.47


def despill(im):
    a = np.array(im).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    edge = alpha < 245
    rgb[..., 0] = np.where(edge, np.minimum(rgb[..., 0], rgb[..., 1] + 28), rgb[..., 0])
    rgb[..., 2] = np.where(edge, np.minimum(rgb[..., 2], rgb[..., 1] + 18), rgb[..., 2])
    return np.dstack([rgb, alpha])


def grade(fig, sky):
    a = despill(fig)
    rgb, alpha = a[..., :3], a[..., 3]
    rgb *= np.array([1.04, 0.94, 0.80])
    h = rgb.shape[0]
    shade = 1 - 0.22 * np.clip((np.linspace(0, 1, h)[:, None] - 0.5) / 0.5, 0, 1)
    rgb *= shade[..., None]
    sky = np.array(sky, dtype=np.float32)
    rgb = np.where(alpha[..., None] > 12, rgb, sky)
    rgb = rgb * 0.88 + sky * 0.12
    alpha_img = Image.fromarray(alpha.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.1))
    rgb_img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(0.6))
    return Image.merge("RGBA", (*rgb_img.split(), alpha_img))


def stand(canvas, fig, fx, fy):
    """fx, fy are foot position as fractions. Height follows the ground plane."""
    w, h = canvas.size
    ph = max(28, int(h * 0.78 * (fy - HORIZON)))
    pw = max(8, round(fig.width * ph / fig.height))
    sprite = fig.resize((pw, ph), Image.LANCZOS)
    x = int(w * fx) - pw // 2
    y = int(h * fy) - ph
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    cx, foot = x + pw // 2, y + ph - 2
    rw, rh = pw * 0.42, max(5, ph * 0.035)
    d.ellipse((cx - rw, foot - rh, cx + rw, foot + rh * 1.6), fill=(30, 18, 12, 120))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(max(3, ph * 0.02))))
    canvas.alpha_composite(sprite, (x, y))


def sky_of(plate):
    w, h = plate.size
    box = plate.crop((w // 2 - 20, int(h * 0.06), w // 2 + 20, int(h * 0.14)))
    return np.array(box).reshape(-1, 3).mean(axis=0)


def main():
    cache = {}
    for i, view in enumerate(VIEWS):
        plate_path = PLATES / f"{view}.jpg"
        if not plate_path.exists():
            print("missing plate", view)
            continue
        plate = Image.open(plate_path).convert("RGB")
        sky = sky_of(plate)
        # streets are canyons: keep people on the pavements, off the arrow
        street = i % 2 == 1
        # Feet stay on the near cobbles. Higher in the frame they leave the ground and hang on the buildings.
        spots = [
            (i % 12, 0.16 if street else 0.22, 0.96),
            ((i + 1) % 12, 0.84 if street else 0.78, 0.93),
        ]
        canvas = plate.convert("RGBA")
        for who, fx, fy in spots:
            name = PEOPLE[who]
            if name not in cache:
                cache[name] = grade(Image.open(FIGS / f"{name}.webp").convert("RGBA"), sky)
            else:
                # regrade per plate so the light matches this street
                pass
            sprite = grade(Image.open(FIGS / f"{name}.webp").convert("RGBA"), sky)
            stand(canvas, sprite, fx, fy)
        out = RAW / f"{view}.jpg"
        canvas.convert("RGB").save(out, quality=92)
        print("  ", view)
    print("done", len(VIEWS))


if __name__ == "__main__":
    main()
