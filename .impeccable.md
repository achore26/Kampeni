## Design Context

### Users
The **candidate + inner circle** — a small, trusted team of 3–5 people (candidate, Political Director, campaign manager). They use Kampeni in high-stakes, time-compressed moments: morning briefings before press appearances, quick checks between meetings, reviewing intel before a public event. They are sophisticated, politically sharp, and have zero patience for anything that looks like a prototype. If the candidate shows this to someone, it must look like a serious product.

The dashboard is used on both desktop (morning reviews) and mobile (fieldwork checks). Performance on low-end Android on Safaricom 3G is a real constraint.

### Brand Personality
**Sharp. Authoritative. Trustworthy.**

Kampeni is Kenya's political intelligence layer. It should feel like a mission-critical tool — not a startup side project, not a generic SaaS dashboard. Think of it as the intersection of a light-mode Bloomberg Terminal and a Palantir interface: precise, composed, and quietly serious. The Swahili copy gives it cultural grounding without sacrificing that professional gravity.

Emotional goal: When the candidate opens the dashboard, they should feel *in command* — like they have better information than anyone else in the room.

### Aesthetic Direction
**Light-mode intelligence platform.** The reference is Palantir/Anduril for *authority and mission-critical feeling*, but executed in a clean, light, professional palette — not dark. Think government-grade fintech, not a war room terminal.

- **Theme:** Light mode only (dark mode is out of scope for MVP)
- **Color palette:** Existing brand blue (`#1d4ed8`) as the primary action color. Keep neutrals cool and neutral (gray-50/100/200 range). Use color strategically and sparingly — sentiment data (green/red/gray) is the main place color carries semantic meaning.
- **Typography:** System fonts are fine for MVP; spacing and weight should do the heavy lifting. Bold numbers, restrained labels.
- **Density:** Medium-density. Not cramped, not airy. Data should be readable at a glance.
- **Anti-references:** Do NOT look like a consumer app, a startup landing page, or a generic Tailwind dashboard template. Avoid pastel gradients, rounded-everything aesthetics, and decorative emoji as UI elements.

### Design Principles

1. **Intelligence, not decoration.** Every visual element earns its place by serving comprehension. No decorative gradients, animations, or shadows that don't carry semantic meaning. The data is the drama — let it speak.

2. **Precision builds trust.** Numbers, percentages, timestamps, and source labels must be prominent and unambiguous. Candidate trust is built by seeing data that looks rigorously accurate, not just "nice."

3. **Swahili-first, gracefully.** UI copy in Kiswahili is a feature, not a workaround. Layouts must accommodate Swahili string lengths without breaking. Don't let the visual design fail the language.

4. **Candidate-grade polish.** The candidate may hand this phone to a journalist or show a screen in a meeting. Everything must look intentional and production-quality — zero prototype energy, zero placeholder states left visible.

5. **Calm authority.** Composed, confident visual tone. Never loud, never flashy. Reserve urgency signals (red, alert icons) for genuinely urgent information — overuse destroys signal value.
