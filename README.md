# Knockout Predictor

A small web app for running a football knockout prediction game with friends.

## Requirements
- Node.js 18+
- A PostgreSQL database

## Getting started
```bash
cp .env.example .env     # then fill in the values
npm install
npx prisma db push       # create the database tables
npm run dev              # http://localhost:3000
```

## Production
```bash
npm run build
npm start
```
Deploy anywhere that runs a Node.js app with a PostgreSQL database. Set the environment variables from `.env.example` in your host.

## Admin
Fixtures and results are managed at `/admin`, protected by the `ADMIN_PASSWORD` environment variable.
