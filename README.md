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
├── App.tsx                    # Корневой компонент, state: scope, reticle, activeWing
├── defaults.ts                # Значения по умолчанию для ScopeProfile и Reticle
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
│   └── exportPng.ts           # Экспорт сетки как PNG с точными пиксельными координатами
│
└── components/
    ├── layout/
    │   ├── TopBar.tsx          # Шапка: логотип, кнопки Открыть/Сохранить/Экспорт
    │   ├── LeftPanel.tsx       # Левая колонка (300px, scroll): настройки сетки
    │   ├── Canvas.tsx          # Центр (flex:1): SVG-canvas с zoom/pan, grid, reticle
    │   ├── RightPanel.tsx      # Правая колонка (380px): таблица растеризации + сводка
    │   └── SummaryCards.tsx    # 2×2 сводка: метки, ошибка, шаги, стратегия
    │
    ├── scope/
    │   └── ScopeProfilePanel.tsx  # Параметры прицела (тип, фокус, сенсор, дисплей)
    │
    ├── reticle/
    │   ├── WingEditor.tsx      # Табы крыльев + параметры (длина, толщина, точки)
    │   ├── CenterDotConfig.tsx # Радиус центральной точки (MRAD, snap к пикселям)
    │   └── RasterStrategySelector.tsx # Выбор А/Б/В + сворачиваемое описание
    │
    ├── table/
    │   └── RasterTable.tsx     # Таблица растеризации с тултипами на заголовках
    │
    ├── canvas/
    │   ├── ReticleRenderer.tsx # SVG-рендеринг сетки (центр. точка, крылья, метки)
    │   └── MradGrid.tsx        # Фоновая MRAD-сетка с подписями
    │
    └── ui/
        ├── NumberInput.tsx     # Числовое поле с пиксельным эквивалентом и подсказкой
        ├── ColorInput.tsx      # Цветовой пикер + hex-поле
        ├── CheckboxInput.tsx   # Чекбокс
        ├── SelectInput.tsx     # Выпадающий список
        ├── Section.tsx         # Сворачиваемая секция с заголовком и тултипом
        └── Tooltip.tsx         # Тултип «?» — portal в body, position:fixed
```

## Модель данных

### Wing (крыло)

```typescript
interface Wing {
  enabled: boolean        // Крыло включено/выключено
  length: number          // Длина крыла в MRAD
  lineThickness: number   // Толщина линии в MRAD (0 = только точки)
  dotSize: number         // Диаметр точки-метки в пикселях (целое ≥ 1)
  dots: {
    enabled: boolean      // Показывать точки-метки
    spacing: number       // Интервал между метками в MRAD
  }
}
```

### Reticle (сетка)

```typescript
interface Reticle {
  centerDot: { radius: number }  // Радиус центральной точки (MRAD)
  wings: { up, down, left, right: Wing }
  color: string                  // Цвет сетки (#hex)
  rasterization: 'independent' | 'fixed_step' | 'bresenham'
}
```

### ScopeProfile (профиль прицела)

Два типа: `digital` (тепловизор/ночник — фокус, сенсор, дисплей, pixel pitch) и `optical` (оптика — FOV, дисплей для экспорта). Из параметров вычисляется `pixelsPerMrad` — ключевой коэффициент пересчёта.

## Canvas — индикатор FOV

Нижняя подсказка на canvas показывает:
- Масштаб (пикс/MRAD)
- Видимую область в MRAD и процент от полного FOV прицела
- Подсказки по управлению (Alt+Drag, Прокрутка)

Кн��пка **«Весь FOV»** (правый нижний угол) — подгоняет zoom так, чтобы весь FOV прицела поместился в canvas. Использует `getFovMrad()` из `src/math/optics.ts`.

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
- **Центр** (flex:1): SVG-canvas с MRAD-сеткой, рендеринг сетки, тестовый объект, zoom/pan
- **Правая** (380px): таблица растеризации (табы крыльев, данные, итоги, легенда) + сводка 2×2

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
- `reticle` — полная конфигурация сетки (включая dotSize)
- `rasterization` — готовые координаты меток для всех 4 крыльев

Обратная совместимость: при загрузке старого формата с `dots.radius` (MRAD) автоматически пересчитывается в `dotSize` (пиксели).

## Деплой

GitHub Pages через GitHub Actions (`.github/workflows/deploy.yml`). Push в `main` → автоматическая сборка и деплой.

## Лицензия

RIKA internal tool.
