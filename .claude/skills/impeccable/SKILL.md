---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use for web components, pages, and applications.
---

# Design Context Gathering

Before any design work, gather context:
1. Target audience - who uses this and in what context?
2. Use cases - what jobs are they trying to get done?
3. Brand personality/tone - how should the interface feel?

If `.impeccable.md` exists in project root, read it for context.

# Design Direction

Commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve?
- **Tone**: Pick an extreme - brutal, maximalist, retro-futuristic, luxury, playful, editorial, brutalist, etc.
- **Differentiation**: What's the one thing someone will remember?

# Available Commands

- `/audit` - Run technical quality checks (a11y, performance, responsive)
- `/critique` - UX design review: hierarchy, clarity, emotional resonance
- `/normalize` - Align with design system standards
- `/polish` - Final pass before shipping
- `/distill` - Strip to essence
- `/clarify` - Improve unclear UX copy
- `/optimize` - Performance improvements
- `/harden` - Error handling, i18n, edge cases
- `/animate` - Add purposeful motion
- `/colorize` - Introduce strategic color
- `/bolder` - Amplify boring designs
- `/quieter` - Tone down overly bold designs

# Anti-Patterns (DON'T)

- **Fonts**: Don't use Inter, Roboto, Arial, system defaults
- **Colors**: Don't use gray text on colored backgrounds, pure black/white, cyan-on-dark, purple gradients
- **Layout**: Don't wrap everything in cards, nest cards inside cards, center everything
- **Motion**: Don't use bounce/elastic easing (feels dated)
- **Visuals**: Don't use glassmorphism everywhere, generic drop shadows

# References

- typography.md - Type systems, font pairing, modular scales
- color-and-contrast.md - OKLCH, tinted neutrals, dark mode
- spatial-design.md - Spacing systems, grids, visual hierarchy
- motion-design.md - Easing curves, staggering, reduced motion
- interaction-design.md - Forms, focus states, loading patterns
- responsive-design.md - Mobile-first, fluid design, container queries
- ux-writing.md - Button labels, error messages, empty states