"""
Era plate renderer — generates stylized "archival plates" for the
Internet Time Machine landing page: dim, film-textured visualizations
of how the web felt in each era (1991, 1996, 2004, 2012, 2026).
These are museum-style reproductions, NOT real screenshots; the page
labels them as such. Real artifacts (archived logos) are separate.

Run:  python scripts/render_era_plates.py
Out:  public/artifacts/era-<year>.png  (1600x1000)
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math
import random
import os

W, H = 1600, 1000
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "artifacts")

# palette
INK = (10, 10, 15)
PAPER = (232, 230, 222)
FADED_PAPER = (208, 204, 192)
BLUE_LINK = (32, 64, 160)
AMBER = (232, 180, 90)


def find_font(size, bold=False, mono=True):
    """Best available monospace/serif font on Windows."""
    candidates = [
        r"C:\Windows\Fonts\consola.ttf",
        r"C:\Windows\Fonts\lucon.ttf",
        r"C:\Windows\Fonts\cour.ttf",
    ] if mono else [
        r"C:\Windows\Fonts\times.ttf",
        r"C:\Windows\Fonts\georgia.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def noise_overlay(img, strength=10, seed=1):
    """Monochrome film grain."""
    random.seed(seed)
    w, h = img.size
    noise = Image.new("L", (w // 2, h // 2))
    noise.putdata([random.randint(128 - strength * 6, 128 + strength * 6) * 0 + random.randint(0, 255) for _ in range((w // 2) * (h // 2))])
    noise = noise.resize((w, h), Image.BILINEAR)
    noise = noise.point(lambda p: 128 + (p - 128) * strength / 64)
    return Image.blend(img, Image.merge(img.mode, [noise] * len(img.getbands())), 0.12) if img.mode == "RGB" else img


def vignette(img, strength=140):
    """Dark radial vignette so plates dissolve into the dark page."""
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    cx, cy = w / 2, h / 2
    maxr = math.hypot(cx, cy)
    for r in range(int(maxr), 0, -4):
        alpha = int(255 * min(1, ((r / maxr) ** 2.2) * (strength / 100)))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255 - min(220, alpha))
    black = Image.new("RGB", (w, h), INK)
    return Image.composite(black, img, mask)


def age(img, tint=(1.0, 0.98, 0.92), grain=True, seed=1):
    """Fade toward paper-dark, tint, grain, vignette."""
    img = img.convert("RGB")
    r, g, b = img.split()
    r = r.point(lambda p: int(p * tint[0]))
    g = g.point(lambda p: int(p * tint[1]))
    b = b.point(lambda p: int(p * tint[2]))
    img = Image.merge("RGB", (r, g, b))
    if grain:
        img = noise_overlay(img, seed=seed)
    return vignette(img)


# ---------------------------------------------------------------- eras

def plate_1991():
    """info.cern.ch era: plain hypertext on a pale ground."""
    img = Image.new("RGB", (W, H), (214, 212, 202))
    d = ImageDraw.Draw(img)
    f = find_font(30)
    fl = find_font(30)
    lines = [
        "World Wide Web",
        "",
        "The WorldWideWeb: Summary",
        "",
        "The WorldWideWeb (W3) is a wide-area",
        "hypermedia information retrieval",
        "initiative aiming to give universal",
        "access to a large universe of documents.",
        "",
        "  What's out there",
        "  Help",
        "  Software Products",
        "  Technical Specifications",
    ]
    y = 160
    for i, line in enumerate(lines):
        if line.startswith("  "):
            d.text((240 + 40, y), line.strip(), fill=BLUE_LINK, font=f)
            d.line((280, y + 34, 280 + 12 * len(line.strip()), y + 34), fill=BLUE_LINK)
        elif line:
            d.text((240, y), line, fill=(24, 24, 24), font=f)
        y += 46
    d.rectangle((220, 120, 1380, y + 40), outline=(160, 158, 148), width=1)
    return age(img, tint=(0.96, 0.94, 0.9), seed=11)


def plate_1996():
    """Table-era personal/homepage web: serif text, blue links, dividers."""
    img = Image.new("RGB", (W, H), (240, 238, 228))
    d = ImageDraw.Draw(img)
    serif = find_font(34, mono=False)
    small = find_font(22)
    # header banner
    d.rectangle((140, 90, 1460, 250), fill=(28, 28, 60))
    d.text((220, 140), "THE  WEB  CHRONICLE", fill=(255, 224, 130), font=find_font(64, mono=False))
    # nav row
    nav = ["Home", "What's New", "Cool Links", "Guestbook", "Webrings"]
    x = 180
    for item in nav:
        d.text((x, 290), item, fill=BLUE_LINK, font=small)
        d.line((x, 318, x + 11 * len(item), 318), fill=BLUE_LINK)
        x += 26 + 12 * len(item)
    d.line((140, 350, 1460, 350), fill=(180, 176, 164), width=2)
    # two-column table body
    d.text((180, 390), "Welcome to my homepage!", fill=(60, 20, 120), font=find_font(40, mono=False))
    body = [
        "This page is under construction!",
        "Best viewed with Netscape Navigator 3.0",
        "at 800x600 resolution.",
        "",
        "Sign my guestbook, and check out",
        "my favorite links below.",
    ]
    y = 460
    for line in body:
        d.text((180, y), line, fill=(40, 40, 40), font=serif)
        y += 44
    # sidebar
    d.rectangle((1030, 390, 1460, 860), fill=(228, 224, 210))
    d.rectangle((1030, 390, 1460, 860), outline=(150, 146, 132), width=2)
    d.text((1060, 410), "VISITORS:", fill=(120, 40, 40), font=small)
    # old-style odometer counter
    bx, by = 1060, 450
    for digit in "0 0 1 3 3 7".split():
        d.rectangle((bx, by, bx + 34, by + 50), fill=(12, 12, 12), outline=(90, 88, 80))
        d.text((bx + 10, by + 8), digit, fill=(80, 255, 120), font=find_font(36))
        bx += 42
    links = ["Yahoo!", "AltaVista", "GeoCities", "A cool MIDI site"]
    y = 540
    for link in links:
        d.text((1060, y), f"» {link}", fill=BLUE_LINK, font=small)
        y += 40
    # under construction bar
    for i in range(30):
        c = (240, 180, 40) if i % 2 == 0 else (24, 24, 24)
        d.rectangle((140 + i * 44, 890, 184 + i * 44, 930), fill=c)
    return age(img, tint=(0.97, 0.95, 0.9), seed=22)


def plate_2004():
    """Portal/gradient era: beveled blocks, saturated chrome."""
    img = Image.new("RGB", (W, H), (238, 236, 230))
    d = ImageDraw.Draw(img)
    sans = find_font(30, mono=False)
    small = find_font(20)
    # gradient header
    for y in range(80, 200):
        t = (y - 80) / 120
        c = (int(70 + 40 * t), int(110 - 30 * t), int(170 - 40 * t))
        d.line((140, y, 1460, y), fill=c)
    d.text((180, 120), "myPortal  —  your digital life, organized", fill=(255, 255, 255), font=sans)
    # search bar
    d.rectangle((180, 220, 1100, 270), fill=(255, 255, 255), outline=(120, 120, 130))
    d.rectangle((1120, 218, 1260, 272), fill=(70, 110, 170), outline=(40, 70, 120))
    d.text((1160, 232), "Search", fill=(255, 255, 255), font=small)
    # portal block grid
    blocks = [
        ("Mail", "(240,130,60)", 12, "You have 3 new messages"),
        ("News", "(90,130,200)", 4, "Top stories from around the web"),
        ("Shopping", "(200,90,120)", 16, "Today's deals · Free shipping"),
        ("Chat", "(120,170,90)", 8, "Your buddy list (7 online)"),
        ("Music", "(150,100,180)", 10, "Now playing: featured artist"),
        ("Photos", "(80,160,170)", 6, "Share albums with friends"),
    ]
    x0, y0, bw, bh, gap = 140, 320, 420, 190, 30
    for i, (title, rgb, unread, sub) in enumerate(blocks):
        bx = x0 + (i % 3) * (bw + gap)
        by = y0 + (i // 3) * (bh + gap)
        color = eval(rgb)  # literal tuples above
        d.rectangle((bx, by, bx + bw, by + bh), fill=(252, 251, 248), outline=(190, 188, 180))
        d.rectangle((bx, by, bx + bw, by + 36), fill=color)
        d.text((bx + 16, by + 6), title, fill=(255, 255, 255), font=small)
        d.text((bx + 16, by + 60), f"{unread} new", fill=(190, 90, 60), font=small)
        d.text((bx + 16, by + 100), sub, fill=(110, 108, 100), font=small)
    return age(img, tint=(0.98, 0.96, 0.93), seed=33)


def plate_2012():
    """Flat/mobile era: cards, hero image, hamburger, whitespace."""
    img = Image.new("RGB", (W, H), (248, 248, 246))
    d = ImageDraw.Draw(img)
    sans = find_font(30, mono=False)
    small = find_font(20)
    # minimal nav
    d.text((150, 80), "brand", fill=(30, 30, 34), font=find_font(44, mono=False))
    for i in range(3):
        d.line((1370 + i * 22, 88, 1370 + i * 22, 96), fill=(90, 90, 96), width=3)
    # hero
    d.rectangle((150, 160, 1450, 520), fill=(60, 140, 190))
    for x in range(150, 1450, 60):
        d.line((x, 160, x - 120, 520), fill=(50, 120, 170), width=24)
    d.text((200, 280), "Everything, simplified.", fill=(255, 255, 255), font=find_font(56, mono=False))
    d.rectangle((200, 400, 420, 452), fill=(255, 255, 255))
    d.text((232, 412), "Get started", fill=(60, 140, 190), font=small)
    # card grid
    cards = [
        ("Clean design", "Beautiful typography"),
        ("Fast apps", "Built for mobile first"),
        ("In the cloud", "Sync everywhere"),
        ("Social", "Share with friends"),
        ("Smart feeds", "Personal for you"),
        ("Always on", "Real-time updates"),
    ]
    x0, y0, cw, ch, gap = 150, 570, 400, 140, 25
    for i, (t, s) in enumerate(cards):
        cx = x0 + (i % 3) * (cw + gap)
        cy = y0 + (i // 3) * (ch + gap)
        d.rounded_rectangle((cx, cy, cx + cw, cy + ch), 10, fill=(255, 255, 255), outline=(232, 232, 228))
        d.rounded_rectangle((cx + 22, cy + 24, cx + 62, cy + 64), 8, fill=(60, 140, 190))
        d.text((cx + 80, cy + 26), t, fill=(30, 30, 34), font=sans)
        d.text((cx + 80, cy + 68), s, fill=(150, 150, 150), font=small)
    return age(img, tint=(0.97, 0.97, 0.98), seed=44)


def plate_2026():
    """AI era: dark interface, prompt bar, generated cards."""
    img = Image.new("RGB", (W, H), (18, 18, 26))
    d = ImageDraw.Draw(img)
    small = find_font(20)
    # ambient glow
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((500, 150, 1100, 750), fill=(40, 34, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.blend(img, glow, 0.8)
    d = ImageDraw.Draw(img)
    # chat history
    d.text((200, 140), "you", fill=(130, 130, 145), font=small)
    d.text((200, 175), "show me how the web looked in 1996", fill=(225, 225, 235), font=find_font(30))
    d.text((200, 260), "assistant", fill=(130, 130, 145), font=small)
    d.rounded_rectangle((200, 295, 1080, 400), 14, fill=(34, 34, 48))
    d.text((224, 320), "Here's a reconstruction of a 1996 homepage...", fill=(200, 200, 214), font=small)
    # prompt bar
    d.rounded_rectangle((200, 560, 1300, 640), 32, fill=(30, 30, 44), outline=(70, 70, 95))
    d.text((240, 585), "Ask anything, or travel to any year…", fill=(120, 120, 140), font=small)
    d.ellipse((1240, 572, 1288, 620), fill=(90, 80, 150))
    # generated result cards
    for i in range(3):
        cx = 200 + i * 380
        d.rounded_rectangle((cx, 700, cx + 350, 900), 12, fill=(26, 26, 38), outline=(52, 52, 72))
        d.rounded_rectangle((cx + 20, 720, cx + 330, 800), 8, fill=(44, 44, 66))
        for j in range(3):
            d.rounded_rectangle((cx + 20, 818 + j * 26, cx + 200 + j * 40, 834 + j * 26), 4, fill=(52, 52, 74))
    return age(img, tint=(0.92, 0.9, 1.0), seed=55)


PLATES = {
    1991: plate_1991,
    1996: plate_1996,
    2004: plate_2004,
    2012: plate_2012,
    2026: plate_2026,
}

if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    for year, fn in PLATES.items():
        img = fn()
        path = os.path.join(OUT_DIR, f"era-{year}.png")
        img.save(path, optimize=True)
        print(f"wrote {path} ({img.size[0]}x{img.size[1]})")
