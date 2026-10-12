from common import *

def components():
    health = [("Cardiovascular\nendurance", "🫀"), ("Muscular\nstrength", "💪"), ("Muscular\nendurance", "🔁"), ("Flexibility", "🤸"), ("Body\ncomposition", "⚖️")]
    skill = [("Agility", "↔️"), ("Balance", "🧘"), ("Co-ordination", "🎯"), ("Power", "💥"), ("Reaction time", "⚡"), ("Speed", "🏃")]
    b = [T(450, 40, "The 11 components of fitness", 26, "middle", "800")]
    b.append(R(20, 62, 860, 40, GREEN, GREEN, 1, 8) + T(450, 90, "Health-related (5): important for everyone's health", 19, "middle", "700", "#fff"))
    for i, (n, ic) in enumerate(health):
        x = 20 + i * 174
        b.append(R(x, 112, 164, 120, LIGHT, GREEN, 2, 10) + T(x + 82, 160, ic, 40, "middle") + T(x + 82, 192 if "\n" not in n else 186, n, 15, "middle", "700"))
    b.append(R(20, 250, 860, 40, RED, RED, 1, 8) + T(450, 278, "Skill-related (6): help you perform in sport", 19, "middle", "700", "#fff"))
    for i, (n, ic) in enumerate(skill):
        x = 20 + i * 145
        b.append(R(x, 300, 135, 100, LIGHT, RED, 2, 10) + T(x + 67, 346, ic, 34, "middle") + T(x + 67, 382, n, 14.5, "middle", "700"))
    return svg(900, 420, "".join(b), "The 11 components of fitness", "Five health-related and six skill-related components of fitness shown as tiles.")

def cone(x, y, c=RED):
    return poly([(x, y - 16), (x - 9, y + 6), (x + 9, y + 6)], c, INK, 1.5) + L(x - 12, y + 6, x + 12, y + 6, INK, 2)

def beep():
    b = [T(450, 34, "Multistage fitness (bleep) test: set-up", 24, "middle", "800")]
    b.append(L(110, 160, 110, 260, INK, 4) + L(790, 160, 790, 260, INK, 4))
    b.append(T(110, 134, "Line A", 16, "middle", "700") + T(790, 134, "Line B", 16, "middle", "700"))
    b.append(arrow(130, 190, 770, 190, GREEN, 4, 12) + arrow(770, 230, 130, 230, RED, 4, 12))
    b.append(L(110, 285, 790, 285, MID, 1.5) + L(110, 278, 110, 292, MID, 1.5) + L(790, 278, 790, 292, MID, 1.5))
    b.append(T(450, 308, "20 m", 20, "middle", "700"))
    for x in (110, 790):
        for y in (165, 255):
            b.append(cone(x, y))
    b.append(T(450, 110, "🔊  Recorded beeps set the pace", 17, "middle", "600"))
    b.append(R(120, 340, 660, 100, LIGHT, GREEN, 2, 10))
    b.append(T(140, 368, "1. Reach the line at or before each beep, then turn and run back.", 16))
    b.append(T(140, 394, "2. The beeps get closer together each level, so you run faster.", 16))
    b.append(T(140, 420, "3. Score = last level and shuttle completed before you can't keep up (e.g. 9.5).", 16))
    return svg(900, 460, "".join(b), "Multistage fitness test layout", "Two lines 20 metres apart with cones; runners shuttle between them to a beep.")

def sit_reach():
    b = [T(450, 34, "Sit-and-reach test", 24, "middle", "800")]
    b.append(L(60, 270, 840, 270, MID, 2))
    # box
    b.append(R(520, 190, 150, 80, "#e5e7eb", INK, 2, 4))
    b.append(R(500, 170, 360, 20, "#fff", INK, 2, 3))
    for i in range(0, 37):
        x = 500 + i * 10
        b.append(L(x, 170, x, 170 + (12 if i % 5 == 0 else 6), INK, 1.2))
    b.append(T(500, 162, "0", 13, "middle") + T(680, 162, "cm", 13, "middle") + T(860, 162, "36", 13, "middle"))
    # person sitting (side), legs straight, feet flat on box
    b.append(L(300, 250, 520, 250, INK, 9))                 # legs
    b.append(P("M300,250 C290,200 280,170 300,130", "none", INK, 9))  # back leaning forward
    b.append(L(300, 150, 505, 188, INK, 8))               # arms reaching
    b.append(C(318, 108, 17, "#fff", INK, 5))
    b.append(L(515, 255, 515, 215, INK, 7))
    b.append(T(190, 118, "Keep legs straight\nand feet flat on box", 15, "middle", "600"))
    b.append(arrow(235, 150, 292, 200, RED, 2.5, 9) if False else "")
    b.append(R(60, 300, 780, 112, LIGHT, GREEN, 2, 10))
    b.append(T(80, 328, "1. Sit with legs straight and feet flat against the box. Warm up first.", 16))
    b.append(T(80, 354, "2. Reach forward slowly with both hands, one on top of the other.", 16))
    b.append(T(80, 380, "3. Hold the furthest point for 2 seconds. Do not bounce.", 16))
    b.append(T(80, 404, "4. Record the distance reached in cm. Best of 3 attempts.", 16))
    return svg(900, 430, "".join(b), "Sit-and-reach test", "A seated person reaching forward along a measuring box.")

def long_jump():
    b = [T(450, 34, "Standing long jump", 24, "middle", "800")]
    b.append(L(40, 250, 860, 250, INK, 3))
    b.append(L(150, 235, 150, 265, RED, 5) + T(150, 290, "Take-off line", 15, "middle", "700"))
    # figures
    b.append(stick({"head": (120, 120), "neck": (125, 140), "hip": (140, 205), "arm_l": [(110, 190)], "arm_r": [(155, 185)], "leg_l": [(130, 250)], "leg_r": [(150, 250)]}, 7, INK, 14))
    b.append(stick({"head": (400, 90), "neck": (390, 110), "hip": (350, 160), "arm_l": [(430, 100), (460, 80)], "arm_r": [(420, 120), (450, 100)], "leg_l": [(380, 200), (410, 235)], "leg_r": [(360, 205), (390, 245)]}, 7, "#8aa191", 14))
    b.append(stick({"head": (640, 165), "neck": (645, 190), "hip": (630, 235), "arm_l": [(670, 215), (690, 225)], "arm_r": [(660, 205), (685, 210)], "leg_l": [(640, 250)], "leg_r": [(620, 250)]}, 7, INK, 14))
    b.append(P("M150,235 Q400,20 625,235", "none", GREEN, 3, 'stroke-dasharray="8 8"'))
    b.append(L(150, 305, 625, 305, MID, 2) + L(150, 298, 150, 312, MID, 2) + L(625, 298, 625, 312, MID, 2))
    b.append(T(388, 335, "Measure from the take-off line to the back of the nearest heel", 16, "middle", "700"))
    b.append(R(60, 360, 780, 90, LIGHT, GREEN, 2, 10))
    b.append(T(80, 388, "Feet shoulder-width apart behind the line. Swing the arms back, then jump forward as far as you can,", 15.5))
    b.append(T(80, 410, "landing on both feet without falling backwards. Record the best of 3 attempts in cm or m.", 15.5))
    b.append(T(80, 432, "Measures: leg power.", 15.5, "start", "700"))
    return svg(900, 470, "".join(b), "Standing long jump", "Take-off line, jumping arc and landing, with the distance measured to the rear heel.")

def illinois():
    b = [T(450, 34, "Illinois agility run (10 m × 5 m)", 24, "middle", "800")]
    x0, y0, w, h = 150, 80, 600, 300   # 10 m = 600 px, 5 m = 300 px
    mid_y = y0 + h / 2
    b.append(R(x0, y0, w, h, "#f8fafc", MID, 1.5, 0, 'stroke-dasharray="6 6"'))
    mids = [(x0 + w / 2 - 180 + i * 120, mid_y) for i in range(4)]
    # leg 1: out along the bottom, leg 2: back
    b.append(arrow(x0 + 20, y0 + h - 14, x0 + w - 24, y0 + h - 14, GREEN, 3.5, 11))
    b.append(arrow(x0 + w - 24, y0 + h - 52, x0 + 20, y0 + h - 52, GREEN, 3.5, 11))
    # leg 3: weave up through the middle cones, leg 4: weave back
    up = [(x0 + 24, mid_y + 36), (mids[0][0], mid_y - 36), (mids[1][0], mid_y + 36), (mids[2][0], mid_y - 36), (mids[3][0], mid_y + 36), (x0 + w - 24, mid_y - 36)]
    b.append(P("M" + " L".join(f"{x},{y}" for x, y in up), "none", "#f59e0b", 3, 'stroke-dasharray="1 0"'))
    back = [(x0 + w - 24, mid_y + 6), (mids[3][0], mid_y - 18), (mids[2][0], mid_y + 18), (mids[1][0], mid_y - 18), (mids[0][0], mid_y + 18), (x0 + 24, mid_y - 6)]
    b.append(P("M" + " L".join(f"{x},{y}" for x, y in back), "none", RED, 2.5, 'stroke-dasharray="7 5"'))
    # leg 5: final sprint along the top
    b.append(arrow(x0 + 20, y0 + 20, x0 + w - 24, y0 + 20, GREEN, 3.5, 11))
    for (cx, cy) in [(x0, y0), (x0 + w, y0), (x0, y0 + h), (x0 + w, y0 + h)]:
        b.append(cone(cx, cy))
    for (cx, cy) in mids:
        b.append(cone(cx, cy, "#f59e0b"))
    for n, (lx, ly) in enumerate([(x0 + w / 2, y0 + h - 62), (x0 + w / 2, y0 + h - 24), (x0 + w / 2, mid_y + 62), (x0 + w / 2, mid_y - 62), (x0 + w / 2, y0 + 40)], 1):
        pass
    for n, (lx, ly) in [(1, (x0 + 60, y0 + h - 22)), (2, (x0 + 60, y0 + h - 60)), (3, (x0 + 60, mid_y + 56)), (4, (x0 + 60, mid_y - 52)), (5, (x0 + 60, y0 + 54))]:
        b.append(C(lx, ly, 12, GREEN, "#fff", 2) + T(lx, ly + 5, n, 14, "middle", "800", "#fff"))
    b.append(T(x0 - 14, y0 + h + 30, "START", 15, "middle", "800", GREEN) + T(x0 + w + 22, y0 + 5, "FINISH", 15, "start", "800", RED))
    b.append(L(x0, y0 - 18, x0 + w, y0 - 18, MID, 1.5) + T(x0 + w / 2, y0 - 26, "10 m", 16, "middle", "700"))
    b.append(L(x0 - 30, y0, x0 - 30, y0 + h, MID, 1.5) + T(x0 - 38, y0 + h / 2, "5 m", 16, "end", "700"))
    b.append(T(x0 + w / 2, y0 + h + 30, "Middle cones 3.3 m apart", 14, "middle", "600", "#b45309"))
    b.append(R(60, 425, 780, 96, LIGHT, GREEN, 2, 10))
    b.append(T(80, 452, "Start lying face down. On 'Go': (1) run the length, (2) run back, (3) weave up through the four", 15))
    b.append(T(80, 474, "middle cones, (4) weave back, (5) sprint the length to the finish. Do not knock cones.", 15))
    b.append(T(80, 498, "Time to 0.1 s. Measures: agility.", 15, "start", "700"))
    return svg(900, 540, "".join(b), "Illinois agility run layout", "A 10 m by 5 m rectangle with four corner cones and four central cones; numbered legs show the running route.")

def sprint():
    b = [T(450, 34, "30 m / 40 m sprint test", 24, "middle", "800")]
    b.append(L(60, 200, 840, 200, INK, 3))
    for x, lab in ((100, "Start"), (820, "Finish")):
        b.append(L(x, 170, x, 230, RED if x > 500 else GREEN, 6) + T(x, 262, lab, 16, "middle", "700"))
    b.append(stick({"head": (125, 120), "neck": (135, 140), "hip": (150, 190), "arm_l": [(115, 160), (100, 175)], "arm_r": [(165, 165), (180, 150)], "leg_l": [(125, 220)], "leg_r": [(190, 225)]}, 7, INK, 14) if False else
             stick({"head": (410, 110), "neck": (400, 132), "hip": (375, 185), "arm_l": [(430, 150), (455, 135)], "arm_r": [(375, 150), (350, 165)], "leg_l": [(415, 205), (400, 245)], "leg_r": [(345, 210), (320, 245)]}, 7, INK, 14))
    b.append(arrow(480, 125, 650, 125, GREEN, 4, 12))
    b.append(L(100, 290, 820, 290, MID, 2) + L(100, 283, 100, 297, MID, 2) + L(820, 283, 820, 297, MID, 2))
    b.append(T(460, 320, "Marked distance (30 m or 40 m)", 17, "middle", "700"))
    b.append(R(60, 350, 780, 100, LIGHT, GREEN, 2, 10))
    b.append(T(80, 378, "Start from a standing or crouch start behind the line. Timer starts on the first movement", 15.5))
    b.append(T(80, 400, "and stops as the torso crosses the finish line. Run through the line. Record time to 0.1 s.", 15.5))
    b.append(T(80, 424, "Measures: speed. Use the same surface and footwear when you retest.", 15.5, "start", "700"))
    return svg(900, 470, "".join(b), "Sprint test", "Runner accelerating over a measured 30 or 40 metre straight.")

def ruler_drop():
    b = [T(450, 34, "Ruler drop test", 24, "middle", "800")]
    b.append(R(420, 60, 40, 300, "#fde68a", INK, 2, 3))
    for i in range(0, 31):
        y = 60 + i * 10
        b.append(L(420, y, 420 + (22 if i % 5 == 0 else 12), y, INK, 1))
        if i % 5 == 0 and i:
            b.append(T(452, y + 4, str(i), 11, "end"))
    b.append(T(440, 52, "0", 12, "middle", "700"))
    # hand below zero
    b.append(R(380, 320, 120, 14, SKIN, "#8a5c44", 2, 6) + R(380, 350, 120, 14, SKIN, "#8a5c44", 2, 6))
    b.append(T(540, 342, "Thumb and finger open,\nready to catch", 15, "start", "600"))
    b.append(arrow(560, 120, 560, 215, RED, 3.5, 12))
    b.append(T(580, 160, "Dropped\nwithout warning", 15, "start", "600"))
    b.append(R(60, 395, 780, 85, LIGHT, GREEN, 2, 10))
    b.append(T(80, 423, "Hold the ruler so the 0 cm mark is level with the top of the tester's thumb. Drop it without warning.", 15))
    b.append(T(80, 447, "The tester catches it as fast as possible. Record where it was caught: shorter distance = faster", 15))
    b.append(T(80, 468, "reaction time. Measures: reaction time.", 15, "start", "700"))
    return svg(900, 500, "".join(b), "Ruler drop test", "A ruler dropping between a person's open thumb and finger.")

def stork():
    b = [T(450, 34, "Stork stand test (balance)", 24, "middle", "800")]
    b.append(L(60, 300, 840, 300, INK, 3))
    b.append(stick({"head": (330, 100), "neck": (330, 122), "hip": (330, 210), "arm_l": [(290, 190)], "arm_r": [(370, 190)], "leg_l": [(330, 260), (330, 298)], "leg_r": [(350, 240), (330, 245)]}, 7, INK, 15))
    b.append(L(300, 298, 360, 298, RED, 5))
    b.append(T(500, 190, "Hands on hips.\nOne foot against the\nknee of the standing leg.", 16, "start", "600"))
    b.append(R(60, 335, 780, 105, LIGHT, GREEN, 2, 10))
    b.append(T(80, 363, "Stand on one leg. On 'Go', raise the heel of that foot off the floor and balance on the ball of the foot.", 15))
    b.append(T(80, 387, "Stop the stopwatch if the heel touches down, the hands leave the hips or the foot moves.", 15))
    b.append(T(80, 411, "Record the time in seconds. Repeat on the other leg. Measures: balance.", 15, "start", "700"))
    return svg(900, 460, "".join(b), "Stork stand test", "Person balancing on the ball of one foot with the other foot against the knee.")

def pushup():
    b = [T(450, 34, "One-minute push-up test", 24, "middle", "800")]
    b.append(L(60, 300, 840, 300, INK, 3))
    for (ox, label, hip_y, elbow) in ((120, "Up", 195, 0), (480, "Down", 262, 1)):
        j = {"head": (ox + 30, hip_y - 62 + (30 if elbow else 0)), "neck": (ox + 50, hip_y - 35 + (25 if elbow else 0)), "hip": (ox + 260, hip_y + (0 if not elbow else 0))}
        b.append(L(ox + 50, hip_y - 35 + (25 if elbow else 0), ox + 270, hip_y, INK, 8))
        b.append(C(ox + 28, hip_y - 52 + (28 if elbow else 0), 15, "#fff", INK, 5))
        b.append(L(ox + 270, hip_y, ox + 350, 298, INK, 7))
        b.append(P(f"M{ox+60},{hip_y-28+(25 if elbow else 0)} L{ox+(75 if elbow else 62)},{(278 if elbow else 255)} L{ox+62},298", "none", INK, 7))
        b.append(T(ox + 190, 335, label, 16, "middle", "700"))
    b.append(R(60, 360, 780, 100, LIGHT, GREEN, 2, 10))
    b.append(T(80, 388, "Body in a straight line from head to heels. Lower until the elbows reach about 90 degrees, push up.", 15))
    b.append(T(80, 412, "Count each full, correct push-up in 60 seconds. Stop if your form breaks down (hips sag or rise).", 15))
    b.append(T(80, 436, "Measures: muscular endurance (arms and chest). Knee push-ups are a modified version.", 15, "start", "700"))
    return svg(900, 480, "".join(b), "One-minute push-up test", "Side view of the up and down positions of a push-up.")

def grip():
    b = [T(450, 34, "Grip strength dynamometer test", 24, "middle", "800")]
    b.append(R(330, 120, 240, 100, "#e5e7eb", INK, 3, 20))
    b.append(EL(450, 170, 70, 28, "#fff", INK, 2))
    b.append(T(450, 176, "kg", 22, "middle", "800"))
    b.append(P("M330,200 Q300,260 380,270 L520,270 Q600,260 570,200", "#d1d5db", INK, 3))
    b.append(stick({"head": (450, 60), "neck": (450, 82), "hip": (450, 140), "arm_l": [(400, 170)], "arm_r": [(500, 170)]}, 6, INK, 0) if False else "")
    b.append(T(450, 320, "Squeeze as hard as possible for about 3 seconds", 17, "middle", "700"))
    b.append(R(60, 345, 780, 105, LIGHT, GREEN, 2, 10))
    b.append(T(80, 373, "Stand with the arm hanging by your side, elbow straight, not touching the body. Squeeze the handle", 15))
    b.append(T(80, 397, "as hard as you can. Record the reading in kg. Do 2-3 attempts on each hand and use your best.", 15))
    b.append(T(80, 421, "Measures: muscular strength (hand and forearm).", 15, "start", "700"))
    return svg(900, 470, "".join(b), "Grip strength test", "A hand dynamometer used to measure grip strength in kilograms.")

def bar_vs_norm():
    scores = [("Sit-and-reach\n(cm)", 28, 30), ("Push-ups\n(in 1 min)", 34, 30), ("Standing long\njump (cm)", 195, 200), ("Bleep test\n(level)", 8.5, 9)]
    b = [T(450, 34, "Class results compared with normative data", 22, "middle", "800")]
    b.append(T(450, 58, "Example data: a student's score (green) and the average for their age group (grey)", 14, "middle", "400", MID))
    for i, (name, mine, norm) in enumerate(scores):
        x = 70 + i * 200
        mx = max(mine, norm) * 1.15
        for j, (val, col) in enumerate(((mine, GREEN), (norm, "#9ca3af"))):
            hh = val / mx * 220
            b.append(R(x + j * 62, 320 - hh, 52, hh, col, INK, 1.5, 3) + T(x + j * 62 + 26, 312 - hh, f"{val:g}", 15, "middle", "700"))
        b.append(T(x + 57, 350, name, 14, "middle", "600"))
    b.append(L(50, 320, 860, 320, INK, 2))
    b.append(R(660, 84, 14, 14, GREEN, GREEN, 1) + T(680, 96, "Student", 14) + R(750, 84, 14, 14, "#9ca3af", "#9ca3af", 1) + T(770, 96, "Average", 14))
    return svg(900, 400, "".join(b), "Bar chart: student scores versus normative data", "Four paired bars compare a student's fitness test results with average values.")

def progress_line():
    weeks = [0, 2, 4, 6, 8, 10, 12]
    levels = [6.2, 6.8, 7.3, 7.9, 8.2, 8.9, 9.4]
    b = [T(450, 34, "Bleep test level over a 12-week training programme", 22, "middle", "800")]
    b.append(T(450, 58, "Example data for one student", 14, "middle", "400", MID))
    x0, y0, w, h = 110, 90, 700, 270
    for k in range(5, 11):
        y = y0 + h - (k - 5) / 5 * h
        b.append(L(x0, y, x0 + w, y, "#e5e7eb", 1) + T(x0 - 12, y + 5, str(k), 14, "end"))
    pts = []
    for wk, lv in zip(weeks, levels):
        x = x0 + wk / 12 * w
        y = y0 + h - (lv - 5) / 5 * h
        pts.append((x, y))
        b.append(T(x, y0 + h + 24, str(wk), 14, "middle"))
    b.append(L(x0, y0, x0, y0 + h, INK, 2) + L(x0, y0 + h, x0 + w, y0 + h, INK, 2))
    b.append(P("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts), "none", GREEN, 4))
    for (x, y), lv in zip(pts, levels):
        b.append(C(x, y, 6, GREEN, "#fff", 2) + T(x + (14 if lv == levels[0] else 0), y - 14, f"{lv}", 13, "middle", "700"))
    b.append(T(x0 + w / 2, y0 + h + 52, "Week of programme", 16, "middle", "700"))
    b.append(f'<text transform="translate(40 {y0 + h/2}) rotate(-90)" font-size="16" text-anchor="middle" font-weight="700">Bleep test level</text>')
    return svg(900, 440, "".join(b), "Line graph: bleep test level over 12 weeks", "A rising line from level 6.2 to level 9.4 across 12 weeks.")

def vo2():
    cats = [("Untrained\nteenager", 35, 45), ("Active\nteenager", 45, 55), ("Well-trained\nathlete", 55, 70), ("Elite endurance\nathlete", 70, 85)]
    b = [T(450, 34, "VO₂ max: typical ranges (ml/kg/min)", 22, "middle", "800")]
    b.append(T(450, 58, "Illustrative ranges only: real values vary with age, sex and genetics", 14, "middle", "400", MID))
    for i, (n, lo, hi) in enumerate(cats):
        x = 80 + i * 200
        y_lo, y_hi = 330 - lo / 90 * 250, 330 - hi / 90 * 250
        b.append(R(x, y_hi, 120, y_lo - y_hi, [LIME, GREEN, "#f59e0b", RED][i], INK, 1.5, 4))
        b.append(T(x + 60, y_hi - 8, f"{lo}-{hi}", 15, "middle", "700"))
        b.append(T(x + 60, 358, n, 14, "middle", "600"))
    b.append(L(50, 330, 860, 330, INK, 2) + L(50, 70, 50, 330, INK, 2))
    for v in (0, 20, 40, 60, 80):
        y = 330 - v / 90 * 250
        b.append(T(40, y + 5, str(v), 13, "end") + L(46, y, 54, y, INK, 1.5))
    return svg(900, 400, "".join(b), "Chart of typical VO2 max ranges", "Four bars show typical VO2 max ranges from untrained teenagers to elite endurance athletes.")

def factors():
    b = [T(450, 34, "Factors that affect fitness", 24, "middle", "800")]
    cs = [(350, 200, GREEN, "Physical"), (550, 200, RED, "Psychological"), (450, 320, "#f59e0b", "Social")]
    for (x, y, c, n) in cs:
        b.append(C(x, y, 125, c, c, 2, 'fill-opacity="0.22"'))
    b.append(T(285, 150, "PHYSICAL", 17, "middle", "800", GREEN) + T(285, 176, "age, sex, genetics,\nsleep, diet, health,\ninjury, body type", 14, "middle"))
    b.append(T(615, 150, "PSYCHOLOGICAL", 16, "middle", "800", RED) + T(615, 176, "motivation, stress,\nconfidence, mood,\nattitude to exercise", 14, "middle"))
    b.append(T(450, 362, "SOCIAL", 17, "middle", "800", "#b45309") + T(450, 386, "family, friends, culture,\naccess to facilities, cost, time", 14, "middle"))
    b.append(T(450, 232, "Your\nfitness", 18, "middle", "800"))
    return svg(900, 470, "".join(b), "Physical, psychological and social factors affecting fitness", "Three overlapping circles with examples of each factor.")

def overload():
    b = [T(450, 34, "Progressive overload and reversibility", 22, "middle", "800")]
    x0, y0 = 90, 330
    b.append(L(x0, y0, 840, y0, INK, 2) + L(x0, 70, x0, y0, INK, 2))
    pts = [(90, 300), (160, 300), (200, 270), (260, 270), (300, 235), (360, 235), (400, 200), (460, 200), (500, 165), (540, 165)]
    b.append(P("M" + " L".join(f"{x},{y}" for x, y in pts), "none", GREEN, 4))
    b.append(P("M540,165 L600,200 L660,250 L720,285 L780,300", "none", RED, 4, 'stroke-dasharray="9 7"'))
    b.append(T(300, 120, "Progressive overload:\ngradually increase the demand\nand fitness steps up", 15, "middle", "700", GREEN))
    b.append(T(690, 150, "Reversibility:\nstop training and\nfitness is lost", 15, "middle", "700", RED))
    b.append(T(465, 372, "Time", 16, "middle", "700"))
    b.append(f'<text transform="translate(40 {(70+y0)/2}) rotate(-90)" font-size="16" text-anchor="middle" font-weight="700">Fitness level</text>')
    b.append(T(540, 155, "Training stops", 13, "middle", "600", MID))
    return svg(900, 400, "".join(b), "Progressive overload and reversibility", "Fitness rising in steps with training, then falling when training stops.")

def session():
    parts = [("Warm-up", "10 min", LIME), ("Endurance training", "20 min", GREEN), ("Resistance training", "20 min", "#f59e0b"), ("Cool-down", "10 min", RED)]
    b = [T(450, 34, "Elements of a general training session", 22, "middle", "800")]
    x = 40
    for n, t, c in parts:
        w = {"10 min": 130, "20 min": 260}[t]
        b.append(R(x, 80, w, 120, c, INK, 2, 6) + T(x + w / 2, 135, n, 17, "middle", "800", "#fff" if c in (GREEN, RED) else INK) + T(x + w / 2, 165, t, 15, "middle", "600", "#fff" if c in (GREEN, RED) else INK))
        x += w + 10
    b.append(T(450, 245, "Example 60-minute session (timings are a guide)", 15, "middle", "400", MID))
    b.append(T(105, 290, "pulse raiser,\nmobility, dynamic\nstretches", 14, "middle") + T(310, 290, "continuous, interval or\nfartlek work", 14, "middle") + T(580, 290, "circuits, bodyweight\nor weights", 14, "middle") + T(785, 290, "slow jog/walk,\nstatic stretching", 14, "middle"))
    return svg(900, 340, "".join(b), "Elements of a training session", "A timeline: warm-up, endurance training, resistance training and cool-down.")

def methods_profiles():
    b = [T(450, 34, "Intensity profiles of training methods", 22, "middle", "800")]
    panels = [("Continuous", "steady pace", [(0, 50), (100, 50)]),
              ("Interval", "work / rest", None), ("Fartlek", "speed play", None)]
    for i, (name, sub, _) in enumerate(panels):
        x0 = 40 + i * 285
        b.append(R(x0, 60, 255, 220, "#fafafa", GREY, 1.5, 8))
        b.append(T(x0 + 127, 86, name, 18, "middle", "800") + T(x0 + 127, 106, sub, 13, "middle", "400", MID))
        gx, gy, gw, gh = x0 + 30, 125, 200, 120
        b.append(L(gx, gy, gx, gy + gh, INK, 1.5) + L(gx, gy + gh, gx + gw, gy + gh, INK, 1.5))
        if i == 0:
            d = f"M{gx},{gy+gh-60} L{gx+gw},{gy+gh-60}"
        elif i == 1:
            seg = []
            for k in range(5):
                a = gx + k * 40
                seg += [(a, gy + gh - 15), (a, gy + gh - 100), (a + 20, gy + gh - 100), (a + 20, gy + gh - 15), (a + 40, gy + gh - 15)]
            d = "M" + " L".join(f"{x},{y}" for x, y in seg)
        else:
            vals = [50, 85, 30, 100, 45, 70, 25, 90, 55, 35, 80, 60]
            d = "M" + " L".join(f"{gx + k * gw / (len(vals)-1):.1f},{gy + gh - v:.1f}" for k, v in enumerate(vals))
        b.append(P(d, "none", [GREEN, RED, "#f59e0b"][i], 3.5))
        b.append(T(gx + gw / 2, gy + gh + 22, "time", 13, "middle") + f'<text transform="translate({gx-12} {gy+gh/2}) rotate(-90)" font-size="13" text-anchor="middle">intensity</text>')
    b.append(T(450, 315, "Other methods: circuit (stations), weight training (resistance), plyometrics (explosive jumps)", 14, "middle", "400", MID))
    return svg(900, 340, "".join(b), "Intensity profiles of continuous, interval and fartlek training", "Three small graphs: flat line for continuous, square wave for interval, irregular line for fartlek.")

def hr_zones(age=15):
    mx = 220 - age
    zones = [("Zone 1", "50-60%", "Very light: warm-up, recovery", LIME, .50, .60), ("Zone 2", "60-70%", "Light: aerobic base", "#86efac", .60, .70),
             ("Zone 3", "70-80%", "Moderate: aerobic fitness", "#fde047", .70, .80), ("Zone 4", "80-90%", "Hard: anaerobic threshold", "#fb923c", .80, .90),
             ("Zone 5", "90-100%", "Maximum effort", RED, .90, 1.0)]
    b = [T(450, 34, f"Heart rate training zones (example: age {age}, max HR {mx} bpm)", 21, "middle", "800")]
    b.append(T(450, 58, "Estimated max HR = 220 − age. Zones are a % of max HR.", 14, "middle", "400", MID))
    for i, (z, pct, desc, col, lo, hi) in enumerate(zones):
        y = 80 + i * 66
        w = 220 + i * 100
        b.append(R(40, y, w, 54, col, INK, 1.5, 6))
        b.append(T(54, y + 24, f"{z}  {pct}", 17, "start", "800") + T(54, y + 44, desc, 13.5, "start", "500"))
        b.append(T(40 + w + 14, y + 33, f"{round(mx*lo)}-{round(mx*hi)} bpm", 17, "start", "700"))
    return svg(900, 420, "".join(b), "Heart rate training zones", "Five bars from zone 1 (50-60% of max HR) to zone 5 (90-100%) with example beats per minute.")

def karvonen():
    b = [T(450, 34, "Karvonen method: worked example", 24, "middle", "800")]
    b.append(R(40, 60, 820, 60, "#fef3c7", "#f59e0b", 2, 10) + T(450, 98, "Target HR = [(Max HR − Resting HR) × intensity %] + Resting HR", 20, "middle", "800"))
    steps = [("1", "Max HR", "220 − 15 = 205 bpm"), ("2", "Heart rate reserve (HRR)", "205 − 65 = 140 bpm"),
             ("3", "Intensity: 70% of HRR", "140 × 0.70 = 98"), ("4", "Add resting HR back", "98 + 65 = 163 bpm")]
    for i, (n, a, v) in enumerate(steps):
        y = 145 + i * 62
        b.append(C(70, y + 22, 20, GREEN, GREEN, 1) + T(70, y + 29, n, 20, "middle", "800", "#fff"))
        b.append(R(105, y, 755, 46, LIGHT, GREEN, 1.5, 8) + T(125, y + 29, a, 17, "start", "700") + T(840, y + 29, v, 17, "end", "800", GREEN))
    b.append(T(450, 420, "Student aged 15 with a resting heart rate of 65 bpm training at 70% intensity", 15, "middle", "400", MID))
    return svg(900, 440, "".join(b), "Karvonen method worked example", "Step-by-step calculation of a target heart rate using heart rate reserve.")

def overtraining():
    b = [T(450, 34, "Training load and performance", 22, "middle", "800")]
    x0, y0 = 90, 320
    b.append(L(x0, y0, 840, y0, INK, 2) + L(x0, 70, x0, y0, INK, 2))
    b.append(P("M90,290 C200,260 300,190 400,130 C480,85 520,100 570,150 C620,205 680,260 780,290", "none", GREEN, 4))
    b.append(R(400, 76, 160, 244, RED, RED, 0, 0, 'fill-opacity="0.08"'))
    b.append(L(400, 76, 400, 320, RED, 2, 'stroke-dasharray="6 6"'))
    b.append(T(240, 110, "Good training: load and\nrecovery are balanced,\nperformance improves", 15, "middle", "700", GREEN))
    b.append(T(660, 110, "Over-training: too much load,\ntoo little recovery,\nperformance falls", 15, "middle", "700", RED))
    b.append(T(465, 352, "Training load over time", 16, "middle", "700"))
    b.append(f'<text transform="translate(40 {(70+y0)/2}) rotate(-90)" font-size="16" text-anchor="middle" font-weight="700">Performance</text>')
    return svg(900, 380, "".join(b), "Over-training and performance", "Performance rises with balanced training then falls when training load is too high.")

def wearable():
    b = [T(450, 34, "How wearable technology and AI can support training", 22, "middle", "800")]
    boxes = [("⌚", "Sensors", "heart rate, steps,\nmovement, sleep"), ("☁️", "Data", "stored and\nanalysed by software / AI"), ("📈", "Insights", "trends, zones,\nrecovery and load")]
    for i, (ic, h, d) in enumerate(boxes):
        x = 40 + i * 290
        b.append(R(x, 70, 250, 160, LIGHT, GREEN, 2, 12) + T(x + 125, 125, ic, 44, "middle") + T(x + 125, 160, h, 19, "middle", "800") + T(x + 125, 186, d, 14, "middle"))
        if i < 2:
            b.append(arrow(x + 255, 150, x + 285, 150, GREEN, 4, 11))
    b.append(R(40, 260, 400, 150, "#ecfdf5", GREEN, 2, 10) + T(240, 288, "Benefits", 18, "middle", "800", GREEN) + T(60, 316, "• Track progress over time\n• Spot signs of over-training\n• Personalise training\n• Motivation and goal tracking", 15))
    b.append(R(460, 260, 400, 150, "#fef2f2", RED, 2, 10) + T(660, 288, "Limitations", 18, "middle", "800", RED) + T(480, 316, "• Not always accurate\n• Data privacy and security\n• Can't replace a coach or doctor\n• Too much data can confuse", 15))
    return svg(900, 430, "".join(b), "Wearables and AI in performance tracking", "Sensors feed data to software which produces insights, with benefits and limitations listed.")

ALL = {"components-of-fitness": components, "protocol-beep-test": beep, "protocol-sit-and-reach": sit_reach, "protocol-standing-long-jump": long_jump,
       "protocol-illinois-agility": illinois, "protocol-sprint": sprint, "protocol-ruler-drop": ruler_drop, "protocol-stork-stand": stork,
       "protocol-push-up": pushup, "protocol-grip-strength": grip, "chart-fitness-vs-norms": bar_vs_norm, "chart-bleep-progress": progress_line,
       "chart-vo2max": vo2, "factors-affecting-fitness": factors, "chart-overload-reversibility": overload, "training-session-elements": session,
       "training-method-profiles": methods_profiles, "hr-training-zones": hr_zones, "karvonen-worked-example": karvonen,
       "chart-overtraining": overtraining, "wearable-ai": wearable}

def build():
    for name, fn in ALL.items():
        save(name + ".svg", fn())
