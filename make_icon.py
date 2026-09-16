from PIL import Image, ImageDraw

SIZE = 1024
SS = 4  # 4x supersample，用来做抗锯齿
W = SIZE * SS


def s(v: float) -> int:
    return int(round(v * SS))


img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# ---- 圆角背景（与应用主题一致的深色）----
BG = (11, 13, 16, 255)
draw.rounded_rectangle([0, 0, W - 1, W - 1], radius=s(220), fill=BG)

# ---- 内描边，让图标更精致 ----
STROKE = (35, 42, 52, 255)
draw.rounded_rectangle(
    [s(28), s(28), W - 1 - s(28), W - 1 - s(28)],
    radius=s(196),
    outline=STROKE,
    width=s(6),
)

# ---- 信号折线 ----
ACCENT = (79, 140, 255, 255)     # #4f8cff
ACCENT_2 = (110, 231, 183, 255)  # #6ee7b7
MUTED = (43, 82, 160, 255)

pts_raw = [
    (215, 665),
    (385, 545),
    (505, 615),
    (655, 400),
    (815, 315),
]
pts = [(s(x), s(y)) for x, y in pts_raw]

draw.line(pts, fill=ACCENT, width=s(70), joint="curve")


def cap(p, r, color):
    x, y = p
    draw.ellipse([x - s(r), y - s(r), x + s(r), y + s(r)], fill=color)


# 起点圆头（暗色）
cap(pts[0], 35, MUTED)
# 终点圆头（主题蓝）
cap(pts[-1], 35, ACCENT)

# 终点强调圆点（青色）
x, y = pts[-1]
R = 62
draw.ellipse([x - s(R), y - s(R), x + s(R), y + s(R)], fill=ACCENT_2)

# ---- 缩小回 1024 ----
img = img.resize((SIZE, SIZE), Image.LANCZOS)
img.save("icon.png")
print("icon.png written:", img.size, img.mode)