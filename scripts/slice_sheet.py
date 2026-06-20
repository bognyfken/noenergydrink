#!/usr/bin/env python3
"""
Нарезка ОДНОГО листа со всеми медалями ачивок в отдельные круглые webp.

Лист — все медали в сетке (как генерит Gemini), фон любой:
белый, шахматка (фейк-прозрачность) или зелёный хромакей.
Медали разложены ПОСТРОЧНО в том же порядке, что ACHIEVEMENTS в lib/achievements.ts.

Положи лист сюда:  wiki/sources/medals-sheet.png
Запуск:           python scripts/slice_sheet.py [путь_к_листу]

Результат: public/achievements/<id>.webp  (круглая маска, центр, 256×256).
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SHEET = ROOT / "wiki" / "sources" / "medals-sheet.png"
OUT_DIR = ROOT / "public" / "achievements"
TARGET, INNER, SS = 256, 236, 4

# Порядок = ACHIEVEMENTS в lib/achievements.ts (37 шт, построчно слева-направо).
IDS = [
    # ряд 1 — серия подряд (11)
    "d1", "d3", "d7", "d14", "d21", "d30", "d60", "d90", "d100", "d180", "d365",
    # ряд 2 — всего чистых дней (6)
    "total7", "total30", "total50", "total100", "total200", "total365",
    # ряд 3 — возвращение (2) + календарные узоры (8)
    "comeback", "comeback3",
    "weekend1", "weekend4", "week_cal", "month_cal", "month20", "monday4", "seasons", "newyear",
    # ряд 4 — учёт (3) + заметки (2)
    "log7", "log30", "marked50", "note1", "note10",
    # ряд 5 — секретные (5)
    "leapday", "friday13", "night_owl", "second_wind", "phoenix",
]


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """True = фон. Покрывает белый, светло-серую шахматку и зелёный хромакей."""
    R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    spread = rgb.max(2) - rgb.min(2)
    mn = rgb.min(2)
    # только ИСТИННО белый/нейтральный фон — порог высокий, чтобы не подъедать
    # бледные края лавандовых медалей (иначе круг выходит меньше и режет низ).
    light = (mn > 232) & (spread < 18)
    green = (G > 140) & (G > R + 40) & (G > B + 40)  # хромакей
    return light | green


# Сколько медалей в каждом ряду листа (= группы ACHIEVEMENTS по категориям).
ROW_COUNTS = [11, 6, 10, 5, 5]


def _runs(mask1d, min_len):
    runs, i, n = [], 0, len(mask1d)
    while i < n:
        if mask1d[i]:
            j = i
            while j < n and mask1d[j]:
                j += 1
            if j - i >= min_len:
                runs.append((i, j))
            i = j
        else:
            i += 1
    return runs


def find_medals(bg: np.ndarray):
    """Построчно: 5 рядов → в каждом режем на известное число медалей по впадинам массы."""
    fg = ~bg
    H, W = fg.shape
    bands = _runs(fg.sum(1) > W * 0.02, min_len=40)
    if len(bands) != len(ROW_COUNTS):
        print(f"⚠ рядов найдено {len(bands)}, ожидалось {len(ROW_COUNTS)}: {bands}")
        return []
    medals = []
    for (y0, y1), n_row in zip(bands, ROW_COUNTS):
        band = fg[y0:y1]
        colmass = band.sum(0).astype(float)
        cols = np.nonzero(colmass > (y1 - y0) * 0.04)[0]
        xL, xR = int(cols.min()), int(cols.max())
        cellw = (xR - xL) / n_row
        # точки разреза: впадина массы у каждой ожидаемой границы
        cuts = [xL]
        for k in range(1, n_row):
            t = xL + k * cellw
            a = max(xL, int(t - 0.30 * cellw))
            b = min(xR, int(t + 0.30 * cellw))
            cuts.append(a + int(np.argmin(colmass[a:b])) if b > a else int(t))
        cuts.append(xR)
        # 1) измерить каждую медаль: центр X, верх диска, диаметр по экватору
        items = []
        for a, b in zip(cuts[:-1], cuts[1:]):
            sub = band[:, a:b]
            has = sub.any(1)
            if not has.any():
                continue
            first = np.argmax(sub, axis=1)
            last = sub.shape[1] - 1 - np.argmax(sub[:, ::-1], axis=1)
            span = np.where(has, last - first + 1, 0)
            cyl = int(np.argmax(span))                 # экватор диска
            D = int(span[cyl])                         # диаметр (надёжен по тёмным)
            colsx = np.nonzero(sub.any(0))[0]
            rowsy = np.nonzero(has)[0]
            cx = a + (int(colsx.min()) + int(colsx.max())) / 2.0
            my0 = y0 + int(rowsy.min())                # верх диска (тени сверху нет)
            items.append((cx, my0, D))
        if not items:
            continue
        # 2) ЕДИНЫЙ радиус на весь ряд = медиана диаметров (тёмные точны → задают эталон),
        #    применяется одинаково ко всем, включая бледные/белые. Центр: верх диска + R.
        R = float(np.median([it[2] for it in items])) / 2.0 - 1
        for cx, my0, _ in items:
            cy = my0 + R + 1
            medals.append((cx, cy, R, int(cx - R), int(my0), int(cx + R), int(my0 + 2 * R)))
    return medals


def despill(im: Image.Image) -> Image.Image:
    """Убрать зелёный ореол хромакея (медали не зелёные)."""
    a = np.array(im.convert("RGB")).astype(int)
    g_spill = a[:, :, 1] > np.maximum(a[:, :, 0], a[:, :, 2])
    a[:, :, 1] = np.where(g_spill, np.maximum(a[:, :, 0], a[:, :, 2]), a[:, :, 1])
    return Image.fromarray(a.astype(np.uint8)).convert("RGBA")


def circle_cut(src: Image.Image, cx: float, cy: float, r: float) -> Image.Image:
    bx, by, side = int(round(cx - r)), int(round(cy - r)), int(round(2 * r))
    sq = src.crop((bx, by, bx + side, by + side)).convert("RGBA")
    mask = Image.new("L", (side * SS, side * SS), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, side * SS - 1, side * SS - 1), fill=255)
    mask = mask.resize((side, side), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.4))
    # комбинируем круг с родной альфой источника: прозрачное в исходнике остаётся
    # прозрачным (нет чёрных/белых углов), круг лишь отсекает хвост тени снизу.
    mask = ImageChops.multiply(mask, sq.getchannel("A"))
    sq.putalpha(mask)
    m = sq.copy()
    m.thumbnail((INNER, INNER), Image.LANCZOS)
    canvas = Image.new("RGBA", (TARGET, TARGET), (0, 0, 0, 0))
    canvas.alpha_composite(m, ((TARGET - m.width) // 2, (TARGET - m.height) // 2))
    return canvas


def main() -> int:
    sheet_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SHEET
    if not sheet_path.exists():
        print(f"Нет файла {sheet_path}. Положи лист со всеми медалями туда (или укажи путь аргументом).")
        return 1
    img = Image.open(sheet_path).convert("RGBA")
    arr = np.array(img)
    alpha = arr[:, :, 3]
    if (alpha < 10).mean() > 0.05:        # НАСТОЯЩАЯ прозрачность
        bg = alpha < 128
        src_rgba = img
        src = img.convert("RGB")
        print("фон: альфа-прозрачность")
    else:                                  # белый / шахматка / зелёный хромакей
        src = Image.fromarray(arr[:, :, :3])
        bg = background_mask(arr[:, :, :3].astype(int))
        src_rgba = despill(src)
        print("фон: цветовой ключ")
    medals = find_medals(bg)
    print(f"Найдено медалей: {len(medals)} (ожидалось {len(IDS)})")

    # отладочная картинка с рамками и id
    dbg = src.copy().convert("RGB")
    dd = ImageDraw.Draw(dbg)
    for i, m in enumerate(medals):
        cx, cy, r = m[0], m[1], m[2]
        dd.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 0, 0), width=3)
        lbl = IDS[i] if i < len(IDS) else "?"
        dd.text((cx - r + 4, cy - r + 2), lbl, fill=(255, 0, 0))
    dbg.save(ROOT / "ZZ_debug.png")
    print("  отладка: ZZ_debug.png")

    if len(medals) != len(IDS):
        print("⚠ Число не совпало — проверь ZZ_debug.png. Файлы НЕ записаны.")
        return 2
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for m, mid in zip(medals, IDS):
        out = OUT_DIR / f"{mid}.webp"
        circle_cut(src_rgba, m[0], m[1], m[2]).save(out, "WEBP", quality=92, method=6)
    print(f"Готово: {len(IDS)} медалей → {OUT_DIR.relative_to(ROOT)}/")
    print("Не забудь в lib/achievements.ts проставить hasImage:true тем, у кого теперь есть арт.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
