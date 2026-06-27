# Design System & UI Style Guide

This style guide documents the layout system, color tokens, form components, and responsive behaviors of the website portfolio. All future agents editing or creating pages in this workspace **MUST** strictly follow these rules to maintain complete visual alignment across the homepage, resume, and interactive stock tools.

---

## 1. Design Tokens & Core Theme
All elements utilize a clean, minimal zinc and charcoal color palette:

| Token Name | Value / Color Code | Purpose |
| :--- | :--- | :--- |
| `Page Background` | `#fafafa` (Zinc 50) | Main background color of the body |
| `Card Background` | `#ffffff` (Pure White) | Background of all panels and cards |
| `Primary Text` | `#18181b` (Zinc 900) | Headings, bold readouts, active status |
| `Secondary Text` | `#4b5563` (Gray 600) | Subheadings, standard descriptions |
| `Muted Text` | `#8e98a5` or `#71717a` | Sources, help labels, contribution counters |
| `Border Line` | `#e4e4e7` (Zinc 200) | Card frames, separators, custom input borders |
| `Font Stack` | `"Inter", sans-serif` | Clean, modern typography |

---

## 2. Contiguous Card Stack System
To present cards as segments of a single consolidated card (used in the homepage portal and resume), elements are stacked vertically with overlapping borders:

- **Contiguous Spacing**: Set `gap: 0;` on the parent stack and `margin-bottom: -1px;` on adjacent cards to prevent double-borders.
- **Selective Rounded Corners**:
  - **Top Card**: `border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom-left-radius: 0; border-bottom-right-radius: 0;`
  - **Middle Card(s)**: `border-radius: 0;` (completely square)
  - **Bottom Card**: `border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; border-top-left-radius: 0; border-top-right-radius: 0;`
- **Elevated Hover Lift**: Add a smooth lift transit effect on hover:
  ```css
  .pe-card {
    transition: all 0.2s ease;
  }
  .pe-card:hover {
    position: relative;
    z-index: 1;
    border-color: #a1a1aa; /* Zinc 400 */
    box-shadow: 0 4px 12px rgba(24, 24, 26, 0.04);
  }
  ```

---

## 3. Sidebar Grids & Heights Alignment (Flexbox Stretch)
When implementing multi-column layouts side-by-side (e.g. sidebar controls next to dashboards), **avoid standard CSS Grid stretching** if percentage heights (`height: 100%`) are required internally. Indefinite parent grid tracks collapse percentage heights. Use a flexbox row:

```css
/* Columns Parent wrapper */
.top-grid {
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: stretch; /* Forces equal heights on both columns */
}

/* Left Sidebar Controls Card */
.controls {
  width: 390px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* Right Content Dashboard Container */
.dashboard {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}
```

### Bottom Alignment via Auto-Margins
To push the final control action button and status alert directly to the bottom of a stretched controls card (aligning with the bottom of the dashboard on the right):
1. Wrap forms inside controls in a column wrapper: `.form-grid { display: flex; flex-direction: column; flex-grow: 1; }`
2. Style the action toolbar at the bottom: `.actions { margin-top: auto; padding-top: 10px; }`

### 2x2 Dashboard Row Grid
For 4-pane layouts, organize the page into two horizontal rows (`.dashboard-row` with `display: flex; align-items: stretch;`). 
- Put large charts (e.g. price path) at `flex: 1.1` and smaller charts at `flex: 0.9`.
- Wrap tabular lists inside a scrolling viewport (`.table-scroll-wrapper { max-height: 260px; overflow-y: auto; }`) next to graphs, keeping their heights balanced.

---

## 4. Input Components Guidelines

### Segmented Buttons (Toggles)
Used for discrete options (frequency, sleeve counts, timing):
- **Container**: Background `#f4f4f5` (Zinc 100), border `1px solid var(--border-light)`, padding `4px`, round corners `8px`.
- **Button Font**: Set `font-size: 0.75rem;` globally to ensure long labels (like "Beginning") fit side-by-side in narrow columns without wrapping.
- **Active State (`aria-pressed="true"`)**: Background `var(--text-primary)` (charcoal `#18181b`), color `#ffffff`, font-weight `600`.

### Range Sliders & Checkboxes
- Style all range selectors (`input[type="range"]`) and checkbox elements using:
  `accent-color: var(--text-primary);` (renders them in clean charcoal-gray instead of default browser colors).

### Input Focus States
- Re-style the focus shadow of input textboxes and select lists:
  `input:focus, select:focus { border-color: var(--text-primary); box-shadow: 0 0 0 3px rgba(24, 24, 26, 0.08); outline: none; }`

### Primary Buttons
- Background `var(--text-primary)` (charcoal), text `#ffffff`, border-radius `6px`, transition smooth.
- Hover background: `#27272a` (Zinc 800).

### Sub-cards & Alerts
- Inner sub-panels (e.g. Sleeve details, split panels, Yahoo data loader alerts) must use background `#f4f4f5` (Zinc 100) with solid thin borders to contrast against the pure white card backgrounds.

---

## 5. Responsive Breakpoint Rules (`@media (max-width: 992px)`)
For mobile and tablet screens, apply standard adaptive rules:

- **Layout Collapse**: Change flex rows (`.top-grid`, `.dashboard-row`) to flex columns (`flex-direction: column; align-items: stretch;`).
- **Sidebar Expansion**: Set sidebar width to `100%` and reset flex shrink properties.
- **Roundings Restoration**: Since stacked cards separate vertically on mobile, restore full 12px rounded corners and add spacing:
  `border-radius: 12px !important; margin-bottom: 16px !important;`
- **Table Inner Scrolling Removal**: Expand data tables fully (`max-height: none;`) to allow natural mobile page scrolling.
