from common import *
import math

AX_FILL, AX_EDGE = "#bbf7d0", "#15803d"      # axial skeleton
AP_FILL, AP_EDGE = "#fecaca", "#b91c1c"      # appendicular skeleton

def bone(x1, y1, x2, y2, w=12, fill=AP_FILL, edge=AP_EDGE):
    return L(x1, y1, x2, y2, edge, w + 4) + L(x1, y1, x2, y2, fill, w)

def skeleton(mode="text"):
    co = Callouts(mode)
    b = [T(450, 30, "The human skeleton (front view)", 24, "middle", "800")]
    cx = 450
    # --- axial: skull
    b.append(EL(cx, 82, 40, 46, AX_FILL, AX_EDGE, 3))
    b.append(P("M418,112 Q450,150 482,112 L474,108 Q450,128 426,108 Z", AX_FILL, AX_EDGE, 2.5))
    b.append(C(436, 82, 7, "#fff", AX_EDGE, 2) + C(464, 82, 7, "#fff", AX_EDGE, 2))
    # spine
    for i in range(22):
        y = 134 + i * 10
        w = 18 + (i / 22) * 14
        b.append(R(cx - w / 2, y, w, 8, AX_FILL, AX_EDGE, 1.8, 3))
    # ribs
    for i in range(8):
        y = 160 + i * 17
        sp = 38 + min(i, 4) * 14 - max(0, i - 4) * 10
        b.append(P(f"M{cx-10},{y} C{cx-sp-30},{y-6} {cx-sp-38},{y+28} {cx-sp+4},{y+44}", "none", AX_EDGE, 7))
        b.append(P(f"M{cx-10},{y} C{cx-sp-30},{y-6} {cx-sp-38},{y+28} {cx-sp+4},{y+44}", "none", AX_FILL, 4))
        b.append(P(f"M{cx+10},{y} C{cx+sp+30},{y-6} {cx+sp+38},{y+28} {cx+sp-4},{y+44}", "none", AX_EDGE, 7))
        b.append(P(f"M{cx+10},{y} C{cx+sp+30},{y-6} {cx+sp+38},{y+28} {cx+sp-4},{y+44}", "none", AX_FILL, 4))
    b.append(R(cx - 12, 160, 24, 96, AX_FILL, AX_EDGE, 2.5, 8))   # sternum
    # --- appendicular
    b.append(P(f"M{cx-6},146 Q{cx-50},138 {cx-96},150", "none", AP_EDGE, 11) + P(f"M{cx-6},146 Q{cx-50},138 {cx-96},150", "none", AP_FILL, 7))
    b.append(P(f"M{cx+6},146 Q{cx+50},138 {cx+96},150", "none", AP_EDGE, 11) + P(f"M{cx+6},146 Q{cx+50},138 {cx+96},150", "none", AP_FILL, 7))
    for s in (-1, 1):
        sx = cx + s * 98
        b.append(bone(sx, 152, cx + s * 138, 300, 14))                        # humerus
        b.append(bone(cx + s * 134, 306, cx + s * 164, 420, 8) + bone(cx + s * 146, 306, cx + s * 176, 420, 7))  # radius / ulna
        b.append(EL(cx + s * 172, 440, 12, 18, AP_FILL, AP_EDGE, 2.5))
    # pelvis
    pelvis = f"M{cx-70},322 C{cx-100},335 {cx-100},385 {cx-62},420 L{cx-34},398 Q{cx},418 {cx+34},398 L{cx+62},420 C{cx+100},385 {cx+100},335 {cx+70},322 Q{cx},340 {cx-70},322 Z"
    b.append(P(pelvis, AP_FILL, AP_EDGE, 3))
    b.append(EL(cx, 372, 14, 20, "#fff", AP_EDGE, 2))
    for s in (-1, 1):
        b.append(C(cx + s * 52, 410, 13, AP_FILL, AP_EDGE, 2.5))
        b.append(bone(cx + s * 52, 412, cx + s * 62, 585, 18))                   # femur
        b.append(EL(cx + s * 62, 600, 13, 16, AP_FILL, AP_EDGE, 2.5))             # patella
        b.append(bone(cx + s * 64, 622, cx + s * 66, 735, 13))                   # tibia
        b.append(bone(cx + s * 80, 626, cx + s * 80, 728, 6))                    # fibula
        b.append(EL(cx + s * 66, 752, 24, 10, AP_FILL, AP_EDGE, 2.5))
    # labels (left column ends at x=215, right column starts x=685)
    co.add("Cranium", (cx - 30, 62), (230, 60), "end")
    co.add("Clavicle", (cx - 70, 144), (230, 128), "end")
    co.add("Humerus", (cx - 118, 226), (230, 226), "end")
    co.add("Radius and ulna", (cx - 150, 362), (230, 362), "end")
    co.add("Pelvis", (cx - 80, 375), (230, 420), "end")
    co.add("Femur", (cx - 57, 500), (230, 500), "end")
    co.add("Tibia", (cx - 65, 680), (230, 680), "end")
    co.add("Vertebral column", (cx, 280), (670, 290), "start")
    co.add("Sternum", (cx, 190), (670, 150), "start")
    co.add("Ribs", (cx + 84, 205), (670, 205), "start")
    co.add("Patella", (cx + 62, 600), (670, 590), "start")
    co.add("Fibula", (cx + 80, 680), (670, 680), "start")
    b.append(co.render())
    b.append(R(30, 740, 200, 14, AX_FILL, AX_EDGE, 2) + T(240, 752, "Axial skeleton", 14, "start", "700", AX_EDGE))
    b.append(R(30, 765, 200, 14, AP_FILL, AP_EDGE, 2) + T(240, 777, "Appendicular skeleton", 14, "start", "700", AP_EDGE))
    return svg(900, 800, "".join(b), "Human skeleton, front view", "Labelled skeleton with the axial skeleton in green and the appendicular skeleton in red.")

def bone_types():
    b = [T(450, 32, "Four types of bone", 24, "middle", "800")]
    panels = [("Long", "longer than wide", "femur, humerus,\nradius, tibia", "levers for movement"),
              ("Short", "roughly cube-shaped", "carpals (wrist),\ntarsals (ankle)", "stability + small movements"),
              ("Flat", "thin and curved", "cranium, sternum,\nribs, scapula", "protect organs, muscle attachment"),
              ("Irregular", "complex shapes", "vertebrae,\npelvis", "protection + support")]
    for i, (n, d, ex, fn) in enumerate(panels):
        x = 20 + i * 215
        b.append(R(x, 52, 200, 330, "#fafafa", GREY, 1.5, 10))
        b.append(T(x + 100, 86, n, 22, "middle", "800", GREEN) + T(x + 100, 108, d, 13.5, "middle", "400", MID))
        cx = x + 100
        if i == 0:
            b.append(R(cx - 11, 140, 22, 130, AP_FILL, AP_EDGE, 2.5, 5))
            for (ex_, ey) in ((cx - 14, 140), (cx + 14, 140), (cx - 14, 270), (cx + 14, 270)):
                b.append(C(ex_, ey, 15, AP_FILL, AP_EDGE, 2.5))
            b.append(R(cx - 9, 140, 18, 130, AP_FILL, "none", 0))
        elif i == 1:
            for k in range(6):
                b.append(R(cx - 48 + (k % 3) * 34, 160 + (k // 3) * 40, 28, 30, AP_FILL, AP_EDGE, 2.5, 8))
        elif i == 2:
            b.append(P(f"M{cx-70},215 Q{cx},120 {cx+70},215 Q{cx},250 {cx-70},215 Z", AP_FILL, AP_EDGE, 3))
            b.append(P(f"M{cx-50},210 Q{cx},150 {cx+50},210", "none", AP_EDGE, 1.5))
        else:
            b.append(P(f"M{cx-40},220 Q{cx-52},180 {cx-24},170 L{cx-14},140 L{cx+14},140 L{cx+24},170 Q{cx+52},180 {cx+40},220 Q{cx+30},262 {cx},256 Q{cx-30},262 {cx-40},220 Z", AP_FILL, AP_EDGE, 3))
            b.append(EL(cx, 208, 13, 15, "#fff", AP_EDGE, 2))
        b.append(T(cx, 305, ex, 14.5, "middle", "700") + T(cx, 352, fn, 12.5, "middle", "400", MID))
    return svg(900, 410, "".join(b), "Four types of bone", "Long, short, flat and irregular bones with examples.")

def joint_classes():
    b = [T(450, 32, "Three types of joint", 24, "middle", "800")]
    # fixed
    x = 20
    b.append(R(x, 52, 275, 300, "#fafafa", GREY, 1.5, 10) + T(x + 137, 84, "Fixed", 21, "middle", "800", GREEN) + T(x + 137, 106, "no movement", 14, "middle", "400", MID))
    b.append(P("M60,200 Q110,180 150,200 T230,200", "none", AX_EDGE, 3) if False else "")
    b.append(R(45, 160, 110, 90, AX_FILL, AX_EDGE, 2.5, 8) + R(160, 160, 110, 90, AX_FILL, AX_EDGE, 2.5, 8))
    b.append(P("M155,160 L162,178 L152,196 L162,214 L152,232 L158,250", "none", RED, 3))
    b.append(T(x + 137, 290, "Skull (cranium plates)", 14.5, "middle", "700") + T(x + 137, 312, "joined by fibrous tissue", 13, "middle", "400", MID))
    # slightly
    x = 312
    b.append(R(x, 52, 275, 300, "#fafafa", GREY, 1.5, 10) + T(x + 137, 84, "Slightly moveable", 21, "middle", "800", GREEN) + T(x + 137, 106, "small movement", 14, "middle", "400", MID))
    b.append(R(x + 62, 140, 150, 50, AX_FILL, AX_EDGE, 2.5, 12) + R(x + 62, 214, 150, 50, AX_FILL, AX_EDGE, 2.5, 12))
    b.append(R(x + 72, 192, 130, 20, "#93c5fd", "#2563eb", 2, 8))
    b.append(T(x + 137, 160 + 22, "vertebra", 13, "middle", "600") + T(x + 137, 235 + 22, "vertebra", 13, "middle", "600"))
    b.append(T(x + 137, 207, "cartilage disc", 11.5, "middle", "700", "#1e3a8a"))
    b.append(T(x + 137, 290, "Vertebrae of the spine", 14.5, "middle", "700") + T(x + 137, 312, "cartilage pad between bones", 13, "middle", "400", MID))
    # free
    x = 604
    b.append(R(x, 52, 275, 300, "#fafafa", GREY, 1.5, 10) + T(x + 137, 84, "Freely moveable", 21, "middle", "800", GREEN) + T(x + 137, 106, "synovial joint", 14, "middle", "400", MID))
    b.append(P(f"M{x+90},135 L{x+190},135 L{x+190},190 C{x+190},225 {x+90},225 {x+90},190 Z", AP_FILL, AP_EDGE, 2.5))
    b.append(P(f"M{x+90},262 L{x+190},262 L{x+190},320 L{x+90},320 Z", AP_FILL, AP_EDGE, 2.5))
    b.append(R(x + 88, 215, 104, 45, "#fef9c3", "#ca8a04", 1.5, 6, 'fill-opacity="0.8"'))
    b.append(T(x + 137, 242, "fluid-filled", 12, "middle", "600", "#854d0e"))
    b.append(T(x + 137, 340, "Knee, hip, shoulder, elbow", 14.5, "middle", "700"))
    return svg(900, 380, "".join(b), "Fixed, slightly moveable and freely moveable joints", "Three panels illustrating the three joint types with examples.")

def synovial(mode="text"):
    co = Callouts(mode)
    b = [T(450, 30, "Structure of a synovial joint (cross-section)", 24, "middle", "800")]
    b.append(R(338, 108, 224, 214, "#fef9c3", "none", 0))                      # fluid-filled cavity
    # ligaments (outside the capsule) with attachments into the bone
    for x in (292, 590):
        b.append(R(x, 58, 18, 330, "#d6a77a", "#8a5a2b", 2.5, 8))
    b.append(R(300, 58, 72, 16, "#d6a77a", "#8a5a2b", 2, 4) + R(528, 58, 72, 16, "#d6a77a", "#8a5a2b", 2, 4))
    b.append(R(300, 374, 72, 14, "#d6a77a", "#8a5a2b", 2, 4) + R(528, 374, 72, 14, "#d6a77a", "#8a5a2b", 2, 4))
    # capsule (grey) and synovial membrane (orange lining)
    for x, mx in ((326, 340), (574, 560)):
        b.append(L(x, 92, x, 338, "#9ca3af", 12))
        b.append(L(mx, 100, mx, 330, "#fb923c", 4))
    # top bone with rounded end + cartilage
    b.append(P("M372,40 L528,40 L528,128 C528,178 498,202 450,202 C402,202 372,178 372,128 Z", AP_FILL, AP_EDGE, 3))
    b.append(P("M372,128 C372,178 402,202 450,202 C498,202 528,178 528,128", "none", "#3b82f6", 14))
    # bottom bone + cartilage
    b.append(P("M372,432 L528,432 L528,304 C500,292 400,292 372,304 Z", AP_FILL, AP_EDGE, 3))
    b.append(P("M372,304 C400,292 500,292 528,304", "none", "#3b82f6", 14))
    co.add("Bone", (400, 90), (180, 90), "end")
    co.add("Articular cartilage", (418, 199), (180, 170), "end")
    co.add("Synovial fluid", (450, 252), (180, 252), "end")
    co.add("Synovial membrane", (340, 215), (180, 330), "end")
    co.add("Joint capsule", (326, 150), (180, 410), "end")
    co.add("Ligament", (599, 220), (690, 220), "start")
    b.append(co.render())
    if mode == "text":
        b.append(T(690, 246, "joins bone to bone", 13, "start", "400", MID))
    return svg(900, 450, "".join(b), "Structure of a synovial joint", "Two bone ends with cartilage, a fluid-filled cavity, synovial membrane, joint capsule and ligaments.")

def arm_geometry(theta_deg):
    S = (300, 150); E = (300, 340)
    t = math.radians(theta_deg)
    F = (E[0] + 190 * math.cos(t), E[1] + 190 * math.sin(t))
    return S, E, F, t

def spindle(p0, p1, width, fill, edge, sw=2.5, offset=(0, 0)):
    x0, y0 = p0[0] + offset[0], p0[1] + offset[1]
    x1, y1 = p1[0] + offset[0], p1[1] + offset[1]
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = x1 - x0, y1 - y0
    ln = math.hypot(dx, dy) or 1
    nx, ny = -dy / ln, dx / ln
    c1 = (mx + nx * width, my + ny * width); c2 = (mx - nx * width, my - ny * width)
    return P(f"M{x0:.1f},{y0:.1f} Q{c1[0]:.1f},{c1[1]:.1f} {x1:.1f},{y1:.1f} Q{c2[0]:.1f},{c2[1]:.1f} {x0:.1f},{y0:.1f} Z", fill, edge, sw)

def arm_drawing(theta, bicep_w, tricep_w, bicep_fill=MUSCLE, tricep_fill="#e8a39e", dx=0, dy=0):
    S, E, F, t = arm_geometry(theta)
    S = (S[0] + dx, S[1] + dy); E = (E[0] + dx, E[1] + dy); F = (F[0] + dx, F[1] + dy)
    out = []
    out.append(poly([(S[0] - 70, S[1] - 90), (S[0] + 30, S[1] - 100), (S[0] + 5, S[1] + 10), (S[0] - 55, S[1] - 10)], "#e5e7eb", "#6b7280", 2.5))   # scapula
    out.append(bone(S[0], S[1] - 4, E[0], E[1], 16))                                                     # humerus
    out.append(bone(E[0], E[1], F[0], F[1], 14))                                                         # forearm
    out.append(C(E[0], E[1], 14, AP_FILL, AP_EDGE, 3))
    ins_b = (E[0] + 52 * math.cos(t), E[1] + 52 * math.sin(t))
    # tendon end of the biceps stops 40 px short of the insertion point
    d = math.hypot(ins_b[0] - (S[0] + 30), ins_b[1] - (S[1] + 8)) or 1
    ux, uy = (ins_b[0] - (S[0] + 30)) / d, (ins_b[1] - (S[1] + 8)) / d
    belly_end = (ins_b[0] - ux * 40 + 16, ins_b[1] - uy * 40)
    out.append(spindle((S[0] - 14, S[1] + 8), (E[0] - 18, E[1] - 4), tricep_w, tricep_fill, MUSCLE_EDGE, 2.5, (-16, 0)))   # triceps (back)
    out.append(L(belly_end[0], belly_end[1], ins_b[0] + 8, ins_b[1] + 2, "#d6a77a", 5))                                  # tendon
    out.append(L(S[0] + 24, S[1] - 2, S[0] + 30, S[1] + 8, "#d6a77a", 5))                                                # origin tendon
    out.append(spindle((S[0] + 30, S[1] + 8), belly_end, bicep_w, bicep_fill, MUSCLE_EDGE, 2.5, (0, 0)))               # biceps (front)
    return "".join(out), S, E, F, ins_b

def origin_insertion(mode="text"):
    co = Callouts(mode)
    b = [T(450, 30, "Origin and insertion: the biceps", 24, "middle", "800")]
    art, S, E, F, ins = arm_drawing(-62, 26, 16, dx=100, dy=30)
    b.append(art)
    mid_fore = (E[0] + 0.62 * (F[0] - E[0]), E[1] + 0.62 * (F[1] - E[1]))
    co.add("Scapula", (S[0] - 40, S[1] - 70), (110, 90), "end")
    co.add("Origin (fixed end)", (S[0] + 32, S[1] + 8), (620, 100), "start")
    co.add("Biceps", ((S[0] + ins[0]) / 2 + 22, (S[1] + ins[1]) / 2 - 14), (620, 190), "start")
    co.add("Tendon", (ins[0] - 14, ins[1] - 14), (620, 280), "start")
    co.add("Insertion (moving end)", (ins[0] + 6, ins[1] + 2), (620, 370), "start")
    co.add("Humerus", (S[0] - 2, 290 + 30), (110, 310), "end")
    co.add("Elbow joint", (E[0], E[1]), (110, 420), "end")
    co.add("Radius and ulna", mid_fore, (620, 450), "start")
    b.append(co.render())
    b.append(T(450, 490, "The biceps contracts and pulls its insertion towards its origin, bending the elbow.", 15, "middle", "600", MID))
    return svg(900, 510, "".join(b), "Origin and insertion of the biceps", "Arm diagram showing the origin on the scapula and insertion on the forearm.")

def antagonistic():
    b = [T(450, 30, "Antagonistic muscle pair at the elbow", 24, "middle", "800")]
    a1, S1, E1, F1, i1 = arm_drawing(-62, 32, 12, MUSCLE, "#f0c4c1", dx=-150, dy=150)
    a2, S2, E2, F2, i2 = arm_drawing(84, 12, 32, "#f0c4c1", MUSCLE, dx=250, dy=150)
    b.append(a1 + a2)
    b.append(T(215, 66, "Flexion (bending)", 19, "middle", "800", GREEN))
    b.append(T(215, 92, "Biceps = agonist (contracts)", 15, "middle", "700", MUSCLE_EDGE) + T(215, 112, "Triceps = antagonist (relaxes)", 15, "middle", "700"))
    b.append(T(675, 66, "Extension (straightening)", 19, "middle", "800", GREEN))
    b.append(T(675, 92, "Triceps = agonist (contracts)", 15, "middle", "700", MUSCLE_EDGE) + T(675, 112, "Biceps = antagonist (relaxes)", 15, "middle", "700"))
    b.append(L(450, 150, 450, 700, GREY, 2, 'stroke-dasharray="6 6"'))
    return svg(900, 730, "".join(b), "Antagonistic pair: biceps and triceps", "Two arm diagrams: bending with the biceps contracted and straightening with the triceps contracted.")

def muscle_types():
    b = [T(450, 32, "Three types of muscle", 24, "middle", "800")]
    names = [("Skeletal", "voluntary (you control it)", "attached to bones: biceps, quadriceps"),
             ("Cardiac", "involuntary", "found only in the heart"),
             ("Smooth", "involuntary", "walls of the gut, blood vessels")]
    for i, (n, ctrl, where) in enumerate(names):
        x = 20 + i * 290
        b.append(R(x, 52, 270, 330, "#fafafa", GREY, 1.5, 10) + T(x + 135, 86, n, 22, "middle", "800", GREEN))
        cx = x + 135
        if i == 0:
            for k in range(4):
                xx = x + 45 + k * 52
                b.append(R(xx, 120, 40, 170, "#f4b6b0", MUSCLE_EDGE, 2, 6))
                for s in range(8):
                    b.append(L(xx, 132 + s * 20, xx + 40, 132 + s * 20, "#c4524b", 1.6))
                b.append(C(xx + 8, 150, 3.5, "#6e211d", "#6e211d", 1) + C(xx + 30, 230, 3.5, "#6e211d", "#6e211d", 1))
        elif i == 1:
            cells = [(40, 125, 100, 36), (150, 125, 80, 36), (55, 190, 90, 36), (155, 190, 90, 36), (95, 255, 120, 36)]
            for (cx0, cy0, cw, ch) in cells:
                b.append(R(x + cx0, cy0, cw, ch, "#f4b6b0", MUSCLE_EDGE, 2, 14))
                for sx in range(int(cx0 + 14), int(cx0 + cw - 8), 14):
                    b.append(L(x + sx, cy0 + 6, x + sx, cy0 + ch - 6, "#c4524b", 1.6))
            for (ax_, ay_, bx_, by_) in ((140, 143, 150, 143), (145, 208, 155, 208), (100, 161, 100, 190), (200, 161, 200, 190), (150, 226, 150, 255)):
                b.append(L(x + ax_, ay_, x + bx_, by_, INK, 6))
            b.append(T(cx, 318, "branched cells joined by\nintercalated discs (dark bars)", 12.5, "middle", "600", MUSCLE_EDGE))
        else:
            for k in range(5):
                xx = x + 50 + k * 42
                b.append(spindle((xx, 130), (xx + 12, 280), 13, "#f4b6b0", MUSCLE_EDGE, 2))
                b.append(EL(xx + 6, 205, 3.5, 7, "#6e211d", "#6e211d", 1))
            b.append(T(cx, 318, "spindle-shaped cells, no stripes", 12.5, "middle", "600", MUSCLE_EDGE))
        if i == 0:
            b.append(T(cx, 318, "long striped (striated) fibres", 12.5, "middle", "600", MUSCLE_EDGE))
        b.append(T(cx, 348, ctrl, 14.5, "middle", "800") + T(cx, 368, where, 12, "middle", "400", MID))
    return svg(900, 400, "".join(b), "Skeletal, cardiac and smooth muscle", "Three panels showing the appearance and location of each muscle type.")

def fibre_types():
    b = [T(450, 32, "Muscle fibre types", 24, "middle", "800")]
    cols = [("Slow twitch (Type I)", "red fibres", RED, [("Contraction speed", 30), ("Force produced", 30), ("Resistance to fatigue", 92), ("Use of oxygen (aerobic)", 92)], "marathon running, posture muscles"),
            ("Fast twitch (Type II)", "white/pale fibres", "#6b7280", [("Contraction speed", 92), ("Force produced", 92), ("Resistance to fatigue", 28), ("Use of oxygen (aerobic)", 30)], "sprinting, throwing, jumping")]
    for i, (n, sub, col, bars, ex) in enumerate(cols):
        x = 30 + i * 440
        b.append(R(x, 52, 410, 300, "#fafafa", GREY, 1.5, 10) + T(x + 205, 86, n, 22, "middle", "800", col) + T(x + 205, 108, sub, 14, "middle", "400", MID))
        for k, (lab, v) in enumerate(bars):
            y = 138 + k * 48
            b.append(T(x + 20, y, lab, 14.5, "start", "600"))
            b.append(R(x + 20, y + 8, 370, 16, "#e5e7eb", "none", 0, 8) + R(x + 20, y + 8, 370 * v / 100, 16, col, "none", 0, 8))
        b.append(T(x + 205, 335, "Best for: " + ex, 14, "middle", "700"))
    return svg(900, 370, "".join(b), "Slow and fast twitch fibres", "Comparison bars for slow twitch and fast twitch muscle fibres.")

def contractions():
    b = [T(450, 32, "Types of muscle contraction", 24, "middle", "800")]
    panels = [("Isometric", "muscle stays the same length", 0, 26, 14, "plank, wall sit, holding a handstand", None),
              ("Isotonic: concentric", "muscle shortens (lifting)", -62, 32, 12, "upward phase of a bicep curl", "up"),
              ("Isotonic: eccentric", "muscle lengthens (lowering)", 30, 26, 12, "lowering phase of a bicep curl", "down")]
    for i, (n, d, th, bw, tw, ex, arrow_dir) in enumerate(panels):
        x = 15 + i * 295
        b.append(R(x, 52, 280, 590, "#fafafa", GREY, 1.5, 10) + T(x + 140, 84, n, 20, "middle", "800", GREEN) + T(x + 140, 106, d, 13.5, "middle", "400", MID))
        art, S, E, F, ins = arm_drawing(th, bw, tw, dx=x + 20 - 300 + 35, dy=110)
        b.append(art)
        if th == 0:
            b.append(L(F[0], F[1] - 30, F[0], F[1] + 30, INK, 4) + R(F[0] - 14, F[1] - 40, 28, 14, INK, INK, 1, 3) + R(F[0] - 14, F[1] + 26, 28, 14, INK, INK, 1, 3))
        if arrow_dir == "up":
            b.append(arrow(F[0] + 28, F[1] + 40, F[0] + 28, F[1] - 10, RED, 4, 12))
        elif arrow_dir == "down":
            b.append(arrow(F[0] + 24, F[1] - 40, F[0] + 24, F[1] + 5, RED, 4, 12))
        b.append(T(x + 140, 620, ex, 13, "middle", "700"))
    return svg(900, 660, "".join(b), "Isometric, concentric and eccentric muscle contractions", "Three arm diagrams showing a muscle held at constant length, shortening, and lengthening.")

def movements(mode="text"):
    titles = ["Flexion", "Extension", "Abduction", "Adduction", "Rotation", "Circumduction", "Dorsiflexion", "Plantar flexion", "Pronation", "Supination"]
    b = [T(450, 30, "Range of movement at joints", 24, "middle", "800")] if mode == "text" else [T(450, 30, "Range of movement at joints (name each movement)", 22, "middle", "800")]
    W, H = 168, 215
    def panel(i):
        col, row = i % 5, i // 5
        x, y = 12 + col * (W + 8), 48 + row * (H + 14)
        out = [R(x, y, W, H, "#fafafa", GREY, 1.5, 10)]
        cx, cy = x + W / 2, y + 90
        ghost = dict(stroke="#9ca3af", sw=5)
        def limb(pts, color=INK, sw=8, dash=False):
            d = "M" + " L".join(f"{px},{py}" for px, py in pts)
            return P(d, "none", color, sw, 'stroke-dasharray="7 6"' if dash else "")
        if i in (0, 1):   # elbow flexion / extension
            sh, el = (cx, y + 28), (cx, y + 100)
            bent = (cx + 56, y + 62); straight = (cx, y + 172)
            solid, ghost_end = (bent, straight) if i == 0 else (straight, bent)
            out.append(limb([sh, el, ghost_end], "#9ca3af", 5, True) + limb([sh, el, solid]))
            out.append(arc_arrow(cx, y + 100, 38, 90 if i == 0 else -20, -10 if i == 0 else 88, RED, 3))
        elif i in (2, 3):   # shoulder abduction / adduction
            out.append(L(cx - 36, y + 26, cx - 36, y + 150, "#d1d5db", 14))
            sh = (cx - 36, y + 38)
            down = (cx - 36, y + 150); side = (cx + 44, y + 98)
            solid, g = (side, down) if i == 2 else (down, side)
            out.append(limb([sh, g], "#9ca3af", 5, True) + limb([sh, solid]))
            out.append(arc_arrow(cx - 36, y + 38, 70, 80 if i == 2 else 25, 25 if i == 2 else 80, RED, 3))
        elif i == 4:   # rotation (head from above)
            out.append(C(cx, y + 90, 40, "#fff", INK, 5) + poly([(cx - 9, y + 52), (cx + 9, y + 52), (cx, y + 36)], INK, INK, 1))
            out.append(arc_arrow(cx, y + 90, 58, -150, -30, RED, 3))
            out.append(T(cx, y + 150, "(turning the head)", 12, "middle", "400", MID) if mode == "text" else "")
        elif i == 5:   # circumduction
            sh = (cx - 30, y + 150); end = (cx + 30, y + 52)
            out.append(limb([sh, end]) + EL(cx + 28, y + 56, 34, 12, "none", RED, 3, 'stroke-dasharray="5 5"'))
            out.append(arc_arrow(cx + 28, y + 56, 30, 170, 330, RED, 3))
            out.append(T(cx, y + 176, "(arm circle)", 12, "middle", "400", MID) if mode == "text" else "")
        elif i in (6, 7):   # ankle
            sh = (cx - 30, y + 28); an = (cx - 30, y + 130)
            neutral = (cx + 40, y + 130)
            up = (cx + 34, y + 96); down = (cx + 34, y + 164)
            solid = up if i == 6 else down
            out.append(limb([sh, an], INK, 9) + limb([an, neutral], "#9ca3af", 5, True) + limb([an, solid], INK, 9))
            out.append(arc_arrow(cx - 30, y + 130, 62, -12 if i == 6 else 12, -40 if i == 6 else 40, RED, 3))
        else:   # pronation / supination (right hand seen from above)
            thumb_dx = -34 if i == 8 else 34
            out.append(L(cx, y + 190, cx, y + 120, "#e5e7eb", 18))
            out.append(R(cx - 22, y + 56, 44, 62, SKIN, "#8a5c44", 2.5, 10))
            out.append(EL(cx + thumb_dx * 0.75, y + 100, 11, 20, SKIN, "#8a5c44", 2.5))
            for k in range(4):
                out.append(L(cx - 14 + k * 9.5, y + 56, cx - 14 + k * 9.5, y + 78, "#8a5c44", 1.6))
            out.append(T(cx, y + 36, "palm down" if i == 8 else "palm up", 12.5, "middle", "700"))
            out.append(arc_arrow(cx, y + 90, 50, -140 if i == 8 else -40, -40 if i == 8 else -140, RED, 3))
        if mode == "text":
            out.append(T(x + W / 2, y + H - 12, titles[i], 15.5, "middle", "800", GREEN))
        else:
            out.append(badge(x + 20, y + 22, i + 1))
        return "".join(out)
    for i in range(10):
        b.append(panel(i))
    return svg(900, 520, "".join(b), "Range of movement at joints", "Ten small diagrams showing flexion, extension, abduction, adduction, rotation, circumduction, dorsiflexion, plantar flexion, pronation and supination.")

def build():
    save("skeleton-labelled.svg", skeleton("text"))
    save("skeleton-numbered.svg", skeleton("num"))
    save("bone-types.svg", bone_types())
    save("joint-classes.svg", joint_classes())
    save("synovial-joint-labelled.svg", synovial("text"))
    save("synovial-joint-numbered.svg", synovial("num"))
    save("origin-insertion-labelled.svg", origin_insertion("text"))
    save("origin-insertion-numbered.svg", origin_insertion("num"))
    save("antagonistic-pair.svg", antagonistic())
    save("muscle-types.svg", muscle_types())
    save("fibre-types.svg", fibre_types())
    save("contraction-types.svg", contractions())
    save("joint-movements.svg", movements("text"))
    save("joint-movements-numbered.svg", movements("num"))
