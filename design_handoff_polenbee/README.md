# Handoff: PolenBee — App móvil para apicultores

## Overview
PolenBee es una app móvil para apicultores para gestionar colmenares/colmenas, registrar inspecciones, planificar tareas de temporada, llevar el histórico de cosechas de miel, consultar el clima relevante para el pecoreo, y — como funcionalidad estrella — analizar fotos de abejas con polen en las corbículas para estimar qué especies vegetales están en floración en la zona del usuario.

## About the Design Files
The files in this bundle (`PolenBee.dc.html`, `ios-frame.jsx`) are **design references built in HTML/React** — interactive prototypes showing intended look, content, and behavior. They are not production code to copy directly. The task is to **recreate this design in the target codebase's environment** (React Native, Flutter, native iOS/Android, or whatever stack the project uses) using that codebase's existing patterns, navigation, and libraries. If no mobile stack exists yet, choose the framework best suited to the project (React Native is a reasonable default given the prototype is React-based).

`PolenBee.dc.html` is a single self-contained file — open it directly in a browser to see/interact with the live prototype. `ios-frame.jsx` is only the cosmetic device bezel (status bar, notch, home indicator) used to preview it as a phone screen; it is not part of the real app UI.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, copy, and layout are final-intent. Recreate pixel-close using the target platform's equivalent primitives (native components, not literal `<div>`s). All example/dummy data (apiaries, hives, inspections, harvests, tasks, weather) is illustrative — replace with real data sources.

## Design Tokens

### Colors
- Background (app canvas): `#FBF3E3` (warm cream)
- Background (screen behind sheets): `#EFE6D3`
- Card / surface: `#FFFFFF`
- Primary text: `#3A2C1D` (dark brown)
- Secondary/muted text: `#9A8A70` / `#8A7660`
- Honey/amber primary: `#E3963E` (CTAs, active accents)
- Honey dark (headers, active tab, links): `#B9691F`
- Honey light background (badges/chips): `#F7D9A0` / `#FCEBC9` / `#F1E8D3`
- Natural green primary: `#5B7F42` (secondary actions, "tranquila"/"fuerte" status)
- Green dark (pollen tab accent / CTA banner bg): `#3F5C2E`
- Green light background: `#EAF1DE`
- Status — Fuerte (strong): fg `#3F5C2E` / bg `#EAF1DE`
- Status — Media (medium): fg `#A97A0B` / bg `#FCEEC9`
- Status — Débil / alerta (weak/alert, varroa alto, loque): fg `#C0392B` / bg `#FBE4E1`
- Inactive tab-bar icon/label: `#C4B896`
- Borders/dividers: `#EFE2C9` / `#E7DAB9`

### Typography
- Headings / numeric stats / brand: **Nunito** (weights 700/800/900) — rounded, friendly, warm
- Body / labels / copy: **Nunito Sans** (weights 400/500/600/700)
- Scale used: 24px/900 (screen greeting), 22–24px/900 (screen titles), 18–19px/900 (section/detail titles), 14.5–15.5px/800 (card titles), 13–13.5px/600-700 (body/labels), 11–12.5px/600-700 (muted meta text)

### Spacing / shape
- Screen horizontal padding: 20px
- Card border radius: 14–22px (larger cards ~18-22px, chips/pills 100px fully round)
- Card shadow: soft, `0 2-8px 8-20px rgba(58,44,29,0.05-0.09)`
- Gap between stacked cards: 8–10px

## Screens / Views

Navigation: bottom tab bar, 5 items — **Inicio, Colmenares, Polen (center, elevated), Cosechas, Calendario**. The Polen tab icon sits in an elevated rounded-square badge (green when active, cream when inactive) to signal it as the star feature.

### 1. Inicio (Home / Dashboard)
- Greeting header: "Hola, {nombre}" (Nunito 900/24px) + today's date (muted, 14px) + circular bee-icon avatar (honey-light bg, dark honey icon).
- Weather widget: full-width gradient card (`#E3963E` → `#C97A24`), rounded 22px, white text. Shows current temp (38px/800), condition + wind, sun icon (top right). Below: translucent pill row with "Índice de pecoreo: Alto" + humidity %. Below that: 4-day mini forecast (day label + temp).
- Stats row: 3 equal white cards — Colmenas activas (count), Colmenares (count), Miel esta temporada (kg) — big number in honey/green, small muted label.
- Pollen CTA banner: full-width dark-green rounded card, icon badge (flower/pollen icon) + "Analiza el polen de tus abejas" + subtext + chevron. Taps navigate to the Polen tab.
- "Requieren atención" section (conditional — only if hives need attention): cards with a left color-bar (status color), hive code + apiary name, reason text (e.g. "Varroa moderado"), status pill on the right. Tapping opens that hive's detail.
- "Próximas tareas" section: up to 3 upcoming (not-done) task cards — icon badge, title, date + apiary. "Ver todas" link → Calendario tab.

### 2. Colmenares (Apiaries)
**List view**: vertical stack of apiary cards. Each card: top ~84px stylized "map" area (diagonal two-tone pattern background as a placeholder for a real map tile, with a pin/location icon centered) + bottom row with apiary name, location text, and a rounded pill showing hive count. Tapping opens the apiary detail.

**Apiary detail**: back button + apiary name/location header. List of hive cards for that apiary: hive code (bold), status pill (Fuerte/Media/Débil, colored), and a meta line "Tipo · Reina X años · Últ. inspección fecha". Tapping opens hive detail.

**Hive detail (ficha de colmena)**: back button + "Colmena {code}" header. Info card (2×2 grid): Tipo (Layens/Langstroth/Dadant), Estado (colored), Edad de la reina, Marcaje (color + year). Below: full-width amber "+ Nueva inspección" button. Below: "Historial de inspecciones" — reverse-chronological list of inspection cards, each showing: date + temperament (colored), a row of pill chips (Reina sí/no, Cría level, Miel level, Polen level, Varroa level — varroa pill colored by severity), and optional free-text notes.

**Nueva inspección (bottom sheet)**: slides up over the hive detail (dark scrim behind). Drag-handle bar. Fields, each rendered as a segmented row of tappable pill options (selected = filled color, unselected = light/cream):
  - ¿Se ha visto a la reina? → Sí / No (green / red when selected)
  - Cría → Abundante / Moderada / Escasa / Ninguna
  - Reservas de miel → Altas / Medias / Bajas
  - Reservas de polen → Altas / Medias / Bajas
  - Signos de enfermedad (varroa) → Ninguno / Leve / Moderado / Alto
  - Loque → checkbox toggle "Signos de loque americana/europea"
  - Temperamento → Tranquila / Normal / Agresiva
  - Notas → free-text textarea
  - Footer: Cancelar (secondary) / Guardar inspección (primary, green)

### 3. Polen (Pollen Analyzer — star feature)
Header: "Analizador de polen" title + a contextual icon button top-right (clock/history icon in capture state; back-arrow in other states).

**Capture state (default)**: explanatory copy. A dashed-border card with a camera/search icon, "Sube o toma una foto" label, and two buttons: "Hacer foto" (amber, opens camera — `capture="environment"` file input) and "Galería" (cream, opens photo picker). Below: "Análisis recientes" — up to 2 compact history rows (color swatch, top species, date + apiary, probability %).

**Analyzing state**: white card, the captured photo thumbnail (96×96, rounded), a spinning ring loader, and a cycling status message (rotates every ~1s through: "Detectando el color del polen…", "Cruzando ubicación y fecha…", "Calculando especies en floración…").

**Results state**: header row with photo thumbnail + "Resultado del análisis" + date. Then a ranked stack of species cards (highest probability first), each showing: a color swatch matching the pollen color, common name (bold) + scientific name (italic, muted), the probability % (large, honey-dark), a horizontal probability bar (filled to %, tinted to the pollen color), and a footer row "Polen {color name}" / "Floración: {period}". Below the cards: a muted disclaimer box — *"⚠ Estimación orientativa basada en color, ubicación y época del año — no sustituye un análisis palinológico de laboratorio."* Footer buttons: "Nuevo análisis" (secondary) / "Guardar en historial" (primary, green).

**History state**: reverse-chronological list of past analyses (color swatch, top species + scientific name, date + apiary, probability %).

### 4. Cosechas (Harvest)
- 3 stat cards: kg total temporada actual, media por colmena, código de la colmena más productora.
- "Producción por temporada" bar chart card: simple vertical bars (one per season, last 2 seasons highlighted in darker amber) with kg value above each bar and season label below.
- "Por colmena · temporada actual" list, sorted descending by kg: hive code + apiary, horizontal progress bar (relative to top producer), kg value.

### 5. Calendario (Calendar / Tasks)
- Title + current-season subtitle (e.g. "Verano 2026 · floración de jara y romero").
- "Pendientes": task cards with a tappable checkbox, a colored icon badge by task type (treatment=red-tinted, feeding=green-tinted, harvest=honey-tinted, inspection=blue-tinted), title, date + apiary.
- "Completadas": same card style, dimmed (opacity ~0.6), title struck through, checkbox filled green with a check mark. Tapping any checkbox toggles done/pending.

## Interactions & Behavior
- Tab bar switches the active screen; switching tabs resets any open apiary/hive drill-down.
- Apiary → Hive → Inspection-form is a drill-down stack (back arrows step back one level at a time); the inspection form is a modal bottom sheet over the hive detail, not a new screen.
- Segmented pill fields in the inspection form are single-select (tap swaps the selected style); saving prepends a new record to that hive's inspection history and closes the sheet.
- Calendar checkboxes toggle a task between pending/done instantly (optimistic, local state).
- Pollen flow: pick/capture image → auto-navigates to an "analyzing" loading state → calls the vision analysis → shows ranked results. "Nuevo análisis" clears the photo and returns to capture. "Guardar en historial" appends the top result to history and jumps to the history list. A history icon (capture state) and back arrow (other states) toggle in/out of the history list.
- Loading state message cycles on an interval (~1s) purely as a "thinking" indicator — not tied to real analysis progress checkpoints.

## State Management (from the prototype)
- `tab`: 'home' | 'apiaries' | 'pollen' | 'harvest' | 'calendar'
- `apiaryId`, `hiveId`: drive the Colmenares drill-down; both null = list view.
- `showInspectionForm`: boolean, controls the bottom sheet.
- `draft`: in-progress inspection form fields (queenSeen, brood, honey, pollen, varroa, loque, temperament, notes).
- `extraInspections`: map of hiveId → array of newly-saved inspections (prepended to the seeded history at render time).
- `doneOverrides`: map of taskId → boolean, overrides the seeded `done` flag when a checkbox is tapped.
- `pollenView`: 'capture' | 'analyzing' | 'results' | 'history'.
- `pollenImage`: data-URL of the captured/selected photo.
- `pollenResults`: array of `{ nombreComun, nombreCientifico, probabilidad, colorPolen, colorNombre, floracion }` returned by analysis (or a fallback example set if the analysis call fails).
- `pollenHistory`: array of saved past analyses (seeded with 3 examples).

## Pollen Analysis — API Contract
The prototype calls a Claude vision-capable model with:
- **Image**: the captured photo, base64-encoded.
- **System prompt** including: the user's approximate location (from device geolocation, falling back to the active apiary's location text if permission is denied/unavailable) and today's date.
- **Instruction**: analyze the pollen color on the bee's corbiculae, cross-reference with location + season, and return **only JSON** (no markdown) shaped as:
```json
{ "especies": [
  { "nombreComun": "Jara", "nombreCientifico": "Cistus ladanifer", "probabilidad": 45, "colorPolen": "#7A3428", "colorNombre": "rojo oscuro", "floracion": "Abril - Junio" }
] }
```
3–5 species, sorted descending by probability, probabilities summing to ~100.
- **Fallback**: if the call fails or returns unparseable JSON, the app falls back to a fixed example result set (Jara 45% / Romero 30% / Colza 15% / Otras 10%) so the flow never dead-ends.
- In production this should call a real backend endpoint that proxies to a vision model (do not call model APIs directly from the client with embedded credentials); reverse-geocode the GPS coordinates to a place name server-side for a better prompt.

## Example / Dummy Data
All content (apiary names, hive codes/types, inspection records, tasks, harvest kg, weather figures, pollen species) is illustrative and defined inline in the prototype's logic — replace with real data models. Reference location used throughout: Cáceres, Extremadura (Valle del Jerte, Sierra de Gata, La Vera) — chosen for a plausible Iberian pollen-flora narrative (jara, romero, colza, castaño), not a real user detail.

## Tweakable props (in the prototype)
- `appName`: enum — "PolenBee" / "ApiFlora" / "Colmena+" (app name shown/branded in the design; only one is used at a time).
- `resaltarAlertas`: boolean — toggles whether the "Requieren atención" home section computes a specific reason (varroa level / colony weak / queen age) vs. a generic message.

## Assets
No external image assets — all icons are inline SVG (line-art style: house, hexagon/hive, flower/pollen, honey jar, calendar) drawn directly in the markup. The "map" backgrounds on apiary cards are a CSS diagonal-stripe placeholder, not real map tiles — integrate a real maps SDK (e.g. MapKit/Google Maps/Mapbox) for production, using the apiary lat/lng.

## Files
- `PolenBee.dc.html` — the full interactive prototype (open directly in a browser).
- `ios-frame.jsx` — cosmetic iPhone bezel used only for the preview frame; not part of the app UI itself.
- `screenshots/` — reference captures of every screen/state: 01 Inicio, 02 Colmenares (lista), 03 Colmenares (detalle de colmenar), 04 Colmenares (ficha de colmena), 05 Nueva inspección (sheet), 06 Cosechas, 07 Calendario, 08 Analizador de polen (captura), 09 Analizador de polen (resultados — a real Claude vision call against a solid-color test swatch, shown here as a live example of the ranked-card output).
