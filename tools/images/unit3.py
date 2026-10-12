from common import *
import math

def wedge(cx, cy, r, a0, a1, fill, stroke="#fff", sw=3):
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    large = 1 if (a1 - a0) > 180 else 0
    return P(f"M{cx},{cy} L{x0:.1f},{y0:.1f} A{r},{r} 0 {large} 1 {x1:.1f},{y1:.1f} Z", fill, stroke, sw)

def plate():
    b = [T(450, 34, "A balanced plate (approximate proportions)", 24, "middle", "800")]
    cx, cy, r = 290, 255, 190
    b.append(C(cx, cy, r + 14, "#fff", "#9ca3af", 4) + C(cx, cy, r, "#f8fafc", "#d1d5db", 2))
    secs = [(-90, 52, "#86efac", "🥦🍎", "Fruit & vegetables", "just over ⅓"), (52, 172, "#fde68a", "🍞🍚", "Starchy carbohydrates", "about ⅓"),
            (172, 235, "#fca5a5", "🍗🐟🥚", "Protein foods", "about ⅙"), (235, 270, "#bfdbfe", "🥛🧀", "Dairy or alternatives", "small")]
    for a0, a1, col, em, name, amt in secs:
        b.append(wedge(cx, cy, r, a0, a1, col))
        am = math.radians((a0 + a1) / 2)
        b.append(T(cx + 0.58 * r * math.cos(am), cy + 0.58 * r * math.sin(am) + 12, em, 34, "middle"))
    b.append(C(cx, cy, 16, "#fff", "#d1d5db", 1))
    # legend
    y = 100
    for a0, a1, col, em, name, amt in secs:
        b.append(R(540, y, 22, 22, col, INK, 1.5, 4) + T(572, y + 17, name, 17, "start", "700") + T(572, y + 38, amt, 14, "start", "400", MID))
        y += 62
    b.append(R(540, y, 22, 22, "#fef3c7", INK, 1.5, 4) + T(572, y + 17, "Oils & spreads", 17, "start", "700") + T(572, y + 38, "tiny amounts, choose unsaturated", 14, "start", "400", MID))
    b.append(T(540, y + 90, "💧 Drink water through the day", 16, "start", "700"))
    b.append(T(540, y + 118, "Foods high in fat, salt and sugar:\nenjoy only now and then", 14, "start", "400", MID))
    return svg(900, 500, "".join(b), "Balanced plate model", "A plate split into fruit and vegetables, starchy foods, protein, dairy and oils.")

def macros():
    b = [T(450, 34, "The three macronutrients", 24, "middle", "800")]
    cols = [("Carbohydrates", "🍞🍝🍌🥔", "Main energy source", "4 kcal per gram", 4, "#fde68a"), ("Proteins", "🍗🐟🥚🫘", "Growth and repair", "4 kcal per gram", 4, "#fca5a5"), ("Fats", "🥑🫒🥜🧈", "Energy store, insulation,\nabsorbing vitamins A, D, E, K", "9 kcal per gram", 9, "#bef264")]
    for i, (n, em, job, kc, v, col) in enumerate(cols):
        x = 20 + i * 290
        b.append(R(x, 56, 270, 340, "#fafafa", GREY, 1.5, 12) + R(x, 56, 270, 56, col, INK, 1.5, 12) + T(x + 135, 92, n, 23, "middle", "800"))
        b.append(T(x + 135, 165, em, 40, "middle") + T(x + 135, 222, job, 15.5, "middle", "600"))
        b.append(R(x + 30, 300, 210, 28, "#e5e7eb", "none", 0, 14) + R(x + 30, 300, 210 * v / 9, 28, [GREEN, GREEN, RED][i], "none", 0, 14))
        b.append(T(x + 135, 352, kc, 17, "middle", "800"))
    b.append(T(450, 428, "Fat gives more than twice as much energy per gram as carbohydrate or protein.", 15, "middle", "600", MID))
    return svg(900, 450, "".join(b), "Carbohydrates, proteins and fats", "Three panels with food examples, functions and energy per gram.")

def micro():
    items = [("Calcium", "🥛", "Strong bones and teeth", "milk, cheese, yoghurt,\nleafy greens"), ("Iron", "🥩", "Carries oxygen in blood", "red meat, beans,\nspinach"),
             ("Vitamin C", "🍊", "Healing and immunity", "citrus fruit, peppers,\nberries"), ("Vitamin D", "☀️", "Helps absorb calcium", "sunlight, oily fish,\neggs"),
             ("Fibre", "🌾", "Healthy digestion", "wholegrains, fruit,\nvegetables, beans"), ("Water", "💧", "Temperature, transport,\nlubrication", "water, milk, fruit\nand vegetables")]
    b = [T(450, 34, "Vitamins, minerals, fibre and water", 24, "middle", "800")]
    for i, (n, em, job, src) in enumerate(items):
        x = 20 + (i % 3) * 290; y = 56 + (i // 3) * 220
        b.append(R(x, y, 270, 205, "#fafafa", GREEN, 2, 12) + T(x + 135, y + 34, n, 21, "middle", "800", GREEN) + T(x + 135, y + 88, em, 40, "middle"))
        b.append(T(x + 135, y + 128, job, 14.5, "middle", "700") + T(x + 135, y + 168, "Sources: " + src.replace("\n", " "), 12, "middle", "400", MID))
    return svg(900, 500, "".join(b), "Micronutrients, fibre and water", "Six tiles giving the job of each nutrient and example foods.")

def seesaw(cx, cy, tilt, left_label, right_label, title, note, col):
    a = math.radians(tilt)
    half = 78
    lx, ly = cx - half * math.cos(a), cy + half * math.sin(a)
    rx, ry = cx + half * math.cos(a), cy - half * math.sin(a)
    out = [poly([(cx - 24, cy + 70), (cx + 24, cy + 70), (cx, cy)], "#9ca3af", INK, 2)]
    out.append(L(lx, ly, rx, ry, INK, 8))
    out.append(R(lx - 56, ly - 62, 112, 52, "#fde68a", INK, 2, 8) + T(lx, ly - 40, "Energy IN", 13, "middle", "800") + T(lx, ly - 24, "(food, drink)", 12, "middle", "500"))
    out.append(R(rx - 56, ry - 62, 112, 52, "#bfdbfe", INK, 2, 8) + T(rx, ry - 40, "Energy OUT", 13, "middle", "800") + T(rx, ry - 24, "(BMR + activity)", 11.5, "middle", "500"))
    out.append(T(cx, cy + 108, title, 17, "middle", "800", col) + T(cx, cy + 130, note, 13, "middle", "400", MID))
    return "".join(out)

def energy_balance():
    b = [T(450, 34, "Energy balance: energy in vs energy out", 24, "middle", "800")]
    b.append(seesaw(160, 170, 0, "", "", "Balanced", "weight stays stable", GREEN))
    b.append(seesaw(450, 170, 14, "", "", "Energy in > energy out", "extra energy is stored", RED))
    b.append(seesaw(740, 170, -14, "", "", "Energy out > energy in", "stored energy is used", "#b45309"))
    b.append(T(450, 360, "Energy is measured in kilocalories (kcal) or kilojoules (kJ). Growing teenagers need plenty of energy.", 14.5, "middle", "600", MID))
    return svg(900, 390, "".join(b), "Energy balance seesaws", "Three seesaws showing balanced energy, energy intake above expenditure, and expenditure above intake.")

def energy_use():
    b = [T(450, 34, "Where does your daily energy go?", 24, "middle", "800")]
    b.append(T(450, 58, "Illustrative split for a moderately active teenager", 14, "middle", "400", MID))
    parts = [("BMR", "keeping the body running at rest\n(breathing, heartbeat, repair)", 60, GREEN), ("Physical activity", "movement, sport,\ndaily activities", 30, "#f59e0b"), ("Digestion", "", 10, "#60a5fa")]
    x = 40
    for n, d, pc, col in parts:
        w = 820 * pc / 100
        b.append(R(x, 90, w, 90, col, INK, 2, 4) + T(x + w / 2, 128, n, 18 if pc > 15 else 13, "middle", "800", "#fff" if col == GREEN else INK) + T(x + w / 2, 156, f"about {pc}%", 15, "middle", "700", "#fff" if col == GREEN else INK))
        if d:
            b.append(T(x + w / 2, 212, d, 13.5, "middle", "400"))
        x += w
    b.append(T(450, 300, "Basal metabolic rate (BMR) is the energy your body needs at rest. Activity is the part you can change most.", 14.5, "middle", "600", MID))
    b.append(T(450, 326, "Estimated energy requirement (EER) = BMR × physical activity level (PAL)", 16, "middle", "800"))
    return svg(900, 360, "".join(b), "Daily energy expenditure", "A stacked bar showing BMR, physical activity and digestion as shares of daily energy use.")

ALL = {"plate-model": plate, "macronutrients": macros, "micronutrients": micro, "energy-balance": energy_balance, "energy-use": energy_use}
def build():
    for n, fn in ALL.items():
        save(n + ".svg", fn())
