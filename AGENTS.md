# AGENTS.md

## Project Overview
- **Project:** UniFab
- **Purpose:** University 3D printing service web app for the USTP-CDO Fabrication Laboratory.
- **Primary users:** Guests, authenticated clients, and lab administrators.
- **Stack:** Express.js backend, MySQL database, React + Vite frontend, Tailwind CSS, PrusaSlicer CLI, MyMiniFactory API integration.
- **Current direction:** Build from the approved workflow/PRD decisions in the root `README.md`. Requirements may evolve, so keep implementation flexible and well documented.

## Product Rules
- Guests may upload/configure models and view calculated quotes without logging in.
- Print request submission requires login and verified email.
- Custom design request submission requires login.
- A print request must not be submitted without a successful quote.
- Users must accept Terms and Conditions before final print request submission.
- Quote calculation must be slicer-based and must include validated print time, filament usage, and pricing.
- The system provides basic pre-flight warnings using slicer output (e.g., long print times).
- Quote data should persist through login using backend quote records with short-lived quote tokens.
- Submitted print requests must store a quote snapshot so later pricing changes do not silently affect them.
- Payment slips are auto-generated; payment verification relies on in-person physical receipt checking by admins (no client upload).
- "Print Ready" library designs offer instant quoting using secure, backend-cached files.
- Users can submit designs to the library, but they remain `pending_approval` until an admin reviews them.
- MyMiniFactory designs marked "Needs Review" are not hosted on UniFab; instead, an outbound link directs users to the source.
- Admins manage MyMiniFactory designs using an integrated API browser, assigning explicit file targets for Print Ready status to prevent manual upload errors.
- Local designs may use categories/tags for filtering and organization.
- Printer information is managed by admins and may be shown publicly to clients. Printer selection must not affect quote generation or request submission in the current scope.
- System status can be monitored by admins only.
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
1. Stabilize authentication and protected-route behavior (including email verification and Terms & Conditions acceptance).
2. Implement public quote calculation and quote-token persistence with Interactive 3D Model Viewer and basic pre-flight warnings.
3. Require a valid successful quote before print request submission.
4. Connect client upload, library, custom design, request history (visual timeline), and payment workflows (auto payment slips, physical receipt checking) to backend APIs.
5. Build admin workflows for pricing, materials (rich specs), slicer profiles, print requests, and design requests.
6. Build Design Library enhancements: "Submit to Community" user flow, "Print Ready" instant quoting, and MyMiniFactory direct file mapping via an integrated admin API browser.
7. Support additional features including local design categories/tags, printer information management, system status healthchecks, and admin dashboard sorting/filtering.
8. Add supporting features such as website/content management (including DFM guidelines).

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
