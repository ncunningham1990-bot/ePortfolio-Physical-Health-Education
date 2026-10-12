from common import *
import math

def wellbeing():
    b = [T(450, 34, "Health and well-being", 24, "middle", "800")]
    pts = {"Physical": (450, 130), "Mental": (190, 400), "Social": (710, 400)}
    cols = {"Physical": GREEN, "Mental": RED, "Social": "#f59e0b"}
    ex = {"Physical": "body works well:\nfitness, sleep, nutrition", "Mental": "thoughts and emotions:\ncoping with stress, mood", "Social": "relationships and belonging:\nfriends, family, teams"}
    b.append(poly(list(pts.values()), "#f8fafc", GREY, 3))
    for n, (x, y) in pts.items():
        b.append(C(x, y, 64, cols[n], cols[n], 2, 'fill-opacity="0.18"') + T(x, y + 6, n.upper(), 19, "middle", "800", cols[n]))
        if n == "Physical":
            b.append(T(x + 84, y - 4, ex[n], 14.5, "start", "600"))
        else:
            b.append(T(x, y + 90, ex[n], 14.5, "middle", "600"))
    b.append(T(450, 320, "HEALTH &\nWELL-BEING", 20, "middle", "800"))
    return svg(900, 540, "".join(b), "Physical, mental and social well-being", "A triangle linking physical, mental and social well-being.")

def parq():
    b = [T(450, 34, "How the PAR-Q is used", 24, "middle", "800")]
    steps = [(50, 80, "1. Answer the PAR-Q", "A short set of yes / no health\nquestions about heart, chest pain,\ndizziness, bones/joints, medication", "#e0f2fe"),
             (50, 250, "2. Check your answers", "Did you answer YES to\nany question?", "#fef9c3")]
    for x, y, h, d, col in steps:
        b.append(R(x, y, 380, 130, col, INK, 2, 12) + T(x + 190, y + 34, h, 19, "middle", "800") + T(x + 190, y + 64, d, 14.5, "middle"))
    b.append(arrow(240, 210, 240, 248, INK, 3.5, 11))
    b.append(R(500, 200, 360, 120, "#dcfce7", GREEN, 2.5, 12) + T(680, 232, "All answers NO", 19, "middle", "800", GREEN) + T(680, 262, "It is generally safe to start\ngradually and build up.", 15, "middle"))
    b.append(R(500, 345, 360, 120, "#fee2e2", RED, 2.5, 12) + T(680, 377, "Any answer YES", 19, "middle", "800", RED) + T(680, 407, "Talk to a doctor or your parent /\nguardian before increasing activity.", 15, "middle"))
    b.append(arrow(430, 300, 498, 262, GREEN, 3.5, 11) + arrow(430, 330, 498, 395, RED, 3.5, 11))
    b.append(T(450, 495, "The PAR-Q is a screening tool, not a medical diagnosis. It is one part of safe practice.", 14.5, "middle", "600", MID))
    return svg(900, 515, "".join(b), "PAR-Q flow chart", "Flow chart: complete the PAR-Q, then either start gradually or speak to a doctor.")

def rice():
    b = [T(450, 34, "Treating a soft-tissue injury: RICE", 24, "middle", "800")]
    cards = [("R", "Rest", "🛑", "Stop activity and\nrest the injured part"), ("I", "Ice", "🧊", "Cold pack (wrapped)\n10-20 minutes at a time"), ("C", "Compression", "🩹", "Support with a firm\nbandage, not too tight"), ("E", "Elevation", "🦵", "Raise the injury\nabove heart level")]
    for i, (l, n, em, d) in enumerate(cards):
        x = 20 + i * 220
        b.append(R(x, 56, 205, 270, "#fafafa", GREEN, 2.5, 14) + C(x + 102, 100, 32, GREEN, GREEN, 1) + T(x + 102, 112, l, 36, "middle", "800", "#fff"))
        b.append(T(x + 102, 168, n, 21, "middle", "800") + T(x + 102, 224, em, 40, "middle") + T(x + 102, 280, d, 13.5, "middle"))
    b.append(R(20, 345, 860, 112, "#fef9c3", "#ca8a04", 2, 12))
    b.append(T(40, 373, "Some guides add 'P' for Protect (PRICE). Newer advice is 'PEACE and LOVE':", 15.5, "start", "700"))
    b.append(T(40, 400, "PEACE (first days): Protect, Elevate, Avoid anti-inflammatories, Compress, Educate.", 15))
    b.append(T(40, 424, "LOVE (after): Load gently, Optimism, Vascularisation (get the blood flowing), Exercise.", 15))
    b.append(T(40, 448, "Seek medical help for severe pain, deformity, numbness, or if you cannot put weight on it.", 15, "start", "700", RED))
    return svg(900, 480, "".join(b), "RICE injury treatment", "Four cards for Rest, Ice, Compression and Elevation plus a note on PRICE and PEACE and LOVE.")

def somatotypes():
    b = [T(450, 34, "Somatotypes (body types)", 24, "middle", "800")]
    types = [("Ectomorph", "lean, narrow, long limbs,\nlow body fat", "long-distance running,\nhigh jump", 38, 46, 70, 205),
             ("Mesomorph", "muscular, wide shoulders,\nathletic build", "sprinting, gymnastics,\nweightlifting", 50, 60, 62, 190),
             ("Endomorph", "rounder, wider hips,\nhigher body fat", "shot put, sumo wrestling,\nprop forward", 62, 62, 66, 150)]
    for i, (n, d, sp, sh, wa, hip, torso) in enumerate(types):
        x = 150 + i * 300
        col = [GREEN, RED, "#f59e0b"][i]
        b.append(R(x - 135, 56, 270, 500, "#fafafa", GREY, 1.5, 12))
        b.append(T(x, 90, n, 22, "middle", "800", col))
        top = 118
        b.append(C(x, top + 22, 20, "#e5e7eb", INK, 3))
        b.append(P(f"M{x-sh},{top+56} Q{x},{top+44} {x+sh},{top+56} L{x+wa},{top+130} Q{x+wa+hip*0.15},{top+170} {x+hip},{top+200} L{x-hip},{top+200} Q{x-wa-hip*0.15},{top+170} {x-wa},{top+130} Z", "#e5e7eb", INK, 3))
        lw = [11, 17, 22][i]
        for s in (-1, 1):
            b.append(L(x + s * (sh + 6), top + 60, x + s * (sh + 22), top + 150, INK, lw * 0.55))
            b.append(L(x + s * hip * 0.5, top + 200, x + s * hip * 0.55, top + 285, INK, lw))
        b.append(T(x, 470, d, 14, "middle", "600") if False else "")
        b.append(T(x, 430, d, 14, "middle", "700") + T(x, 482, "Suits:\n" + sp, 13.5, "middle", "400", MID))
    return svg(900, 575, "".join(b), "Ectomorph, mesomorph and endomorph", "Three body-shape silhouettes with descriptions and example sports.")

def motivation():
    b = [T(450, 34, "Types of motivation", 24, "middle", "800")]
    b.append(R(30, 60, 400, 330, "#ecfdf5", GREEN, 2.5, 14) + T(230, 96, "Intrinsic (from within)", 22, "middle", "800", GREEN))
    b.append(C(230, 190, 52, "#fff", GREEN, 4) + T(230, 205, "😊", 52, "middle") + T(230, 285, "enjoyment, challenge, personal\nsatisfaction, mastering a skill", 15, "middle", "600") + T(230, 350, "“I play because I love it.”", 15.5, "middle", "700", GREEN))
    b.append(R(470, 60, 400, 330, "#fef2f2", RED, 2.5, 14) + T(670, 96, "Extrinsic (from outside)", 22, "middle", "800", RED))
    b.append(T(670, 205, "🏆  🥇  💰  👏", 40, "middle") + T(670, 285, "trophies, medals, prizes, praise,\navoiding punishment", 15, "middle", "600") + T(670, 350, "“I play to win the medal.”", 15.5, "middle", "700", RED))
    b.append(T(450, 425, "Intrinsic motivation tends to last longer; both types can work together.", 15, "middle", "600", MID))
    return svg(900, 450, "".join(b), "Intrinsic and extrinsic motivation", "Two panels contrasting motivation from within with motivation from rewards.")

def curve_axes(b, x0=100, y0=360, w=700, h=280, xl="Arousal (low to high)", yl="Performance"):
    b.append(L(x0, y0, x0 + w, y0, INK, 3) + L(x0, y0, x0, y0 - h, INK, 3))
    b.append(T(x0 + w / 2, y0 + 44, xl, 17, "middle", "700"))
    b.append(f'<text transform="translate(44 {y0 - h/2}) rotate(-90)" font-size="17" text-anchor="middle" font-weight="700">{xl and yl}</text>')

def inverted_u():
    b = [T(450, 34, "The inverted-U hypothesis", 24, "middle", "800")]
    x0, y0, w, h = 100, 380, 700, 290
    curve_axes(b, x0, y0, w, h)
    b.append(R(x0 + 245, y0 - h, 210, h, LIME, LIME, 0, 0, 'fill-opacity="0.18"'))
    b.append(P(f"M{x0},{y0-30} C{x0+170},{y0-60} {x0+250},{y0-h+10} {x0+w/2},{y0-h+6} C{x0+450},{y0-h+10} {x0+530},{y0-60} {x0+w},{y0-30}", "none", GREEN, 5))
    b.append(T(x0 + 120, y0 - 190, "UNDER-aroused\nbored, lacks focus,\nslow reactions", 14.5, "middle", "700", MID))
    b.append(T(x0 + w / 2, y0 - h - 10, "OPTIMAL AROUSAL", 15, "middle", "800", GREEN))
    b.append(T(x0 + w / 2, y0 - 120, "best performance:\nalert and in control", 14.5, "middle", "700", GREEN))
    b.append(T(x0 + 580, y0 - 190, "OVER-aroused\nanxious, tense,\npoor decisions", 14.5, "middle", "700", RED))
    return svg(900, 440, "".join(b), "Inverted-U graph of arousal and performance", "A curve rising to a peak at moderate arousal then falling, with under-aroused, optimal and over-aroused zones.")

def drive_theory():
    b = [T(450, 34, "Drive theory", 24, "middle", "800")]
    x0, y0, w, h = 100, 380, 700, 290
    curve_axes(b, x0, y0, w, h, "Arousal / drive (low to high)")
    b.append(L(x0, y0 - 20, x0 + w - 20, y0 - h + 20, RED, 5))
    b.append(T(x0 + 200, y0 - 190, "As arousal (drive) rises,\nperformance keeps rising", 16, "middle", "700", RED))
    b.append(T(x0 + 330, y0 - 90, "Best for simple, well-learned skills\nand experts", 14.5, "middle", "600", MID))
    b.append(T(450, 438, "Drive theory predicts a straight-line link. Many sports psychologists prefer the inverted-U because over-arousal harms performance.", 13.5, "middle", "400", MID))
    return svg(900, 460, "".join(b), "Drive theory graph", "A straight line rising from low to high showing performance increasing with arousal.")

def inverted_u_skills():
    b = [T(450, 34, "Optimal arousal depends on the skill", 24, "middle", "800")]
    x0, y0, w, h = 100, 380, 700, 290
    curve_axes(b, x0, y0, w, h)
    b.append(P(f"M{x0},{y0-20} C{x0+90},{y0-120} {x0+150},{y0-h+10} {x0+230},{y0-h+10} C{x0+330},{y0-h+10} {x0+380},{y0-120} {x0+w-120},{y0-20}", "none", "#2563eb", 5))
    b.append(P(f"M{x0+60},{y0-20} C{x0+250},{y0-60} {x0+380},{y0-h+10} {x0+470},{y0-h+10} C{x0+560},{y0-h+10} {x0+640},{y0-90} {x0+w},{y0-20}", "none", RED, 5))
    b.append(T(x0 + 230, y0 - h - 12, "Fine skills peak at\nLOWER arousal", 14.5, "middle", "800", "#2563eb") if False else T(x0 + 120, 66, "Fine skills\n(golf putt, archery)", 14.5, "middle", "800", "#2563eb"))
    b.append(T(x0 + 590, 66, "Gross skills\n(rugby tackle, shot put)", 14.5, "middle", "800", RED))
    b.append(T(450, 438, "Skills needing precision need lower arousal; powerful, big movements cope with (and need) higher arousal.", 14, "middle", "600", MID))
    return svg(900, 460, "".join(b), "Inverted-U for fine and gross skills", "Two inverted-U curves: fine skills peak at lower arousal and gross skills peak at higher arousal.")

def responses():
    b = [T(450, 34, "Responses to arousal", 24, "middle", "800")]
    cx = 450
    b.append(C(cx, 110, 36, "#e5e7eb", INK, 3))
    b.append(P(f"M{cx-60},158 Q{cx},140 {cx+60},158 L{cx+50},320 L{cx-50},320 Z", "#e5e7eb", INK, 3))
    b.append(L(cx - 56, 165, cx - 90, 300, INK, 12) + L(cx + 56, 165, cx + 90, 300, INK, 12))
    b.append(L(cx - 24, 320, cx - 30, 470, INK, 14) + L(cx + 24, 320, cx + 30, 470, INK, 14))
    b.append(T(cx + 9, 214, "❤️", 22, "middle"))
    co = Callouts("text")
    b.append(T(130, 66, "PHYSIOLOGICAL (body)", 17, "middle", "800", GREEN))
    for lab, tgt, at in [("Sweating", (cx - 4, 112), (250, 130)), ("Breathing gets faster", (cx - 20, 190), (250, 190)), ("Heart rate increases", (cx + 9, 208), (250, 250)),
                         ("Muscle tension", (cx - 82, 260), (250, 310)), ("‘Butterflies’ / dry mouth", (cx, 280), (250, 370))]:
        co.add(lab, tgt, at, "end", 15)
    b.append(co.render())
    b.append(T(770, 66, "PSYCHOLOGICAL (mind)", 17, "middle", "800", RED))
    for k, lab in enumerate(["Worry and negative thoughts", "Difficulty concentrating", "Irritability, mood swings", "Changes in confidence", "Feeling ‘psyched up’ (positive)"]):
        y = 130 + k * 60
        b.append(R(620, y - 22, 260, 40, "#fef2f2", RED, 1.8, 8) + T(750, y + 4, lab, 14, "middle", "700"))
    return svg(900, 500, "".join(b), "Physiological and psychological responses to arousal", "A body outline with physiological responses on the left and psychological responses on the right.")

def box_breathing():
    b = [T(450, 34, "Box breathing (4-4-4-4)", 24, "middle", "800")]
    x0, y0, s = 300, 90, 300
    b.append(R(x0, y0, s, s, "#f0fdf4", GREEN, 5, 10))
    b.append(arrow(x0 + 10, y0 - 20, x0 + s - 10, y0 - 20, GREEN, 4, 12) if False else "")
    b.append(T(450, y0 - 14, "1. Breathe IN through the nose (count 4)", 16, "middle", "800", GREEN))
    b.append(T(x0 + s + 16, y0 + s / 2, "2. HOLD\n(count 4)", 16, "start", "800", "#b45309"))
    b.append(T(450, y0 + s + 30, "3. Breathe OUT slowly through the mouth (count 4)", 16, "middle", "800", RED))
    b.append(T(x0 - 16, y0 + s / 2, "4. HOLD\n(count 4)", 16, "end", "800", "#2563eb"))
    b.append(arrow(x0 + 40, y0 + 40, x0 + s - 50, y0 + 40, GREEN, 5, 14) + arrow(x0 + s - 40, y0 + 50, x0 + s - 40, y0 + s - 50, "#f59e0b", 5, 14) + arrow(x0 + s - 50, y0 + s - 40, x0 + 50, y0 + s - 40, RED, 5, 14) + arrow(x0 + 40, y0 + s - 50, x0 + 40, y0 + 50, "#2563eb", 5, 14))
    b.append(T(450, y0 + s / 2 + 6, "Repeat 4-6 rounds", 18, "middle", "800"))
    b.append(T(450, 470, "Slow, controlled breathing lowers heart rate and helps you feel calm before performing.", 14.5, "middle", "600", MID))
    return svg(900, 490, "".join(b), "Box breathing", "A square with four sides: breathe in, hold, breathe out, hold, each for a count of four.")

def pst():
    b = [T(450, 34, "Psychological skills training (PST) toolkit", 24, "middle", "800")]
    tools = [("🧠", "Mental imagery", "Picture yourself performing\nthe skill successfully using\nall your senses"), ("🌬️", "Breathing techniques", "Slow, controlled breaths\nto reduce heart rate and\ncalm nerves"),
             ("💆", "Muscle relaxation", "Tense then release muscle\ngroups to reduce tension\nand somatic anxiety"), ("🗣️", "Self-talk", "Positive, instructional\nand motivational words\nto build focus and confidence")]
    for i, (em, n, d) in enumerate(tools):
        x = 20 + i * 220
        b.append(R(x, 56, 205, 300, "#fafafa", GREEN, 2.5, 14) + T(x + 102, 128, em, 52, "middle") + T(x + 102, 180, n, 18, "middle", "800", GREEN) + T(x + 102, 222, d, 13.5, "middle"))
    b.append(T(450, 392, "Practise these regularly, not just before competition.", 15, "middle", "600", MID))
    return svg(900, 415, "".join(b), "Psychological skills training toolkit", "Four tiles: mental imagery, breathing techniques, muscle relaxation and self-talk.")

def smart():
    b = [T(450, 34, "SMART goals", 24, "middle", "800")]
    items = [("S", "Specific", "What exactly will I do?"), ("M", "Measurable", "How will I track progress?"), ("A", "Achievable", "Is it challenging but realistic?"), ("R", "Relevant", "Does it matter to me and my sport?"), ("T", "Time-bound", "What is my deadline?")]
    for i, (l, n, q) in enumerate(items):
        y = 60 + i * 72
        b.append(R(40, y, 820, 60, "#fafafa", GREEN, 2, 10) + R(40, y, 70, 60, [GREEN, RED, GREEN, RED, GREEN][i], "none", 0, 10) + T(75, y + 43, l, 36, "middle", "800", "#fff"))
        b.append(T(130, y + 38, n, 22, "start", "800") + T(330, y + 38, q, 17, "start", "500"))
    return svg(900, 430, "".join(b), "SMART goals", "Five rows explaining Specific, Measurable, Achievable, Relevant and Time-bound.")

def anxiety_chart():
    b = [T(450, 34, "Measuring anxiety and confidence: before and after", 22, "middle", "800")]
    b.append(T(450, 58, "Example questionnaire scores (higher = more) for one athlete", 14, "middle", "400", MID))
    cats = [("Cognitive\nanxiety", 28, 19), ("Somatic\nanxiety", 25, 17), ("Self-\nconfidence", 18, 28)]
    for i, (n, before, after) in enumerate(cats):
        x = 110 + i * 240
        for j, (v, col) in enumerate(((before, "#9ca3af"), (after, GREEN))):
            hh = v / 36 * 240
            b.append(R(x + j * 70, 330 - hh, 60, hh, col, INK, 1.5, 3) + T(x + j * 70 + 30, 322 - hh, str(v), 15, "middle", "700"))
        b.append(T(x + 65, 362, n, 14.5, "middle", "700"))
    b.append(L(70, 330, 840, 330, INK, 2) + L(70, 90, 70, 330, INK, 2))
    b.append(R(640, 74, 14, 14, "#9ca3af", "#9ca3af", 1) + T(660, 86, "Baseline", 14) + R(740, 74, 14, 14, GREEN, GREEN, 1) + T(760, 86, "After PST", 14))
    return svg(900, 400, "".join(b), "Anxiety and confidence scores before and after training", "Paired bars: cognitive and somatic anxiety fall and self-confidence rises after psychological skills training.")

ALL = {"wellbeing-triangle": wellbeing, "par-q-flow": parq, "rice-injury-treatment": rice, "somatotypes": somatotypes, "motivation-types": motivation,
       "inverted-u": inverted_u, "drive-theory": drive_theory, "inverted-u-skills": inverted_u_skills, "arousal-responses": responses,
       "box-breathing": box_breathing, "pst-toolkit": pst, "smart-goals": smart, "chart-anxiety-baseline": anxiety_chart}
def build():
    for n, fn in ALL.items():
        save(n + ".svg", fn())
