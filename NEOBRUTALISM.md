# Neo-brutalist UI Guidelines

Use this specification for frontend work in `frontend_user/` and `frontend_manage/`. It adapts the user-provided third-party design brief to this Vietnamese library system.

## Visual language

- Use flat, high-contrast surfaces, 2–3px near-black structural borders, and hard offset shadows (usually 3–5px with no blur).
- Core palette: yellow `#FDC800`, deep violet `#432DD7`, ink `#111111`, warm paper `#FFFDF2`. Reserve green, amber, and red for semantic success, warning, and error states; pair status color with text or an icon.
- Keep `Be Vietnam Pro` as the site font. Use bold weights for headings and clear type hierarchy; use monospace for identifiers only.
- Use a 4px spacing base (4, 8, 12, 16, 24, 32). Avoid crowding controls with borders and shadows.
- Use hard, visible hover/pressed/focus/disabled states. Focus-visible must be keyboard-accessible and clearly visible. Respect `prefers-reduced-motion` and WCAG 2.2 AA.
- Do not blanket-style all `div`, inputs, buttons, tables, or badges in a way that breaks file inputs, checkbox/radio controls, loading states, responsive table wrappers, or dialog positioning. Prefer tokens and component classes.
- Avoid glassmorphism, blurred drop shadows, ornamental gradients, and globally pill-shaped controls.

## Preserve existing photography

- Never delete, hide, replace, or remove the image layer from the existing header (`/bookshelf.jpg`), sign-in/sign-up (`background_login.jpg`), and catalog/home hero (`background_homeview.jpg`). Preserve the source asset, URL, and intended crop unless the user explicitly requests otherwise.
- Color-grade by adjusting overlay colors, blend modes, brightness/saturation, or background position. Keep the photo recognizable and preserve readable foreground text.

## Quality checks

- Keep the user and management portals visually consistent while preserving role-specific navigation and layout needs.
- Review all affected pages at 320, 375, 768, 1024, and 1440px. Prevent page-level horizontal overflow; allow wide tables to scroll inside their own wrapper.
- Build both frontends after shared style changes. Record browser visual review separately from build results; never mark unperformed QA as passed.
