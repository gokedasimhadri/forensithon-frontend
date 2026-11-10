# FORENSITHON 2026 — Vite + React

Official web application for **FORENSITHON 2026** (Forensic Innovation Hackathon), organised by the **Department of Forensic Science, School of Sciences in collaboration with Institution's Innovation Council (IIC), Aditya University**.

## Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool / Dev Server**: [Vite 6](https://vitejs.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **Design & Typography**: Custom ForensiDisplay typography, responsive layout, motion & dark/reduced-motion accessibility.

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended, tested on v22)
- npm or pnpm

### Development

To start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

To build the project for production:

```bash
npm run build
```

The optimized static production assets will be output to the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
├── public/                     # Static assets (logos, icons, fonts, challenge DOCX, _headers, _redirects)
│   ├── aditya-emblem.png
│   ├── aditya-university-logo.jpg
│   ├── investigator-team.webp
│   ├── display.ttf
│   ├── domain-1.svg ... domain-6.svg
│   ├── FORENSITHON-Challenge-Catalogue.docx
│   ├── _headers
│   └── _redirects
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Header.jsx          # Site header with university logo, brand identity, navigation & motion toggle
│   │   ├── Footer.jsx          # Site footer with university logo & quick navigation links
│   │   ├── ReadProgress.jsx    # Smooth reading scroll indicator
│   │   └── ScrollToTop.jsx     # Route navigation scroll restoration
│   ├── data/
│   │   └── eventData.js        # Official event catalogue data (domains, 60 challenges, rubric, guidelines, submissions)
│   ├── hooks/
│   │   ├── useMotion.js        # Reduced motion detection & manual toggle state hook
│   │   └── useScrollReveal.js  # IntersectionObserver scroll reveal hook
│   ├── pages/
│   │   ├── HomePage.jsx        # Landing page with hero, event strip, and brief
│   │   ├── ChallengesPage.jsx  # Interactive challenge explorer with domain browser, live search & pagination
│   │   ├── RoundsPage.jsx      # Rounds timeline, team composition, guidelines accordion & scorecard
│   │   ├── RegistrationPage.jsx# Registration details, MS Forms link & organiser contacts
│   │   └── NotFoundPage.jsx    # Accessible 404 page
│   ├── App.jsx                 # App shell and router definitions
│   ├── index.css               # Global responsive styling, CSS variables & keyframe animations
│   └── main.jsx                # Application root entry
├── index.html                  # HTML entry point for Vite
├── vite.config.js              # Vite configuration
└── package.json                # Project dependencies and npm scripts
```

## Deployment

The application compiles into static files in `dist/` and can be deployed directly to:

- **Cloudflare Pages**: Repository root build with `npm run build` and output directory `dist`. `public/_headers` and `public/_redirects` are automatically included.
- **Vercel / Netlify / GitHub Pages**: SPA fallback routing configured via `_redirects`.
