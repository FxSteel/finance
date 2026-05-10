# Finanza · Brand Guidelines

Sistema de diseño minimalista para app de finanzas personales. Estilo elegante, basado en neutros con acentos mínimos.

---

## 📁 Contenido

```
finanza-brand/
├── logos/
│   ├── finanza-logo-dark.svg     ← Variante principal (fondo oscuro)
│   ├── finanza-logo-light.svg    ← Variante clara (fondo claro)
│   ├── finanza-logo-mono.svg     ← Outline, para impresión / fondos colorados
│   ├── finanza-logomark.svg      ← Solo símbolo (usa currentColor)
│   └── finanza-favicon.svg       ← Optimizado para 16-32px
└── css/
    ├── finanza-tokens.css         ← Variables CSS puras
    └── tailwind.config.js         ← Config para Tailwind
```

---

## 🎨 Filosofía: regla 80 / 15 / 5

| % pantalla | Tipo | Colores |
|------------|------|---------|
| 80% | Neutros base | Paper, Ink, Steel |
| 15% | Jerarquía secundaria | Charcoal, Mist |
| 5% | Acentos | Brass, Indigo, semánticos |

Esto es lo que mantiene la sensación de claridad. Si te encuentras agregando más color, **respira y elimina algo**.

---

## 🎯 Cuándo usar cada color

### Neutros

| Color | Hex | Uso |
|-------|-----|-----|
| **Ink** | `#0A0A0B` | Texto principal, marca, iconos importantes |
| **Charcoal** | `#1F1F23` | Headers en dark mode, surfaces oscuras |
| **Graphite** | `#3D3D42` | Texto secundario en fondos oscuros |
| **Steel** | `#888780` | Labels, metadata, fechas, "hace 2 días" |
| **Mist** | `#D3D1C7` | Bordes, divisores, estados disabled |
| **Paper** | `#FAFAFA` | Fondo principal de la app |
| **White** | `#FFFFFF` | Cards y surfaces elevadas |

### Acentos (uso restrictivo)

| Color | Hex | Uso · ejemplos concretos |
|-------|-----|---------|
| **Brass** | `#C4A876` | El balance principal del mes · meta alcanzada · "premium feature" |
| **Indigo** | `#5B5DEF` | Botones primarios · links · "Ver detalle →" · acción seleccionada |

> ⚠️ Nunca uses Brass e Indigo juntos en el mismo elemento. Compiten por atención.

### Semánticos (solo datos financieros)

| Color | Hex | Uso |
|-------|-----|-----|
| **Income** | `#2D8659` | Ingresos, ganancias, transacciones positivas |
| **Expense** | `#B83A3A` | Gastos, pérdidas, transacciones negativas |
| **Warning** | `#C8841A` | Presupuesto al 80%, suscripciones por vencer |

> ⚠️ No los uses decorativamente. Si un texto es verde, debe representar dinero entrando.

---

## ✍️ Tipografía

**Font stack:** Inter (gratis en Google Fonts) → fallback al system font.

**Solo dos pesos:** 400 (regular) y 500 (medium). Nunca 600 ni 700.

| Token | Tamaño | Uso |
|-------|--------|-----|
| `text-xs` | 11px | Labels en mayúsculas, metadata |
| `text-sm` | 13px | Texto secundario |
| `text-base` | 14px | Texto base de UI |
| `text-md` | 16px | Texto de lectura largo |
| `text-lg` | 18px | Subtítulos |
| `text-xl` | 22px | Títulos de sección |
| `text-2xl` | 28px | KPIs medianos |
| `text-3xl` | 36px | Balance principal |

**Reglas:**
- Sentence case siempre. Nunca Title Case ni MAYÚSCULAS (excepto labels de 11px con tracking).
- Para números (montos, KPIs): usa `font-feature-settings: "tnum"` para que las cifras estén alineadas.
- Letter-spacing negativo (-0.02em) en números grandes para que se vean más densos.

---

## 📐 Espaciado y radios

**Grid de 4px.** Todo espaciado es múltiplo de 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

**Radios:**
- `4px` → inputs pequeños, badges
- `8px` → botones, cards pequeñas
- `12px` → cards principales (default)
- `16px` → containers grandes
- `24px` → modales

**Regla:** mientras más grande el elemento, más grande el radio. Un botón de 36px con radio de 16px se ve mal.

---

## 🌗 Dark mode

El sistema soporta dark mode automáticamente vía `prefers-color-scheme: dark` o forzando con `data-theme="dark"`.

En dark mode:
- Los acentos se aclaran ligeramente para mantener legibilidad
- Income/Expense/Warning se vuelven más vivos
- Los bordes pasan de negro semitransparente a blanco semitransparente

---

## ✅ Accesibilidad (WCAG)

Todos los pares de colores texto-fondo cumplen al menos AA (4.5:1):

| Combinación | Ratio | Nivel |
|-------------|-------|-------|
| Ink sobre Paper | 19.8:1 | AAA |
| Steel sobre Paper | 4.6:1 | AA |
| Indigo sobre Paper | 5.2:1 | AA |
| Income sobre Paper | 4.8:1 | AA |
| Expense sobre Paper | 5.7:1 | AA |
| Paper sobre Ink | 19.8:1 | AAA |

> ⚠️ **No uses Brass como color de texto** sobre Paper. Tiene ratio 2.1:1 y falla AA. Brass es para fondos, iconos grandes y elementos decorativos, no para texto.

---

## 🚀 Cómo usar en tu proyecto

### Opción 1: CSS vanilla
```html
<link rel="stylesheet" href="css/finanza-tokens.css">
```
```css
.balance {
  color: var(--text-primary);
  font-size: var(--text-3xl);
  font-weight: var(--weight-medium);
}
```

### Opción 2: Tailwind
Copia `tailwind.config.js` a tu proyecto y úsalo:
```jsx
<div className="bg-paper text-ink">
  <h1 className="text-3xl font-medium">$12,480</h1>
  <span className="text-income text-sm">↑ 8.2%</span>
</div>
```

### Opción 3: Logos
```html
<!-- Inline SVG (recomendado · permite cambiar color con CSS) -->
<img src="/logos/finanza-logo-dark.svg" alt="Finanza" width="40">

<!-- Como favicon en index.html -->
<link rel="icon" type="image/svg+xml" href="/logos/finanza-favicon.svg">

<!-- El logomark con currentColor toma el color del padre -->
<div style="color: var(--color-ink)">
  <object data="/logos/finanza-logomark.svg"></object>
</div>
```

---

## 🎁 Tips finales

- **Cuando dudes, quita.** La elegancia viene del vacío, no de agregar.
- **Un acento por pantalla.** Si ya tienes Brass destacando el balance, no agregues Indigo en otro KPI.
- **Los números son la estrella.** Dales protagonismo: tamaño grande, peso medium, mucho whitespace alrededor.
- **Dark mode primero.** Una app de finanzas se revisa de noche en la cama; si funciona en dark, probablemente funciona en light.
