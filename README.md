# CampusCare Helpdesk

A responsive campus support dashboard built with React and Vite. Students can submit issues, track their status, and see an at-a-glance view of the support queue.

## Features

- Submit issues with a title, category, priority, location, and description.
- Track issues as **Pending**, **In Progress**, or **Resolved**.
- View live totals for each status.
- Search issues and filter the queue by status.
- Persist issues in browser `localStorage`.
- Responsive layout for desktop, tablet, and mobile screens.
- Includes sample issues on a first visit so the dashboard is ready to explore.

## Getting started

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```sh
npm run build
npm run preview
```

## Data storage

Issues are saved in the current browser under the `campus-helpdesk-issues` localStorage key. Data is local to that browser and is not sent to a server. Clear that key in browser storage to restore the sample dashboard.

## Project scripts

- `npm run dev` — start the Vite development server.
- `npm run build` — create a production build in `dist/`.
- `npm run preview` — preview the production build locally.
- `npm run lint` — run Oxlint.
