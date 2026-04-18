# Product Requirements Document: PokeFind (Pokemon-Finder-App)

**Document version:** 1.1  
**Last updated:** April 17, 2026  
**Product name:** PokeFind  
**Repository:** [Pokemon-Finder-App](https://github.com/EltonChang1/Pokemon-Finder-App)

---

## 1. Executive summary

PokeFind is a full-stack web application for **Pokémon GO players** who want to visualize **nearby Pokémon spawns** and **raid activity** on a map, refine results with filters, and optionally work with **hunting routes**. The product ingests structured spawn and raid data from a **MongoDB** backend, presents it on an **interactive Leaflet** map in the browser, and supports **global location search** via geocoding.

This PRD describes the intended user value, scope, functional and non-functional requirements, and how success can be measured. It is aligned with the current MERN implementation (React client, Express API, MongoDB).

---

## 2. Problem statement

Players coordinating in Pokémon GO need a **single place** to:

- See **where** spawns and raids are relative to a chosen point on Earth.
- Judge **quality** (IVs, rarity, data confidence) and **urgency** (despawn or raid end time).
- **Navigate** from the map to an external maps app when they decide to travel.

Without a tool like PokeFind, this information is fragmented, hard to scan at a glance, or locked behind ad-hoc spreadsheets and chat messages.

---

## 3. Goals and non-goals

### 3.1 Product goals

1. **Discoverability:** Let users find spawns and raids within a configurable **radius (1–20 km)** around a **user-selected** map center.
2. **Decision support:** Surface **species, rarity, IV breakdown, spawn/despawn times, and accuracy** so users can prioritize targets.
3. **Geographic flexibility:** Support **address** and **coordinate** entry so users can scout areas they are not physically in (within fair-use limits of third-party geocoding).
4. **Operational clarity:** Separate primary experiences (**Map / Raids / Routes**) with consistent navigation and shared **location context**.

### 3.2 Non-goals (current phase)

1. **Official Niantic integration** or scraping of live game servers.
2. **Guaranteed real-time** updates without a defined ingestion pipeline (polling vs. push is an implementation detail; the PRD assumes data may be seeded or batch-updated).
3. **Native mobile apps** (web-first).
4. **Social graph, chat, or verified user-generated spawn reporting** (not required for core MVP).

---

## 4. Target users and personas

| Persona | Needs | Behaviors |
|--------|--------|-----------|
| **Urban raider** | High-density map, filters by raid level and time remaining | Short sessions, frequent radius changes |
| **IV-focused hunter** | Filter by IV ranges and rarity; despawn visibility | Compares multiple markers before moving |
| **Planner / traveler** | Search by city or landmark; stable radius across searches | Uses address search more than GPS |
| **Route optimizer** | Named routes, GPX-related workflows (as implemented) | Longer sessions, repeats same areas |

---

## 5. User journeys (high level)

1. **Scout spawns:** Open app → default map → optionally change location → adjust radius → open marker popups → open directions in Google Maps.
2. **Filter down:** Open filter panel → combine name, rarity, IV, accuracy → read “total vs. showing” counts → reset when needed.
3. **Check raids:** Navigate to Raids → view markers by level → filter by boss, level, participants, time remaining → inspect gym and boss details.
4. **Work with routes:** Navigate to Routes → use route listing/search as provided by the product (import/export where supported by implementation).

### 5.1 Experience surface (PokeFind HQ)

The web client uses a **persistent tactical shell**: left rail navigation for **Map**, **Raids**, and **Routes**; **Manrope** typography; dark surfaces with **primary** (blue) and **tertiary** (amber) accents. The **Map** view combines a dark basemap, floating zoom and **locate** controls, a top **scan** field (coordinates or free-text address via geocoding), an optional **advanced location** modal, a **spawn filter** column (rarity, aggregate IV band, per-stat IV and accuracy in an advanced block, optional species pins, radius), and a dismissible **priority** toast when a near-perfect IV spawn appears within **500 m**. **Raids** pairs the map with a **nearby raid list** (countdowns, distance, quick tier/mega filters). **Routes** provides an **intelligence grid** of saved routes, GPX import, create flow, optional map preview, and footer status cues. **Report sighting** is a visible CTA; until a crowdsourced API exists, the UI explains that reporting is not yet wired.

---

## 6. Functional requirements

Requirements are grouped by capability. **Must** indicates MVP expectation for the product as documented in the repository; **Should** indicates expected enhancements; **Could** is optional backlog.

### 6.1 Map and location

| ID | Requirement | Priority |
|----|-------------|----------|
| L-1 | The map **must** render an interactive basemap (e.g., OpenStreetMap tiles) with zoom controls. | Must |
| L-2 | The user **must** be able to set the map center via **address search** (geocoding) or **manual lat/lng** within valid ranges. | Must |
| L-3 | The application **must** show the user’s **search center** and a **radius circle** matching the selected radius in kilometers. | Must |
| L-4 | Changing the search center **must** re-fetch or re-evaluate nearby entities for that center (subject to backend contract). | Must |
| L-5 | The map **must** re-center when the search center changes (not only on first paint). | Must |
| L-6 | Geocoding **should** respect provider rate limits (e.g., debounce or user-triggered search only). | Should |

### 6.2 Pokémon spawns

| ID | Requirement | Priority |
|----|-------------|----------|
| P-1 | The client **must** request nearby spawns using **latitude, longitude, and radius (km)**. | Must |
| P-2 | Each spawn **must** display at minimum: **name**, **Pokédex id** (when available), **position**, **rarity**, **IV attack/defense/stamina**, **aggregate IV presentation**, **spawn/despawn times** (when available), **accuracy**. | Must |
| P-3 | Markers **must** use a visual encoding for **rarity** (e.g., color) and show **species imagery** (e.g., via public sprite URLs). | Must |
| P-4 | Popups **must** offer a path to **external navigation** (e.g., “Get directions” to Google Maps). | Must |
| P-5 | Users **must** be able to filter spawns by **name substring**, **rarity toggles**, **IV min/max per stat**, and **minimum accuracy**, with a visible **filtered vs. total** count. | Must |
| P-6 | The backend **must** support **create** and **delete** operations for spawn records for development and admin-style workflows (with appropriate hardening in production). | Must |
| P-7 | Nearby queries **should** use efficient geospatial patterns at scale (e.g., indexes, `$geoWithin`, or equivalent). | Should |
| P-8 | Nearby results **could** be paginated or capped with explicit UI when result sets are large. | Could |

### 6.3 Raids

| ID | Requirement | Priority |
|----|-------------|----------|
| R-1 | The client **must** provide a **Raids** view listing raid entities on the map. | Must |
| R-2 | Raid markers **must** encode **raid level** visually (e.g., color by tier). | Must |
| R-3 | Raid detail **must** include at minimum: **gym name**, **boss**, **level**, **time remaining / end time**, **CP range** (as modeled), and **coordinates**. | Must |
| R-4 | Users **must** be able to filter raids by **boss name**, **level toggles**, **minimum participants**, and **minimum time remaining**. | Must |

### 6.4 Routes

| ID | Requirement | Priority |
|----|-------------|----------|
| RT-1 | The product **must** expose a **Routes** section in navigation consistent with Map and Raids. | Must |
| RT-2 | Users **should** be able to manage or filter routes by **name** (and GPX import/export as described in product README). | Should |
| RT-3 | Advanced route optimization (turn-by-turn, multi-stop TSP, etc.) **could** be deferred to a later release. | Could |

### 6.5 Cross-cutting UX

| ID | Requirement | Priority |
|----|-------------|----------|
| X-1 | Primary navigation **must** be visible and map to **Map**, **Raids**, and **Routes**. | Must |
| X-2 | Filter panels **must** be collapsible to maximize map viewport. | Must |
| X-3 | The UI **must** communicate loading and error states when API calls fail (e.g., backend unavailable). | Must |
| X-4 | Search radius **must** persist across location changes until the user changes it. | Must |

---

## 7. Data model (product-level)

### 7.1 Pokémon spawn entity

Conceptual fields (aligned with `pokemonModels.js`):

- `name` (string, required)  
- `pokedexId` (number, optional)  
- `latitude`, `longitude` (numbers, required)  
- `rarity` (enum: Common, Uncommon, Rare, Very Rare, Legendary)  
- `spawnTime`, `despawnTime` (dates)  
- `iv_attack`, `iv_defense`, `iv_stamina` (0–15)  
- `accuracy` (0–100, confidence)  
- Timestamps for auditing (`createdAt` / `updatedAt` via Mongoose)

### 7.2 Raid and route entities

Raids and routes **must** have stable schemas documented in code; product documentation **should** stay in sync with fields exposed in API responses and popups.

---

## 8. API expectations (summary)

The backend **must** expose REST-style JSON endpoints including:

- **GET** nearby Pokémon spawns by `latitude`, `longitude`, `radius`.  
- **POST** / **DELETE** Pokémon spawns (for seeding and lifecycle management).  
- Parallel patterns for **raids** and **routes** under their respective base paths.

Exact paths and payloads **should** match `SUMMARY.md` and OpenAPI-style documentation if added later.

---

## 9. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **Performance** | Initial map usable on typical broadband; nearby queries should complete within **~2 s P95** for modest datasets on local/dev hardware. |
| **Reliability** | Graceful degradation when MongoDB or geocoding is unavailable; no silent failures. |
| **Security** | Production deployments **should** add authentication for mutating endpoints, rate limiting, input validation/sanitization, and restricted CORS. |
| **Privacy** | No requirement to collect accounts for MVP; if analytics are added later, document data collection in a privacy notice. |
| **Accessibility** | Controls and filters **should** be keyboard reachable; map content may have inherent limits. |
| **Compatibility** | Support latest evergreen browsers used by the majority of players (Chrome, Safari, Firefox, Edge). |

---

## 10. Dependencies and constraints

| Dependency | Role | Constraint |
|------------|------|------------|
| **MongoDB** | System of record for spawns, raids, routes | Must be running and reachable via configured URI |
| **Nominatim (OSM)** | Address → coordinates | Public usage policy and rate limits |
| **PokeAPI sprite CDN** | Marker imagery | Network availability; caching recommended |
| **Leaflet / OSM tiles** | Map rendering | Tile usage policies |
| **React dev proxy / CORS** | Local development ergonomics | Production needs explicit API hosting strategy |

---

## 11. Success metrics (suggested)

| Metric | Definition | Target (initial) |
|--------|------------|------------------|
| **Session success rate** | % of sessions where at least one nearby query returns 200 with parseable JSON | ≥ 95% in monitored environments |
| **Time to first markers** | From location set to markers rendered | Median ≤ 3 s on dev reference hardware |
| **Filter usage** | % of sessions using at least one non-default filter | Baseline for future optimization |
| **Directions clicks** | Popup “directions” engagement per session | Qualitative growth after UX iterations |

---

## 12. Roadmap (indicative)

| Horizon | Themes |
|---------|--------|
| **Near term** | Geospatial indexes, result limits, geocode caching/debounce, marker clustering, automated tests. |
| **Mid term** | Auth for writes, rate limiting, WebSocket or polling for fresher data, hardened production config. |
| **Long term** | Accounts and saved locations, push notifications, richer route optimization, optional native shell. |

---

## 13. Open questions

1. **Data ingestion:** What is the authoritative source and update frequency for spawns and raids in non-demo environments?  
2. **Legal / ToS:** What disclaimers are required regarding third-party data and Pokémon GO terms of use?  
3. **Multi-tenancy:** Will a single deployment serve one region or many; does data need partitioning by geography?  
4. **Routes:** What is the minimum viable route workflow for v1.0 vs. backlog (GPX validation, storage limits)?  

---

## 14. Document history

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-04-17 | Product / eng | Initial PRD from codebase and existing docs |

---

*This PRD is descriptive of the PokeFind / Pokemon-Finder-App product as implemented and documented in-repo. Implementation details may evolve; the issue tracker or changelog should record material changes.*
