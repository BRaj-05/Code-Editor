# VibeCode Editor

[Open the deployed app](https://code-editor-flax-nu.vercel.app/)

VibeCode Editor is a browser-based coding workspace. A user can sign in, create a project from a supported starter, edit its files in Monaco Editor, save the project, ask Gemini for help, and run the project inside an embedded WebContainer preview.

## What Has Been Built

- Authentication with NextAuth and OAuth providers.
- A MongoDB database accessed through Prisma.
- A dashboard for creating, opening, saving, duplicating, starring, and deleting playgrounds.
- Starter templates for React, Next.js, Vue, Angular, Express, and Hono.
- A Monaco-powered file editor with explorer, tabs, command/search controls, formatting preferences, and save actions.
- An embedded terminal and browser preview powered by WebContainer and Xterm.
- Gemini AI chat, review, fix, optimize, and code-completion endpoints.
- A draggable AI assistant panel that stays inside the workspace.
- A protected Next.js route layer that leaves NextAuth API endpoints reachable.
- A safe WebContainer preview workflow that stays in the workspace instead of opening an invalid standalone preview tab.

## Technology Stack

| Area | Technology | Why it is used |
| --- | --- | --- |
| Application framework | Next.js 16 App Router | Pages, server routes, rendering, and deployment. |
| UI | React 19, Tailwind CSS, Radix UI, shadcn/ui | Interactive editor UI and accessible controls. |
| Code editor | Monaco Editor | The editor engine used by VS Code. |
| Browser runtime | WebContainer API | Runs Node-based starter projects in the browser. |
| Terminal | Xterm | Displays install and development-server output. |
| AI | Google Gemini API | Chat assistance and editor code completion. |
| Authentication | NextAuth v5 | Session management and OAuth sign-in. |
| Database | MongoDB with Prisma | Stores users, projects, saved files, and messages. |
| Deployment | Vercel | Hosts the Next.js application and server API routes. |

## Quick Start

### Requirements

- Node.js 20 or newer
- npm
- A MongoDB connection string
- OAuth credentials for every sign-in provider enabled in `auth.config.ts`
- A Google AI Studio Gemini API key for AI features
- A modern desktop browser. WebContainer support requires browser isolation capabilities; Chromium-based browsers are the most reliable option.

### Install and run

```bash
npm install
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

### Useful commands

```bash
npm run dev          # Start local development
npm run build        # Create a production build
npm run start        # Run the completed production build
npm run lint         # Run ESLint
npx tsc --noEmit     # Check TypeScript without emitting files
npx prisma generate  # Generate Prisma Client after schema/dependency changes
```

## Environment Configuration

Create your own local `.env` file. Never commit it. The names below are documentation only; use your real values locally and in Vercel.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MongoDB connection string used by Prisma. |
| `AUTH_SECRET` | Yes | Random secret used to sign NextAuth sessions. |
| `AUTH_GITHUB_ID` | If GitHub login is enabled | GitHub OAuth application client ID. |
| `AUTH_GITHUB_SECRET` | If GitHub login is enabled | GitHub OAuth application client secret. |
| `AUTH_GOOGLE_ID` | If Google login is enabled | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | If Google login is enabled | Google OAuth client secret. |
| `GEMINI_API_KEY` | For AI features | Gemini API key created in Google AI Studio. |
| `GEMINI_MODEL` | Optional | Gemini model name. The default is `gemini-3.5-flash`. |

For Vercel, add the same variables in **Project Settings -> Environment Variables** for every environment you deploy to: Production, Preview, and Development when applicable. Redeploy after changing a Vercel variable; running deployments do not receive newly added values.

## From Scratch: How the Application Works

### 1. Authentication and route access

1. A visitor opens a public route such as `/`.
2. `proxy.ts` checks whether the route is public, an auth page, an auth API endpoint, or a protected application route.
3. For protected routes, an unauthenticated user is redirected to `/auth/sign-in`.
4. NextAuth completes OAuth sign-in and `auth.ts` creates or links the user and OAuth account in MongoDB.
5. The browser receives a session, and the dashboard/playground pages can load user-owned projects.

`/api/auth/*` must remain outside the auth proxy matcher. If it is redirected to the sign-in page, session requests receive HTML instead of JSON and the browser reports an `Unexpected token '<'` error.

### 2. Dashboard to new project

1. The dashboard lists playground records from MongoDB.
2. The user selects a project type such as React or Hono.
3. A `Playground` database record is created with a template key.
4. The user enters `/playground/[id]`.
5. `usePlayground` first checks for saved project files in the database.
6. New projects without saved files request `/api/template/[id]`.
7. The template API reads the matching starter folder and returns a `TemplateFolder` JSON tree.

Saved files intentionally take priority over starter files. This prevents a template update from overwriting a user's project. If an old project has bad saved code, create a new project to obtain a fresh starter or replace only the affected saved file.

### 3. Editor and save flow

1. The playground page owns the loaded `TemplateFolder` file tree.
2. The file explorer lets the user select a file.
3. Monaco Editor changes the in-memory tree.
4. Save calls the playground actions and persists the complete JSON file tree as `TemplateFile.content`.
5. On the next visit, `usePlayground` restores that saved tree before looking at a starter.

The editor settings page stores visual preferences such as font size, tab size, word wrap, minimap, and auto-save in the browser. Those preferences are personal to the browser, not part of a project file.

### 4. WebContainer preview flow

1. `useWebContainer` boots one WebContainer for the active workspace.
2. `transformToWebContainerFormat` converts the editor JSON tree into the WebContainer virtual file-system format.
3. `RuntimeSession` mounts or synchronizes the files.
4. It reads `package.json` and chooses the first available script in this order: `dev`, `start`, `serve`, then `preview`.
5. It runs `npm install --no-audit --no-fund` when dependency metadata changes.
6. It runs the selected npm script and listens for WebContainer's `server-ready` event.
7. `WebContainerPreview` receives the URL and renders it in an iframe inside the IDE.
8. Xterm and the Output panel receive process output from the same runtime session.

The preview URL is not a normal public deployment URL. It is connected to the browser's WebContainer session. Opening it by itself in a new tab shows StackBlitz's connection screen and may navigate to `/webcontainer/connect/...`, which is not an application route. The IDE therefore keeps the preview embedded instead of offering an external-open button.

### 5. AI assistant flow

1. The AI panel sends a message, optional chat history, and a mode: `chat`, `review`, `fix`, or `optimize`.
2. `app/api/chat/route.ts` validates the request and limits message/history size.
3. `lib/gemini.ts` checks `GEMINI_API_KEY` on the server only.
4. The server requests Gemini's `generateContent` endpoint with an appropriate system instruction.
5. The UI renders the reply or a clear upstream error message.

The API key must never be placed in a client-side variable or sent to Monaco/WebContainer. It is used only by Next.js server routes.

Gemini errors usually mean one of the following:

| Message | Meaning | Action |
| --- | --- | --- |
| `Gemini is not configured on this server.` | The deployment cannot see `GEMINI_API_KEY`. | Add it in the correct Vercel environment and redeploy. |
| Model is unavailable | The selected model name is retired or unavailable. | Use a supported model such as `gemini-2.5-flash`. |
| High demand / 503 | Gemini is temporarily overloaded. | Retry later; the app retries one time automatically. |
| Quota exceeded / 429 | The project has exhausted its Gemini allowance. | Wait for quota reset or upgrade the Google AI plan. |
| Request timed out | Gemini did not respond within 30 seconds. | Retry with a shorter request and check provider status. |

## Important Folders

```text
app/                         Next.js pages and API route handlers
  api/                       Server endpoints: auth, chat, completion, templates
  dashboard/                 Dashboard route
  playground/[id]/           Main IDE route
components/                  Shared application and UI components
hooks/                       Shared React hooks
lib/                         Database, Gemini, template, and common helpers
modules/
  ai-chat/                   AI assistant UI and client behavior
  auth/                      Authentication actions and components
  dashboard/                 Project-management UI and actions
  playground/                Editor, explorer, save/load, and workspace UI
  webcontainers/             Browser runtime, terminal, preview, file transformer
prisma/                      Prisma schema and generated-client configuration
public/                      Static assets
vibecode-starters/           Starter projects mounted into new playgrounds
```

## Core Files to Learn First

| File | What to learn there |
| --- | --- |
| `app/layout.tsx` | Global application providers and layout. |
| `proxy.ts` | Route protection and the auth matcher. |
| `auth.ts` and `auth.config.ts` | Provider setup, session fields, user/account linking. |
| `prisma/schema.prisma` | The project data model. |
| `app/playground/[id]/page.tsx` | The IDE composition: explorer, editor, preview, AI panel, status bar. |
| `modules/playground/hooks/usePlayground.tsx` | Project loading and saving behavior. |
| `app/api/template/[id]/route.ts` | New-project starter loading. |
| `lib/template.ts` | Template key to starter-folder mapping. |
| `modules/webcontainers/lib/runtime.ts` | Dependency installation, server startup, logs, runtime state. |
| `modules/webcontainers/hooks/useWebContainer.ts` | Runtime lifecycle for an active workspace. |
| `modules/webcontainers/components/webcontainer-preview.tsx` | Embedded preview, device modes, terminal, and output UI. |
| `lib/gemini.ts` | Server-only Gemini request implementation and error mapping. |
| `app/api/chat/route.ts` | AI chat request validation and response format. |

## Supported Starter Templates

The product exposes these supported template keys:

| Template key | Starter folder |
| --- | --- |
| `REACT` | `vibecode-starters/react-ts` |
| `NEXTJS` | `vibecode-starters/nextjs` |
| `EXPRESS` | `vibecode-starters/express-simple` |
| `VUE` | `vibecode-starters/vue` |
| `HONO` | `vibecode-starters/hono-nodejs-starter` |
| `ANGULAR` | `vibecode-starters/angular` |

Other folders under `vibecode-starters/` are available source material but are not automatically exposed by the current template selector.

### Add a supported template

1. Add or choose a starter folder under `vibecode-starters/`.
2. Ensure it has a valid `package.json` and a runnable `dev`, `start`, `serve`, or `preview` script.
3. Add its enum value to `Templates` in `prisma/schema.prisma`.
4. Add its path in `lib/template.ts`.
5. Add the option to the dashboard project-creation UI.
6. Generate Prisma Client and apply the database/schema migration strategy appropriate to the deployed MongoDB database.
7. Create a new project and verify install, terminal output, `server-ready`, and iframe preview.

## Database Model

| Model | Responsibility |
| --- | --- |
| `User` | Identity, role, OAuth accounts, owned playgrounds, and messages. |
| `Account` | OAuth provider account linked to a user. |
| `Playground` | Project title, description, selected template, owner, and timestamps. |
| `TemplateFile` | One JSON file-tree snapshot saved for a playground. |
| `StarMark` | A user's star state for a playground. |
| `ChatMessage` | Persisted AI conversation message owned by a user. |

## Deployment Checklist

1. Push the repository to GitHub.
2. Import the `vibecode` directory as the Vercel project root if the repository contains an outer workspace folder.
3. Add all required environment variable names and values in Vercel. Do not commit them.
4. Set each variable for Production and Preview if both deployments need it.
5. Configure OAuth provider callback URLs to your production domain.
6. Verify that the MongoDB deployment allows connections from Vercel.
7. Run a fresh Vercel deployment after variables or source code change.
8. Test sign-in, dashboard creation, saved project loading, Gemini chat, and a fresh WebContainer preview.

## Troubleshooting

### `Missing script: start` or a server never starts

The selected starter's `package.json` has no runnable script. Add `dev`, `start`, `serve`, or `preview`; the runtime chooses them in that order.

### Preview is white but the terminal says the server is ready

Check the starter entry files and terminal output first. A saved project can contain older or invalid user code, even when the starter is correct. Create a new project to validate the starter independently. For React, verify that the HTML mount element matches the React entry file.

### StackBlitz says "You're almost there" or `/webcontainer/connect/...` is 404

That happens when a WebContainer preview URL is opened separately from its browser runtime. Use the embedded preview within the playground. These URLs are intentionally not public links and cannot be deployed or shared as normal application pages.

### `Unexpected token '<' ... is not valid JSON` from NextAuth

Usually the auth session endpoint was redirected to an HTML sign-in page. Confirm `proxy.ts` excludes `api/auth` from its matcher and restart/redeploy.

### Font size does not change in Monaco

Use the settings page, then return to the editor. Monaco receives its options through the editor settings integration. Browser-specific stored preferences can be cleared from site storage when testing defaults.

### AI works locally but says not configured on Vercel

Local `.env` values never upload to Vercel. Add `GEMINI_API_KEY` to Vercel's environment variables for the relevant deployment environment, then redeploy.

### Can extensions be installed?

No. Monaco supplies an editor experience, but it is not the full VS Code desktop extension host. Marketplace extensions cannot run in this browser-based WebContainer architecture. The extensions activity control has been removed to avoid suggesting unsupported functionality.

## Security Rules

- Keep `.env` files untracked and private.
- Never expose `GEMINI_API_KEY`, OAuth secrets, `AUTH_SECRET`, or database connection strings in client components, logs, screenshots, commits, or documentation.
- Do not trust project input as executable server code outside WebContainer.
- Validate API input at route boundaries.
- Keep production OAuth redirect URLs accurate and HTTPS-only.
- Treat saved playground code as user content; do not overwrite it automatically during a starter upgrade.

## Recent Fixes

| Area | Fix |
| --- | --- |
| Gemini | Replaced the previous local-model assumption with server-side Gemini requests, a supported default model, timeout handling, clear error messages, and one retry for temporary overloads. |
| Authentication proxy | Corrected the matcher so NextAuth API endpoints are not intercepted by the route-protection proxy. |
| WebContainer preview | Kept the preview in its iframe and removed the standalone-tab action that caused StackBlitz connection screens and `/webcontainer/connect/...` 404s. |
| WebContainer lifecycle | Uses one active runtime per workspace, subscribes before the server starts, shows terminal output, and reuses installs when dependency metadata is unchanged. |
| Playground loading | Loads saved user files first and only uses a starter for a new project, preventing accidental overwrites. |
| Editor preferences | Connected stored settings to Monaco options so font size and related preferences are applied. |
| AI panel | Made the assistant panel draggable while keeping it bounded to the workspace. |
| Extensions UI | Removed the misleading marketplace/extensions control because browser WebContainer does not support VS Code extensions. |

## Learning Path

1. Run the application and sign in.
2. Create a fresh React playground and inspect its files, terminal output, and preview.
3. Read `app/playground/[id]/page.tsx` to see how the IDE is composed.
4. Read `usePlayground.tsx`, then `app/api/template/[id]/route.ts`, to understand how a starter becomes editor data.
5. Read `transformer.ts`, `useWebContainer.ts`, and `runtime.ts` in that order to understand live preview.
6. Read `lib/gemini.ts` and `app/api/chat/route.ts` to understand server-side AI integration.
7. Read `prisma/schema.prisma`, `auth.ts`, and `proxy.ts` to understand data, identity, and authorization.
8. Make one small change at a time, test it in a fresh project, then save it.

## Before Opening a Pull Request or Deploying

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Also manually test a fresh project in each supported framework, sign-in, a save/reload cycle, Gemini chat, and the embedded preview. Never use a raw WebContainer preview URL as a deployment test.
