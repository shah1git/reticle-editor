# Reticle Editor — RIKA

Редактор прицельных сеток для тепловизионных и оптических прицелов. Позволяет проектировать сетку с точностью до пикселя, анализировать ошибки растеризации и экспортировать результат как PNG или JSON-спецификацию.

**Демо:** https://shah1git.github.io/reticle-editor/

## Правила разработки

1. **Каждое изменение должно быть задокументировано.** При добавлении, удалении или изменении компонентов, API, layout, моделей данных или поведения — обновить соответствующий раздел этого README. Коммит без обновления документации не считается завершённым.

## Стек

- **Vite** + **React 19** + **TypeScript** (strict)
- SVG-рендеринг на canvas с zoom/pan
- CSS Modules, шрифт JetBrains Mono (Google Fonts)
- Без внешних UI-библиотек, без runtime-зависимостей кроме React

## Быстрый старт

```bash
npm install
npm run dev       # dev-сервер на localhost:5173
npm run build     # production-сборка в dist/
npm run preview   # preview production-сборки
```

## Структура проекта

```
src/
├── App.tsx                    # Корневой компонент, state: scope, reticle, activeWing, magnification
├── defaults.ts                # ScopeProfile по умолчанию; defaultReticle = PRESETS[0]
├── presets.ts                 # Каталог готовых конфигураций сетки + reticleMatchesPreset
├── global.css                 # CSS-переменные, сброс, скроллбары
├── main.tsx                   # Точка входа React
│
├── types/
│   ├── reticle.ts             # Wing, Reticle — модель данных сетки
│   ├── scope.ts               # ScopeProfile — параметры прицела (digital/optical)
│   └── rasterization.ts       # RasterMark, RasterStrategy — результат растеризации
│
├── math/
│   ├── optics.ts              # calcPixelsPerMrad, snapToPixel, getFovMrad
│   ├── rasterization.ts       # 3 алгоритма: independent, fixed_step, bresenham
│   ��── __tests__/             # Юнит-тесты математики
│
├── theme/
│   └── tokens.ts              # Цветовая палитра и шрифтовые токены
│
├── hooks/
│   ├── useCanvasInteraction.ts # Zoom (scroll) и pan (Alt+drag) для canvas
│   └── useKeyboard.ts         # Глобальные хоткеи (Ctrl+S)
│
├── utils/
│   ├── fileIO.ts              # Сохранение/загрузка JSON (с обратной совместимостью)
│   ├── exportPng.ts           # Экспорт сетки как PNG с точными пиксельными координатами
│   └── describeReticle.ts     # Локализованное текстовое описание текущей сетки и прицела
│
└── components/
    ├── layout/
    │   ├── TopBar.tsx          # Шапка: логотип, кнопки Открыть/Сохранить/Описание/Экспорт
    │   ├── LeftPanel.tsx       # Левая колонка (300px, scroll): настройки сетки
    │   ├── Canvas.tsx          # Центр (flex:1): SVG-canvas с zoom/pan, grid, reticle, кнопки кратности
    │   ├── RightPanel.tsx      # Правая колонка (380px): таблица растеризации + сводка
    │   └── SummaryCards.tsx    # 2×2 сводка: метки, ошибка, шаги, стратегия
    │
    ├── scope/
    │   └── ScopeProfilePanel.tsx  # Параметры прицела (тип, фокус, сенсор, дисплей)
    │
    ├── reticle/
    │   ├── PresetPicker.tsx    # 6 кнопок-пресетов сверху LeftPanel; подсветка активного
    │   ├── WingEditor.tsx      # Табы крыльев + параметры (длина, толщина, точки)
    │   ├── CenterDotConfig.tsx # Радиус центральной точки (MRAD, snap к пикселям)
    │   └── RasterStrategySelector.tsx # Выбор А/Б/В + сворачиваемое описание
    │
    ├── table/
    │   └── RasterTable.tsx     # Таблица растеризации + детейл по кратностям при hover
    │
    ├── canvas/
    │   ├── ReticleRenderer.tsx # SVG-рендеринг сетки (центр. точка, крылья, метки, FFP-масштаб точек)
    │   └── MradGrid.tsx        # Фоновая MRAD-сетка с подписями
    │
    └── ui/
        ├── NumberInput.tsx     # Числовое поле с пиксельным эквивалентом и подсказкой
        ├── ColorInput.tsx      # Цветовой пикер + hex-поле
        ├── CheckboxInput.tsx   # Чекбокс
        ├── SelectInput.tsx     # Выпадающий список
        ├── Section.tsx         # Сворачиваемая секция с заголовком и тултипом
        ├── Tooltip.tsx         # Тултип «?» — portal в body, position:fixed
        └── DescribeModal.tsx   # Модал «Описание сетки» с кнопкой «Скопировать»
```

## Модель данных

### Wing (крыло)

```typescript
interface Wing {
  enabled: boolean        // Крыло включено/выключено
  // Никакой «линии крыла» нет — на дисплее существуют только пиксели.
  dots: {
    enabled: boolean      // Показывать метки
    spacing: number       // MRAD — интервал между соседними метками
    count: number         // Сколько меток. Стоят на 1·spacing, 2·spacing, …,
                          // count·spacing от центра.
    kind: 'pair'          // Форма метки. Сейчас один вариант 'pair' = пара
                          // смежных пикселей перпендикулярно оси крыла.
  }
}
```

### Reticle (сетка)

```typescript
interface Reticle {
  centerDot: { kind: 'square4' }  // Форма центральной точки. Сейчас один вариант — квадрат 4×4 пикс.
  wings: { up, down, left, right: Wing }
  color: string                  // Цвет сетки (#hex)
  rasterization: 'independent' | 'fixed_step' | 'bresenham'
  focalPlane: 'ffp' | 'sfp'     // Фокальная плоскость
}
```

### ScopeProfile (профиль прицела)

Два типа: `digital` (тепловизор/ночник — фокус, сенсор, дисплей, pixel pitch) и `optical` (оптика — FOV, дисплей для экспорта). Из параметров вычисляется `pixelsPerMrad` — ключевой коэффициент пересчёта.

## Пресеты сетки

`src/presets.ts` хранит каталог готовых конфигураций — массив `PRESETS: ReticlePreset[]`. Каждый пресет содержит `id` и полный объект `Reticle` (центральная точка, 4 крыла, цвет, фокальная плоскость, стратегия растеризации).

Кнопки пресетов отрисовываются в `PresetPicker.tsx` сверху `LeftPanel`. Применение пресета — `setReticle(preset.reticle)`, то есть **полная замена** текущей сетки. Сравнение `reticleMatchesPreset(reticle, preset.reticle)` подсвечивает активный пресет.

Текущий каталог:

| ID | Сценарий | Конфигурация |
|---|---|---|
| `hunting` | Универсальный охотничий | Центр 4×4, верх off, низ 10×1.0 MRAD, бока 5×1.0 MRAD, метки `pair` |
| `fine` | Малоразмерные цели | Центр 1px (BR), single-метки 0.5 MRAD; верх off, низ 8, бока 4 |
| `longRange` | Holdover на длинной дистанции | Центр 2×2, низ 15×1.0 MRAD, бока 3, верх off |
| `milGrid` | Симметричная mil-сетка для измерений | Центр 4×4, все 4 крыла 8×1.0 MRAD, метки `pair` |
| `windBias` | Под ветреные условия | Центр 2×2, бока 10×0.5 MRAD, низ 10×1.0, верх 2×1.0 |
| `minDot` | Близкие дистанции, быстрая стрельба | Центр 1px (TL), все крылья off |

`defaultReticle` (стартовое состояние при первом запуске) равен `PRESETS[0].reticle` — то есть `hunting`.

Локализация — ключи `presets.<id>.name` и `presets.<id>.desc` в `src/i18n/locales/{en,ru,zh}.json`. Описание используется как нативный `title`-tooltip кнопки.

Добавление нового пресета: расширить юнион `PresetId`, добавить элемент в `PRESETS` (`presets.ts`), добавить `name`/`desc` во все 3 локали — больше ничего трогать не нужно.

## FFP / SFP и кратность

Два режима фокальной плоскости (селектор в Toolbar):

- **FFP (First Focal Plane)** — сетка масштабируется с кратностью. `effectivePpm = basePpm × magnification`. Растеризация пересчитывается — на каждой кратности свои ошибки округления. Точки-метки визуально масштабируются пропорционально.
- **SFP (Second Focal Plane)** — сетка фиксирована. `effectivePpm = basePpm`. Растеризация не меняется, только FOV сужается.

Кнопки кратности (1×–8×) расположены на Canvas в блоке контролов. `magnification` — состояние предпросмотра, НЕ сохраняется в JSON.

`effectivePpm` вычисляется в `App.tsx` и передаётся во все компоненты вместо basePpm. `calcPixelsPerMrad` в `src/math/optics.ts` по-прежнему вычисляет только basePpm.

## Canvas — индикатор FOV

Нижняя подсказка на canvas показывает:
- Масштаб (пикс/MRAD)
- Видимую область в MRAD и процент от полного FOV прицела (с учётом кратности)

Кнопка **«FOV»** (правый нижний угол) — подгоняет zoom так, чтобы effectiveFov (`fov / magnification`) поместился в canvas. Использует `getFovMrad()` из `src/math/optics.ts`.

В блоке scopeInfo (верхний правый угол) отображаются: параметры прицела, effectivePpm, режим фокальной плоскости, текущая кратность, effectiveFov.

## Стратегии растеризации

Проблема: интервал между метками в MRAD × pixelsPerMrad почти никогда не равен целому числу пикселей. Три стратегии:

| | А: Независимое | Б: Фиксированный шаг | В: Брезенхем |
|---|---|---|---|
| Суть | round(i × ideal_step) | i × round(ideal_step) | Инкрементальный А |
| Ошибка метки | ≤ 0.5 px | Растёт линейно | = А |
| Равномерность | Шаги чередуются | Все равны | = А |
| Накопление | Нет | Да | Нет |

**В = А** по результату (те же позиции), отличается только реализацией.

## Layout

Три колонки:
- **Левая** (300px, scroll): профиль прицела → центральная точка → цвет → крылья (табы) → стратегия растеризации
- **Toolbar**: профиль прицела, селектор FFP/SFP, стратегия округления
- **Центр** (flex:1): SVG-canvas с MRAD-сеткой, рендеринг сетки, zoom/pan, кнопки кратности (1×–8×)
- **Правая** (380px): таблица растеризации (табы крыльев, данные, легенда, детейл по кратностям при hover) + сводка 2×2

## Цветовая палитра

```css
--bg-main: #12141c;        --accent: #00ff88;
--bg-panel: #181b25;       --accent-orange: #ff8c42;
--bg-canvas: #0e1017;      --text-primary: #e8ecf4;
--bg-input: #1e2230;       --text-secondary: #8b95b0;
--bg-section: #1a1d28;     --text-value: #ffffff;
--border: #252938;         --border-focus: #00ff88;
```

Шрифт: `JetBrains Mono` — для всего интерфейса (моноширинный, инженерный стиль).

## Формат JSON

При сохранении создаётся файл с полями:
- `version: 1`, `unit: "MRAD"`
- `scopeProfile` — полный профиль прицела
- `reticle` — полная конфигурация сетки (формы — `centerDot.kind` и `wings.*.dots.kind`)
- `rasterization` — готовые координаты меток для всех 4 крыльев

Обратная совместимость: старые поля `centerDot.radius` / `centerDot.diameter` и `wing.dotSize` / `wing.dots.radius` при загрузке отбрасываются, а формы переводятся в актуальные варианты (`square4` для центра, `pair` для меток крыла).

## Деплой

GitHub Pages через GitHub Actions (`.github/workflows/deploy.yml`). Push в `main` → автоматическая сборка и деплой.

## Лицензия

RIKA internal tool.
