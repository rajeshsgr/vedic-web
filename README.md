# ॐ Vedic Panchanga — React Web App

A responsive React frontend for the Vedic Panchanga Spring Boot API.

## Quick Start

### 1. Start the Spring Boot API
```bash
cd ../vedic-api
mvn spring-boot:run
# API runs at http://localhost:8080/api
```

### 2. Start the React app
```bash
cd vedic-web
npm install
npm start
# Opens at http://localhost:3000
```

The `"proxy": "http://localhost:8080"` in package.json automatically
forwards all `/api/*` calls to your Spring Boot backend.

## Features
- **Responsive** — works on mobile, tablet, desktop
- **Three tabs** — Today (5 limbs + muhurtas), Planets (9 Graha), Summary
- **Hero strip** — Day Score arc, Tithi/Nakshatra progress bars, Sun/Moon times
- **Location picker** — Change coordinates and timezone
- **Date navigation** — Browse any date with ← → arrows
- **Live clock** — Updates every second for today's date
- **Skeleton loaders** — Smooth loading states
- **Nakshatra guide** — Good/avoid activities for each nakshatra

## Production Build
```bash
npm run build
# Outputs to build/ — serve with any static host
```

## Environment
```bash
# Optional: override API base URL
REACT_APP_API_URL=https://your-api.com/api/v1/panchanga npm run build
```
