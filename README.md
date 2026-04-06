# Tables Quest Deluxe

A kid-friendly multiplication game for learning tables from 2 to 20.

## Features
- Adventure mode
- Single table missions
- Boss battles
- Speed rocket mode
- Study mode with read-aloud
- Local progress save
- Gems, badges, streaks, and leaderboard
- Printable certificate
- Princess and Magic themes

## Local run
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run start
```

## Vercel
This project is Vercel-ready. Import the repo or run:
```bash
vercel
```

## Build issue fixed
The earlier deployment was using an older Next.js 15 release line. This package now uses:
- Next.js 16.2.0
- React 19.1.1
- TypeScript + required type packages

That removes the deprecated vulnerable version warning and fixes the missing TypeScript package failure during build.
