#!/usr/bin/env python3
"""
Обработка медалей-ачивок в единый чистый формат.

Кладёшь исходники в  wiki/sources/medals/  с именами по id ачивки:
    d1.png  d3.png  d7.png  d14.png  d30.png  d60.png  d100.png
(можно и другие id — см. lib/achievements.ts; имя файла = id).

Запуск:
    python scripts/process_medals.py

Что делает с каждой картинкой:
  1. Находит саму медаль (по альфе, если есть прозрачность; иначе убирает
     залитый фон — шахматку/однотонный — заливкой от краёв).
  2. Накладывает ЧИСТУЮ сглаженную КРУГЛУЮ маску по медальону.
  3. Центрирует на прозрачном холсте 256×256, пишет webp в public/achievements/.

Универсально: работает и с настоящим прозрачным PNG, и с «фейковой»
прозрачностью Gemini (нарисованная шахматка), и со сплошным фоном.
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "wiki" / "sources" / "medals"
OUT_DIR = ROOT / "public" / "achievements"
TARGET, INNER, SS = 256, 236, 4  # холст, вписать медаль, суперсэмплинг края


def content_mask(im: Image.Image) -> np.ndarray:
    """Маска медали (True = медаль). Учитывает 3 случая фона."""
    rgba = np.array(im.convert("RGBA"))
    alpha = rgba[:, :, 3]
    if (alpha < 250).mean() > 0.02:           # есть НАСТОЯЩАЯ прозрачность
        return alpha > 40
    # фон залит (шахматка/однотонный) → убираем фон, связанный с краями
    rgb = rgba[:, :, :3].astype(int)
    spread = rgb.max(2) - rgb.min(2)
    mn, mx = rgb.min(2), rgb.max(2)
    # «фон» — нейтрально-светлый (шахматка/белый) ИЛИ цвет угловых пикселей
    bg = (spread < 16) & (mn > 180)
    lbl, _ = ndimage.label(bg)
    border = set(np.unique(np.concatenate([lbl[0], lbl[-1], lbl[:, 0], lbl[:, -1]])))
    border.discard(0)
    fg = ~np.isin(lbl, list(border))
    return ndimage.binary_fill_holes(fg)


def process(path: Path, out: Path) -> None:
    im = Image.open(path).convert("RGBA")
    fg = content_mask(im)
    ys, xs = np.where(fg)
    if len(xs) == 0:
        print(f"  ! {path.name}: медаль не найдена, пропуск")
        return
    x0, x1, y0 = int(xs.min()), int(xs.max()), int(ys.min())
    d = x1 - x0                                   # диаметр = ширина медали
    cx = (x0 + x1) / 2.0
    cy = y0 + d / 2.0                             # центр круга от верха → «основание» снизу вне круга
    r = d / 2.0 - 2                               # инсет 2px — срезать контаминированное кольцо
    bx, by, side = int(round(cx - r)), int(round(cy - r)), int(round(2 * r))
    sq = im.crop((bx, by, bx + side, by + side)).convert("RGBA")
    # чистая сглаженная круглая маска
    mask = Image.new("L", (side * SS, side * SS), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, side * SS - 1, side * SS - 1), fill=255)
    mask = mask.resize((side, side), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.4))
    sq.putalpha(mask)
    m = sq.copy()
    m.thumbnail((INNER, INNER), Image.LANCZOS)
    canvas = Image.new("RGBA", (TARGET, TARGET), (0, 0, 0, 0))
    canvas.alpha_composite(m, ((TARGET - m.width) // 2, (TARGET - m.height) // 2))
    canvas.save(out, "WEBP", quality=92, method=6)
    print(f"  ✓ {path.name} -> {out.name}  ({out.stat().st_size // 1024} КБ)")


def main() -> int:
    if not SRC_DIR.exists():
        print(f"Нет папки {SRC_DIR.relative_to(ROOT)} — создай и положи туда d1.png, d3.png, …")
        return 1
    files = sorted(p for p in SRC_DIR.iterdir() if p.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"})
    if not files:
        print(f"В {SRC_DIR.relative_to(ROOT)} нет картинок.")
        return 1
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Обработка {len(files)} медалей → {OUT_DIR.relative_to(ROOT)}/")
    for p in files:
        process(p, OUT_DIR / f"{p.stem}.webp")
    print("Готово.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
