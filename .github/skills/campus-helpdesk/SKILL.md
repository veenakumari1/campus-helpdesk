---
name: campus-helpdesk
description: "Use when building, changing, reviewing, or testing the Campus Helpdesk React application, including issue forms, statuses, dashboard statistics, responsive UI, and localStorage."
---

# Campus Helpdesk

Use this skill for changes to the existing Campus Helpdesk application. Work in the current project and preserve its React/Vite setup; do not scaffold a new project or reinstall React.

## Project conventions

- Inspect the existing components, styles, package scripts, and data flow before editing. Follow the established patterns and keep changes scoped to the request.
- Write small, focused, reusable React components. Give components and helpers clear responsibilities, pass data and callbacks explicitly, and avoid duplicating UI or business logic.
- Keep state updates predictable and immutable. Derive values such as filtered issues and status totals from the source issue list instead of maintaining duplicate state.
- Preserve the existing storage format and key when changing issue persistence. Handle unavailable or malformed localStorage data explicitly; do not silently report failed saves as successful.

## UI and accessibility

- Build responsive layouts that work on mobile, tablet, and desktop. Check narrow-screen overflow, touch target size, and sensible content order.
- Use semantic HTML and native controls where practical. Associate every form control with a visible label, expose validation feedback to assistive technology, and provide accessible names for icon-only controls.
- Ensure keyboard operation, visible focus states, sufficient contrast, and status cues that do not rely on color alone.
- Respect reduced-motion preferences and preserve the project’s visual style.

## Issue submission

- Validate required fields (at minimum, issue title and description) before adding an issue. Trim user input, enforce existing length limits, and show a clear, accessible error message when validation fails.
- Validate or constrain categories and priorities to the options supported by the application.
- On successful submission, create a unique issue ID, set its initial status to **Pending**, add it to the issue list, persist it, and reset/close the form consistently.
- Keep the form usable on small screens and ensure cancel/close actions do not submit the form.

## Statuses and dashboard statistics

- Use only the supported statuses: **Pending**, **In Progress**, and **Resolved**. Keep labels consistent in controls, filters, and presentation.
- Update status immutably and persist changes. Ensure status filters reflect the same source data as the issue list.
- Compute total, pending, in-progress, and resolved counts from the current issue data so submissions and status changes immediately update every dashboard statistic.
- Handle empty lists and filters with a useful empty state; do not leave stale totals or counts.

## Testing and build

- For behavior changes, run the relevant existing tests or add focused coverage using the project’s current tooling. Verify issue creation and validation, status changes, filtering, derived statistics, persistence, and responsive/accessibility behavior as relevant.
- Run `npm run lint` when available and run `npm run build` before completing the task.
- If a command fails, inspect and fix errors caused by the change, then rerun the relevant checks. Do not claim a check passed unless it completed successfully.
- Report verification truthfully: state which commands and checks ran, whether they passed, and any remaining errors or checks that could not be completed. Never hide, invent, or dismiss errors.
