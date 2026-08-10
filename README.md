# VibeCode Editor

A smart developer playground for AI-assisted coding, live preview, and project management.

VibeCode Editor is a modern web-based code editor built with **Next.js 16**, **React 19**, **NextAuth**, and **Prisma**. It combines an AI-assisted development experience with a customizable playground, project dashboard, and in-browser WebContainer preview.

## What this project does

- Provides a **landing page** and **dashboard** for managing code playgrounds.
- Loads starter templates for React, Next.js, Express, Vue, Hono, and Angular.
- Uses a **playground editor** with file-browser workflow and save/load state.
- Integrates an **AI chat backend** for coding assistance.
- Includes a **code completion endpoint** for inline AI suggestions.
- Supports live preview via **WebContainer** and a backend code execution environment.
- Uses **NextAuth** for authentication flows and **Prisma** for database access.

## Key project features

- `app/api/chat/route.ts` — AI chat endpoint that forwards requests to a local model service.
- `app/api/code-completion/route.ts` — contextual code completion API for editor suggestions.
- `app/api/template/[id]/route.ts` — template loader that exports starter folders as JSON.
- `app/(auth)` — authentication pages for sign-in.
- `app/dashboard` — dashboard UI to create, duplicate, and manage playground projects.
- `app/playground/[id]` — interactive editor page with file explorer and preview.
- `modules/webcontainers` — WebContainer integration for local preview and file writes.

## Repository structure

- `app/` — Next.js app routes, pages, and API route definitions.
- `components/` — shared UI components powered by Radix and Tailwind.
- `modules/` — feature modules for auth, dashboard, playground, and webcontainers.
- `lib/` — reusable helpers such as database access and template configuration.
- `prisma/` — Prisma configuration and schema metadata.
- `public/` — static assets and images.

## Setup

### Prerequisites

- Node.js 20+ and npm
- Local AI backend available at `http://localhost:11434/api/generate`
- A database configured via `DATABASE_URL` for Prisma/NextAuth

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Environment variables

Create a `.env` file with values such as:

```env
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

If your AI model backend requires custom credentials or settings, configure those in your local model service instead of this repo.

## How it helps

VibeCode Editor accelerates developer workflows by combining:

- AI-powered chat and completion
- template-based code playgrounds
- in-browser preview using WebContainer
- project and workspace management

It is designed to help developers experiment quickly, learn from AI guidance, and prototype frontend/backend code in a unified interface.

## Cleanup and GitHub readiness

This repo has been cleaned for GitHub publishing by:

- removing unnecessary inline comments and debug logs
- cleaning top-level layout and API route source files
- updating `.gitignore` to ignore local tool artifacts and generated files
- preserving the app structure and functional features

## Push to GitHub

If this repository is not yet initialized as Git, run:

```bash
git init
git add .
git commit -m "Initial commit - VibeCode Editor"
```

Then create a GitHub repository and push:

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git push -u origin main
```

## Notes

- The local AI services are expected to run at `http://localhost:11434`.
- The project uses **Next.js App Router** and `next-auth` for session handling.
- The `WebContainer` integration is used for live file editing and preview within the browser.
