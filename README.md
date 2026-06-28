# Hongfei Zhou

Personal GitHub Pages site with a project portal, online resume, RSS feed exports, and interactive stock research tools.

## Site Map

- `index.html` - Project portal and navigation entry point.
- `resume/hongfei.html` - Online resume.
- `resume/hongfei.pdf` - Downloadable resume PDF.
- `stocks/pe-threshold.html` - S&P 500 PE threshold explorer.
- `stocks/periodic-investment.html` - Historical periodic investment backtester.
- `stocks/spy-daily.html` - SPY return explorer.
- `feeds/` - Exported XML feeds.
- `static/css/` - Shared design-system CSS.
- `static/js/` - Shared JavaScript helpers.
- `static/data/` - Static datasets loaded by pages.

## Shared Static Assets

Follow `AGENTS.md` when editing or adding pages. Shared CSS should be loaded before page-specific inline CSS:

- `static/css/base.css` - Design tokens, font, body defaults, toolbar, buttons.
- `static/css/cards.css` - Card stacks and hover behavior.
- `static/css/forms.css` - Inputs, sliders, checkboxes, segmented controls.
- `static/css/stock-tools.css` - Stock-tool layouts, tables, chart tooltip defaults.

Yahoo-backed stock pages can use `static/js/stock-utils.js` through `window.StockTools` for shared date, HTML escaping, fetch, Yahoo chart parsing, and time-series lookup helpers.

Keep page-specific state, rendering, chart drawing, cache keys, and business calculations inside the page unless there is a clearly reusable boundary.

## Local Verification

Run a local static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Before committing structural changes, check:

- Shared CSS and JS paths resolve from root and subdirectory pages.
- Stock pages render charts and tables without console errors.
- Mobile width around 390px has no horizontal overflow.
- Any page loading `static/data/` handles loading and error states.
