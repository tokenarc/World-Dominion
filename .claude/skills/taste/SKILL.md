---
name: design-taste
description: High-agency frontend skill that stops the AI from generating boring, generic "slop". Use for all frontend generation tasks.
---

# High-Agency Frontend

## Configuration

- **DESIGN_VARIANCE**: 8 (1=Perfect Symmetry, 10=Artsy Chaos)
- **MOTION_INTENSITY**: 6 (1=Static, 10=Cinematic)
- **VISUAL_DENSITY**: 4 (1=Airy/Gallery, 10=Data Cockpit)

Adapt these values based on explicit user requests.

## Architecture Rules

- **Dependency Check**: Verify packages in package.json before importing
- **Framework**: React/Next.js - use Server Components, client state only in Client Components
- **Styling**: Tailwind CSS (check version in package.json)
- **Icons**: Use @phosphor-icons/react or @radix-ui/react-icons
- **No Emojis**: Use icons instead of emojis

## Typography Rules

- **Headlines**: Use distinctive fonts (Geist, Outfit, Cabinet Grotesk, Satoshi), NOT Inter
- **No Serif** in dashboards/software UIs (except editorial/creative contexts)
- **Body**: `text-base text-gray-600 leading-relaxed max-w-[65ch]`

## Color Rules

- Max 1 accent color, saturation < 80%
- **Banned**: "AI Purple/Blue" aesthetic, neon gradients, cyan-on-dark
- Use absolute neutral bases (Zinc/Slate) with singular accents
- Never use pure black (#000) - use Zinc-950 or Off-Black

## Layout Rules

- **Banned** when DESIGN_VARIANCE > 4: Centered Hero sections
- Use Split Screen (50/50), Left Aligned, or Asymmetric layouts
- **Anti-Card Overuse**: For VISUAL_DENSITY > 7, use border-t, divide-y, or negative space instead of cards

## Interaction States

- Always implement: Loading (skeletons), Empty States, Error States, Tactile Feedback (scale/translate on :active)

## Motion (MOTION_INTENSITY > 5)

- Use Framer Motion with Spring Physics: `type: "spring", stiffness: 100, damping: 20`
- Staggered animations for lists/grids
- Layout transitions with `layout` and `layoutId` props

## Anti-Slop Patterns (FORBIDDEN)

- No neon/outer glows, no gradient text for headers
- No Inter font, no oversized H1s
- No 3-column equal card layouts
- No "John Doe", "Sarah Chan" names - use creative names
- No generic avatars (use real photo placeholders)
- No fake numbers like 99.99%, 50% - use organic data
- No startup slop names like "Acme", "Nexus"
- No filler words: "Elevate", "Seamless", "Unleash", "Next-Gen"

## Performance

- Use `min-h-[100dvh]` not `h-screen` for full-height sections
- Use CSS Grid over flexbox math
- Animate only `transform` and `opacity`, never top/left/width/height
- Wrap perpetual animations in isolated Client Components with React.memo