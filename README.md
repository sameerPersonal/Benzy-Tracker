# Operations Portal

A production-ready internal engineering web application designed to track production registries, delivery statuses, resource leave, daily team status, and server/asset registry.

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (v4)
- **UI Designs:** Google Stitch
- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Hosting:** GitHub & Vercel

## Structure
- `/src/services`: Operations and CRUD calls to Google Apps Script.
- `/src/mcp`: MCP compatibility layer.
- `/src/api`: Axios/fetch client configuration.
- `/src/hooks`: Custom React hooks for global/local state management.
- `/src/components`: Premium, reusable UI elements.
- `/src/pages`: Five core module dashboards and authentication pages.

## Getting Started

### Prerequisites
- Node.js (v18+)

### Installation
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Deployment
- **Frontend (Vercel):** Configured for automatic deployments from GitHub (`sameerPersonal/Benzy-Tracker` or similar).
- **Backend (Google Apps Script):** Code located in `/backend` to be deployed as a Web App with `execute as: Me` and `who has access: Anyone`.
