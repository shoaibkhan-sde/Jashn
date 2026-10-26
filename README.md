<p align="center">
  <img src="public/icon.svg" alt="Jashn icon" width="96">
</p>

<h1 align="center">Jashn</h1>

<p align="center">
  <b>GenAI Celebration &amp; Event Planner</b><br>
  Budgets, timelines, vendor checklists and personalised ideas for weddings, birthdays and community events.<br>
  <br>
  <a href="https://jashn-snowy.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-jashn--snowy.vercel.app-2E2A7A?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo on Vercel">
  </a>
  <a href="https://github.com/shoaibkhan-sde/Jashn/actions/workflows/ci.yml" target="_blank">
    <img src="https://img.shields.io/github/actions/workflow/status/shoaibkhan-sde/Jashn/ci.yml?branch=main&style=for-the-badge&logo=github&label=CI%20Status" alt="CI Status">
  </a>
</p>

<br>

> **"One planner for every celebration."**  
> An AI-powered, mathematically exact celebration and event planning suite for Indian weddings, birthdays, community festivals, and society gatherings in **English** (with Indian currency formatting and cultural celebration nuances).

<img src="https://raw.githubusercontent.com/shoaibkhan-sde/Jashn/main/public/home.png" alt="Jashn Home Page" width="100%">


## 🛠️ Technology Stack

- **Framework:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS (Curated Deep Indigo `#2E2A7A`, Marigold `#F5A524`, Berry `#B83280`, Teal `#0E6B6A`)
- **State Management:** Zustand with client-side persistence
- **Validation:** Zod schemas
- **AI Engine:** Google Gemini API (`@google/genai`) with priority failover (`gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-1.5-pro`)
- **Unit Testing:** Vitest with V8 Coverage
- **End-to-End Testing:** Playwright (Chromium)
- **Accessibility Auditing:** Axe-core (`@axe-core/playwright`)
- **CI / CD:** GitHub Actions (`.github/workflows/ci.yml`) & Vercel deployment ready

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js 18.x or 20.x+ (tested on Node v20 & v24)
- npm 9+

### 2. Installation
```bash
git clone <repo-url>
cd Jashn
npm install
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: If you do not supply a `GEMINI_API_KEY`, Jashn will run in **100% Deterministic Built-in Mode** with full offline capabilities!)*

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Suite

```bash
# Run all unit tests (63 tests)
npm run test

# Run unit tests with V8 coverage report (99.6% Lines)
npm run test:coverage

# Run Playwright E2E and Axe accessibility audits
npm run test:e2e

# Run linter
npm run lint

# Production build validation
npm run build
```

---

## 📚 Architectural & Operational Documentation

- [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Hexagonal domain isolation, math integrity invariant, and failover design.
- [`SECURITY.md`](./docs/SECURITY.md) — CSP headers, prompt injection defenses, rate limiting, and zero-XSS guarantee.
- [`AI_DESIGN.md`](./docs/AI_DESIGN.md) — AI reasoning architecture, structured Zod function calling, and deterministic engine.
- [`TESTING.md`](./docs/TESTING.md) — Coverage metrics, unit tests, Playwright E2E, and axe-core audit results.
- [`ACCESSIBILITY.md`](./docs/ACCESSIBILITY.md) — WCAG 2.1 AA checklist, keyboard maps, color contrast, and reduced motion.
- [`DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — Vercel 1-click deployment, Docker configuration, and production benchmarks.

---

## ⚖️ License
Released under the MIT License. Built with pride for celebrations across Maharashtra and India.
