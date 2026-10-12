"""Tiny SVG toolkit used to generate the lesson diagrams. Run: python3 tools/images/build_all.py"""
import html, math, os

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "site", "images")
INK, GREEN, LIME, RED, GREY, LIGHT, MID = "#0b0f0c", "#15803d", "#22c55e", "#dc2626", "#d6d9de", "#f2f5f2", "#6b7a70"
BONE, BONE_EDGE = "#f3ead7", "#8a7a55"
MUSCLE, MUSCLE_EDGE = "#c4524b", "#6e211d"
SKIN = "#ecc9ae"
FONT = "system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif"

e = html.escape

def svg(w, h, body, title, desc=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" '
            f'aria-labelledby="t d" font-family="{FONT}">\n<title id="t">{e(title)}</title><desc id="d">{e(desc or title)}</desc>\n'
            f'<rect width="{w}" height="{h}" fill="#fff"/>\n{body}\n</svg>\n')

def save(name, content):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(content)

def T(x, y, text, size=16, anchor="start", weight="normal", fill=INK, style="", extra=""):
    lines = str(text).split("\n")
    out = []
    for i, ln in enumerate(lines):
        out.append(f'<text x="{x}" y="{y + i * size * 1.2:.1f}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" fill="{fill}" {style} {extra}>{e(ln)}</text>')
    return "".join(out)

def R(x, y, w, h, fill="none", stroke=INK, sw=2, rx=0, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'

def C(x, y, r, fill="none", stroke=INK, sw=2, extra=""):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'

def EL(x, y, rx, ry, fill="none", stroke=INK, sw=2, extra=""):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'

def L(x1, y1, x2, y2, stroke=INK, sw=2, extra=""):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" {extra}/>'

def P(d, fill="none", stroke=INK, sw=2, extra=""):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'

def poly(pts, fill="none", stroke=INK, sw=2, extra=""):
    s = " ".join(f"{x},{y}" for x, y in pts)
    return f'<polygon points="{s}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" {extra}/>'

def arrow(x1, y1, x2, y2, stroke=INK, sw=2.5, head=9):
    a = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 - head * math.cos(a - 0.45), y2 - head * math.sin(a - 0.45))
    p2 = (x2 - head * math.cos(a + 0.45), y2 - head * math.sin(a + 0.45))
    return (L(x1, y1, x2, y2, stroke, sw) +
            f'<polygon points="{x2},{y2} {p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}" fill="{stroke}"/>')

def arc_arrow(cx, cy, r, a0, a1, stroke=RED, sw=3):
    """Curved arrow along a circle from angle a0 to a1 (degrees, 0 = right, clockwise positive in SVG)."""
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 1 if a1 > a0 else 0
    d = f"M{x0:.1f},{y0:.1f} A{r},{r} 0 {large} {sweep} {x1:.1f},{y1:.1f}"
    t = math.radians(a1 + (90 if a1 > a0 else -90))
    hx, hy = x1 + 0 * math.cos(t), y1 + 0 * math.sin(t)
    head = 10
    p1 = (x1 - head * math.cos(t - 0.5), y1 - head * math.sin(t - 0.5))
    p2 = (x1 - head * math.cos(t + 0.5), y1 - head * math.sin(t + 0.5))
    return (P(d, "none", stroke, sw) +
            f'<polygon points="{x1:.1f},{y1:.1f} {p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}" fill="{stroke}"/>')

def badge(x, y, n, r=13):
    return C(x, y, r, RED, "#fff", 2) + T(x, y + 5.5, n, 15, "middle", "700", "#fff")

class Callouts:
    """Collect labels once; render as text labels (lesson) or numbered badges (activity)."""
    def __init__(self, mode):
        self.mode, self.items, self.n = mode, [], 0
    def add(self, label, target, text_at, anchor="start", size=15):
        self.n += 1
        self.items.append((self.n, label, target, text_at, anchor, size))
        return self.n
    def render(self):
        out = []
        for n, label, (tx, ty), (lx, ly), anchor, size in self.items:
            if self.mode == "text":
                out.append(L(tx, ty, lx, ly - 5, RED, 1.6) + C(tx, ty, 3.5, RED, RED, 1))
                out.append(T(lx + (6 if anchor == "start" else -6 if anchor == "end" else 0), ly, label, size, anchor, "600"))
            else:
                out.append(badge(tx, ty, n))
        return "".join(out)

def stick(joints, sw=7, color=INK, head_r=15, head_at="head"):
    """Draw a simple stick figure from a dict of joint coordinates.
    Keys: head, neck, hip, and limb chains as lists of points: arm_l, arm_r, leg_l, leg_r."""
    out = []
    hx, hy = joints["head"]
    out.append(C(hx, hy, head_r, "#fff", color, sw - 2))
    out.append(L(*joints["neck"], *joints["hip"], color, sw))
    for k in ("arm_l", "arm_r", "leg_l", "leg_r"):
        if k in joints:
            pts = joints[k]
            start = joints["neck"] if k.startswith("arm") else joints["hip"]
            chain = [start] + pts
            d = "M" + " L".join(f"{x},{y}" for x, y in chain)
            out.append(P(d, "none", color, sw))
    return "".join(out)
