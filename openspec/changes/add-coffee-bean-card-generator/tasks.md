## 1. Foundation and template model

- [x] 1.1 Add Express scripts, Vite API proxy, and a `beans-data.json` seed file for the persistent bean library.
- [x] 1.2 Implement validated, serialized, atomic JSON CRUD endpoints for bean records and production static-file serving.
- [x] 1.3 Add independent coffee-bean fields, active-template, and serializable illustration-layer state without changing the legacy nine-grid store.
- [x] 1.4 Register and load the bundled `Libian.ttc` font, including a visible failure state that prevents incorrect export.
- [x] 1.5 Define centralized square and A4 template geometry, typography, colors, and export dimensions from the supplied reference images.

## 2. Coffee bean card editor

- [x] 2.1 Add navigation from the existing nine-grid page to a new coffee-bean card page and a return path, while keeping their states independent.
- [x] 2.2 Build the new coffee-bean card page with a Traditional-Chinese parameter form and square/A4 template selector.
- [x] 2.3 Implement bean-library list, quick fill, create, edit, delete, and recoverable API error feedback.
- [x] 2.4 Implement real-time Canvas or scene preview for all text fields using the active template and Libian font.
- [x] 2.5 Implement handling for empty fields so no placeholder text is emitted and remaining card content remains legible.

## 3. Illustration layers

- [x] 3.1 Implement local JPG, PNG, and WebP illustration import with file validation and object-URL lifecycle management.
- [x] 3.2 Implement selected-layer hit testing, pointer drag, and equal-proportion resize controls for illustrations in both templates.
- [x] 3.3 Add accessible layer controls for selection, move forward/backward, and deletion, and render z-order consistently.

## 4. Export and quality checks

- [x] 4.1 Render the shared card scene at 1600×1600 for square and 827×1169 for A4, using source illustrations rather than preview pixels.
- [x] 4.2 Add download, busy-state, recoverable error handling, and generated-resource cleanup for PNG export.
- [ ] 4.3 Add API tests for JSON CRUD, validation, serialization, and failed writes.
- [ ] 4.4 Add unit/component coverage for template text, Libian font readiness, bean quick fill, illustration transforms, layer order, and tool navigation without removing legacy tests.
- [ ] 4.5 Add visual regression and end-to-end coverage for both supplied reference layouts, multi-illustration editing, PNG downloads, bean record persistence, and existing nine-grid workflow preservation.
- [x] 4.5 Run typecheck, lint, unit tests, end-to-end tests, and production build; fix any regressions.
