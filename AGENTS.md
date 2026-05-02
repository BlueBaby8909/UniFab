# AGENTS.md

## Project Overview
- **Project:** UniFab
- **Purpose:** University 3D printing service web app for the USTP-CDO Fabrication Laboratory.
- **Primary users:** Guests, authenticated clients, and lab administrators.
- **Stack:** Express.js backend, MySQL database, React + Vite frontend, Tailwind CSS, PrusaSlicer CLI, MyMiniFactory API integration.
- **Current direction:** Build from the approved workflow/PRD decisions in the root `README.md`. Requirements may evolve, so keep implementation flexible and well documented.

## Product Rules
- Guests may upload/configure models and view calculated quotes without logging in.
- Print request submission requires login.
- Custom design request submission requires login.
- A print request must not be submitted without a successful quote.
- Quote calculation must be slicer-based and must include validated print time, filament usage, and pricing.
- Quote data should persist through login using backend quote records with short-lived quote tokens.
- Submitted print requests must store a quote snapshot so later pricing changes do not silently affect them.
- MyMiniFactory designs are not automatically printable. They need admin readiness approval before direct print submission.
- Local designs may use categories/tags for filtering, but tags are not a blocker for the core request workflow.
- Printer information may be shown to clients, but printer selection must not affect quote generation or request submission in the current scope.
- Website/content management is approved but secondary to the core quote and request workflow.

## Commands
- **Backend install:** `cd backend && npm install`
- **Backend dev:** `cd backend && npm run dev`
- **Backend start:** `cd backend && npm start`
- **Frontend install:** `cd frontend && npm install`
- **Frontend dev:** `cd frontend && npm run dev`
- **Frontend build:** `cd frontend && npm run build`
- **Frontend lint:** `cd frontend && npm run lint`

## Implementation Priorities
1. Stabilize authentication and protected-route behavior.
2. Implement public quote calculation and quote-token persistence.
3. Require a valid successful quote before print request submission.
4. Connect client upload, library, custom design, request history, and receipt workflows to backend APIs.
5. Build admin workflows for pricing, materials, slicer profiles, design readiness, print requests, and design requests.
6. Add supporting features such as local design tags/categories, printer information, and website/content management.

## Backend Guidance
- Keep quote generation fully backend-controlled.
- Never let clients submit raw slicer flags, slicer executable paths, or profile file paths.
- Validate upload type, size, and request body fields before processing.
- Store server-managed quote snapshots for traceability.
- Keep pricing, material, profile, and design snapshots attached to submitted requests.
- Enforce role-based access on admin routes.
- Record status history for request lifecycle changes.
- Clean up temporary files after quote expiration, failed validation, or failed processing.
- Treat MyMiniFactory API access as backend-only; never expose API keys to the frontend.

## Frontend Guidance
- Clearly separate "View Quote" from "Submit Print Request".
- Make it obvious that quote viewing does not require login.
- Disable submission until a successful quote exists.
- Preserve quote token when redirecting unauthenticated users to login.
- Restore the quote after login when possible.
- Show clear user messages for failed slicing, missing profiles, unavailable materials, expired quotes, and unsupported files.
- Distinguish local designs, MyMiniFactory designs needing review, ready-to-print designs, and unavailable designs.
- Keep admin screens practical and task-oriented: pending review, payment submitted, active printing, and completed requests should be easy to scan.

## Do
- Read the existing code and database shape before changing behavior.
- Match the current project patterns unless there is a clear reason to improve them.
- Keep changes small, scoped, and implementation-aware.
- Update docs when workflow or behavior changes.
- Prefer explicit validation and clear error messages.
- Run the relevant build/lint checks after frontend changes when practical.

## Don't
- Do not add unrelated marketplace, shipping, seller, or online payment workflows.
- Do not introduce new dependencies without a clear reason.
- Do not hardcode secrets, API keys, or credentials in committed files.
- Do not remove existing user work or rewrite large areas without need.
- Do not allow request submission to bypass quote validation.
- Do not make client printer selection affect quote calculation in the current scope.

## Testing and Verification
- Run `npm run lint` and `npm run build` in `frontend` after significant frontend changes.
- Manually verify public quote viewing, login redirect, quote restoration, and request submission when those flows are implemented.
- Verify backend changes against validation, role access, file upload limits, quote calculation, and request status transitions.
- If automated tests are added later, keep them focused on quote persistence, request submission rules, admin status transitions, and design readiness rules.

## Git
- Keep commits focused and descriptive.
- Do not force push.
- Do not revert unrelated user changes.

## Response Style
- Be clear, concise, and practical.
- Explain workflow-impacting decisions in plain English.
- Call out assumptions, gaps, and risks when requirements are still evolving.
