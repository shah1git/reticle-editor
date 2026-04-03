# Reticle Editor — RIKA

Редактор прицельных сеток для тепловизионных и оптических прицелов. Позволяет проектировать сетку с точностью до пикселя, анализировать ошибки растеризации и экспортировать результат как PNG или JSON-спецификацию.

**Демо:** https://shah1git.github.io/reticle-editor/

## Стек

- **Vite** + **React 18** + **TypeScript** (strict)
- SVG-рендеринг на canvas с zoom/pan
- CSS Modules, шрифты Inter + JetBrains Mono (Google Fonts)
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
│   ├── objects.ts             # Тестовые объекты (размеры целей для overlay)
│   └── __tests__/             # Юнит-тесты математики
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
    │   ├── LeftPanel.tsx       # Левая колонка (flex:1, scroll): настройки + таблица
    │   ├── RightPanel.tsx      # Правая колонка (350px, sticky): canvas + сводка
    │   ├── Canvas.tsx          # SVG-canvas с zoom/pan, grid, reticle, test objects
    │   └── SummaryCards.tsx    # 2×2 сводка под canvas: метки, ошибка, шаги, стратегия
    │
    ├── scope/
    │   └── ScopeProfilePanel.tsx  # Параметры прицела (тип, фокус, сенсор, дисплей)
    │
    ├── reticle/
    │   ├── WingEditor.tsx      # Табы крыльев + горизонтальная сетка параметров
    │   ├── CenterDotConfig.tsx # Радиус центральной точки (MRAD, snap к пикселям)
    │   └── RasterStrategySelector.tsx # Выбор А/Б/В + сворачиваемое описание
    │
    ├── table/
    │   └── RasterTable.tsx     # Таблица растеризации с тултипами на заголовках
    │
    ├── canvas/
    │   ├── ReticleRenderer.tsx # SVG-рендеринг сетки (центр. точка, крылья, метки)
    │   ├── MradGrid.tsx        # Фоновая MRAD-сетка с подписями
    │   └── TestObjectOverlay.tsx # Тестовый объект (цель) с ползунком дистанции
    │
    └── ui/
        ├── NumberInput.tsx     # Числовое поле с пиксельным эквивалентом и подсказкой
        ├── ColorInput.tsx      # Цветовой пикер + hex-поле
        ├── CheckboxInput.tsx   # Чекбокс
        ├── SelectInput.tsx     # Выпадающий список
        ├── Section.tsx         # Сворачиваемая секция с заголовком и тултипом
        └── Tooltip.tsx         # Тултип «?» с подсказкой при наведении/клике
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

Две колонки:
- **Левая** (flex:1, scroll): профиль прицела → центральная точка + цвет → крылья (табы) → стратегия растеризации → таблица растеризации
- **Правая** (350px, sticky): SVG-canvas + сводка 2×2

## Формат JSON

При сохранении создаётся файл с полями:
- `version: 1`, `unit: "MRAD"`
- `scopeProfile` — полный профиль прицела
- `reticle` — полная конфигурация сетки (включая dotSize)
- `rasterization` — готовые координаты меток для всех 4 крыльев

Обратная совместимость: при загрузке старого формата с `dots.radius` (MRAD) автоматически пересчитывается в `dotSize` (пиксели).

## Деплой

GitHub Pages через GitHub Actions (`.github/workflows/`). Push в `main` → автоматическая сборка и деплой.

## Лицензия

RIKA internal tool.
