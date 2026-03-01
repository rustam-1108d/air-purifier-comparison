# Air Purifier Comparison

Interactive React app for comparing air purifier configurations by:
- required particulate CADR,
- noise constraints,
- total cost of ownership (initial purchase + electricity + filter replacements).

The app runs fully in the browser and is available at [https://rustam-1108d.github.io/air-purifier-comparison/](https://rustam-1108d.github.io/air-purifier-comparison/)

## What the app does

- Lets you choose location context (country + optional city) for default prices and air quality values.
- Computes required CADR for PM2.5 and PM10 from your outdoor air conditions, ventilation rate, indoor pollution sources and targeted indoor air quality.
- Builds feasible solutions, that meet your performance and noise constraints.
- Estimates filter life using a CADR-decay model and optional filter usage-hour caps.
- Ranks viable solutions by total cost of ownership for your ownership period.
- Supports English and Russian UI.
- Supports light/dark theme.

## Tech stack

- React 19
- Vite 7
- ESLint 9

## Getting started

### Prerequisites

- Node.js (24.13.0+)
- npm (11.6.2+)

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL shown by Vite (typically `http://localhost:5173/air-purifier-comparison/`).

### Lint

```bash
npm run lint
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Data and configuration

Core app data is in `src/data/`:

- `airPurifiers.js` — purifier catalog, speed settings, CCM, default purifier/filter prices.
- `countries.js` — supported countries and currencies.
- `cities.js` — optional city for location-specific data.
- `airQuality.js` — default outdoor PM2.5/PM10 values.
- `electricityPrices.js` — default electricity prices.

Localization strings are in `src/i18n/translations.js`.

## Calculation model (high level)

### Required CADR

`calculateRequiredParticulateCADR` uses a steady-state indoor concentration balance and returns a non-negative CADR requirement.

### Group generation

`buildAirPurifierGroups` evaluates each purifier × speed × quantity combination and keeps only groups that satisfy CADR and noise constraints.

### Filter life

`estimateFilterLifeHours` simulates hour-by-hour filter loading using CCM and a CADR decay curve, stopping when:
- minimum required CADR is reached,
- optional CCM stop condition is reached,
- or max simulated hours are reached.

### Cost of ownership

For each valid group:
- Purchase cost = purifier unit price × quantity
- Electricity cost = (total watts / 1000) × ownership period hours × electricity price
- Filter cost = filter unit price × quantity × replacements
- Total cost of ownership = purchase + electricity + filter

## Notes and limitations

- This tool is for educational/decision-support use only and is not medical, health, or professional HVAC engineering advice; verify critical decisions with qualified specialists and local standards.
- Results are decision-support estimates, not guarantees.
- Default values (prices, air quality, purifier specs) can become outdated.
- Missing regional prices are represented as unavailable values in cost columns.
- Model assumptions (steady-state concentration, simplified decay behavior, etc.) affect precision.

## Deployment

The project includes `gh-pages` scripts:

```bash
npm run deploy
```

This runs `predeploy` (`npm run build`) and publishes `dist/`.

If deploying to GitHub Pages, ensure repository/page settings are configured correctly for your target branch/path.
