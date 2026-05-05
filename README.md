# UniFab

UniFab is a university 3D printing service web app for the USTP-CDO Fabrication Laboratory. It lets users upload or select 3D designs, generate slicer-based quotes, submit print requests, request custom designs, and track request progress. Lab administrators use the system to manage pricing, materials, slicer profiles, design readiness, requests, and public website content.

This README is the working reference for the approved product workflow. The project may still evolve, but new work should stay aligned with the rules and scope below.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| File uploads | Multer |
| Auth | JWT access and refresh tokens |
| Quote engine | PrusaSlicer CLI |
| External design source | MyMiniFactory API |

## Core Product Scope

### In Scope

- Public quote calculation without login.
- Authenticated print request submission with Terms & Conditions acceptance.
- Backend quote persistence through short-lived quote records/tokens.
- Slicer-based quote calculation using PrusaSlicer-generated G-code.
- Basic pre-flight warnings (e.g., long print times or large volumes) based on slicer data.
- Material and slicer profile management (including rich material specs).
- Admin-managed pricing configuration.
- Client request history and visual request status tracking.
- Automated payment slip generation and physical in-person receipt verification.
- Design library using local admin designs, user-submitted designs (pending approval), and MyMiniFactory results.
- "Print Ready" instant quoting for verified library designs.
- Admin readiness control for MyMiniFactory designs via integrated API browser and direct file mapping.
- Custom design requests with reference file uploads.
- Local design categories/tags for filtering.
- Printer information display.
- Email verification for registered users.
- Admin dashboard sorting and filtering.
- Website/content management for homepage content, contact details, images, lab hours, and service notices.

### Out of Scope for the Current Version

- Full e-commerce checkout.
- Online payment gateway integration.
- Public seller/vendor accounts.
- Shipping and delivery logistics.
- Multi-vendor fulfillment.
- Designer marketplace or designer portal.
- Client-controlled printer selection affecting quotes.
- Cart or batch checkout unless approved later as a separate enhancement.
- Promo codes.

## User Roles

| Role | Capabilities |
|---|---|
| Guest | Browse public pages, search the design library, upload a model, configure print settings, and view a quote. |
| Client | Submit print requests, submit design requests, view request history, upload receipts, and track statuses. |
| Admin | Manage pricing, materials, slicer profiles, printer information, design library, design readiness, print requests, design requests, and website content. |

## Approved Workflow Rules

1. Guests can view calculated quotes without logging in.
2. Print request submission requires login.
3. Custom design request submission requires login.
4. A print request cannot be submitted without a successful quote.
5. Quote calculation must be based on validated PrusaSlicer output.
6. If slicing fails, the user must revise the file/settings or use the custom design/request-for-review path.
7. Quote data should persist through login using backend quote records and short-lived quote tokens.
8. Submitted print requests must keep quote snapshots to avoid unexpected changes after admin pricing updates.
9. Admin-confirmed cost is authoritative after review.
10. MyMiniFactory designs are not automatically ready for printing.
11. Only admin-approved MyMiniFactory designs can proceed to direct print submission. Direct MMF quoting must use an admin-linked local printable file so PrusaSlicer remains the source of quote metrics.
12. Local designs can support categories/tags, but tags are not required for the core request workflow.
13. Printer information can be displayed to users, but printer/profile selection remains backend/admin-controlled.
14. Website/content management is approved, but it is secondary to the core quote and request workflow.

## Main Client Workflows

### 1. Upload File and View Quote

1. User opens the quote/upload page.
2. User uploads a supported model file: `.stl`, `.obj`, or `.3mf`.
3. User chooses material, print quality, infill, and quantity.
4. Backend validates the file and settings.
5. Backend resolves the active material and active slicer profile.
6. Backend runs PrusaSlicer CLI.
7. Backend parses generated G-code for print time, filament weight, and filament length.
8. Backend calculates the estimated price using current pricing configuration.
9. Backend analyzes slicer data and displays basic pre-flight warnings (e.g., if print time > 24 hours or volume is near max).
10. Backend stores a temporary quote record and returns a quote token.
11. User views the quote in an interactive 3D viewer without needing to log in.

### 2. Submit Print Request

1. User reviews a successful quote.
2. User clicks submit.
3. If unauthenticated, the user is redirected to login with the quote token preserved.
4. After login, the frontend restores the quote from the backend.
5. User accepts Terms & Conditions and confirms submission.
6. Backend validates the quote token.
7. Backend creates a print request from the quote snapshot.
8. Request starts as `pending_review`.

### 3. Search Design Library & Submit Designs

1. User opens the design library.
2. User searches or filters designs.
3. User views design details.
4. **Verified Designs:** If a design is tagged as "Print Ready," the user can click "Instant Quote" to bypass manual upload and proceed directly to quoting using the cached file.
5. **Unverified MMF Designs:** If a MyMiniFactory design needs review, the user is provided an outbound link to download it directly from MyMiniFactory, after which they can manually upload it to the quote engine.
6. **Community Submissions:** Authenticated users can upload their own designs to the library. These enter a `pending_approval` state until reviewed by an admin.

### 4. Request Custom Design

1. User opens the custom design request form.
2. User must log in before submission.
3. User submits object details, dimensions, preferred material, intended use, quantity, and reference files.
4. Admin reviews the request.
5. Admin updates the design request status and notes.
6. If the request produces a printable design, admin may convert it into a local design or support a linked print request.

### 5. Track Requests and Verify Payment

1. Client opens request history and uses the visual order status timeline.
2. Client views request status, reference number, quote/confirmed cost, and status history.
3. After admin approval, the system automatically generates a viewable/printable payment slip.
4. Client pays in person at the designated university cashier.
5. Client presents the physical receipt to lab staff during operational hours.
6. Admin manually marks the request as `payment_verified` in the system.

## Main Admin Workflows

### Pricing Management

Admins manage values used in quote calculation:

- Machine hour rate
- Base fee
- Waste factor
- Support markup factor
- Electricity cost per kWh
- Power consumption watts
- Currency

Pricing changes affect future quotes. Existing submitted requests keep their original quote snapshots.

### Material and Slicer Profile Management

Admins can:

- Add, edit, activate, or deactivate materials.
- Set material cost per gram.
- Upload `.ini` slicer profiles.
- Maintain profile versions for material-quality combinations.

A quote cannot be calculated unless an active material and active slicer profile exist for the selected material-quality pair.

### Print Request Management

Admins review submitted requests, confirm feasibility, set confirmed cost, and issue payment slips (which the system auto-generates).

When a client presents a physical receipt, admins verify it in-person and manually update the request status to `payment_verified`.

Rejected print requests can be archived to remove them from the active admin queue. Archived rejected print requests may be permanently deleted afterward as an admin cleanup action.

### Design Request Management

Admins review custom design requests, inspect reference files, update request status, and add admin notes.

Rejected design requests can be archived to remove them from the active admin queue. Archived rejected design requests may be permanently deleted only when no print requests still reference them.

### Design Library Management

Admins manage:

- Local designs
- Local design categories and tags
- User-submitted community designs (approving/rejecting with feedback notes)
- MyMiniFactory design overrides via an integrated API browser.

**MyMiniFactory Workflow:** Admins browse MMF designs directly within the admin panel. They view available files, test them locally, and use a "Set as Print Ready Target" feature to make the backend securely cache that specific file, preventing manual upload errors.

Unavailable local designs can be archived to hide them from the default admin list. Archived unavailable local designs may be permanently deleted only when no print requests or design requests still reference them.

Recommended MyMiniFactory readiness statuses:

| Status | Behavior |
|---|---|
| `not_reviewed` | Visible, but cannot be submitted directly for printing. |
| `ready_for_printing` | Can proceed to quote/request flow only when linked to an active local printable file. |
| `not_printable` | Visible as unavailable or blocked from submission. |
| `hidden` | Excluded from client-facing results. |

### Printer Information

Admins manage the list of available printers (including technology, build volume, and supported materials). This information can be displayed publicly. Printer selection does not affect client quote generation or request submission in the current scope.

### System Status

The system provides a health check endpoint to monitor API and database latency/uptime, viewable on the frontend by admins only.

### Website and Content Management

Admins may manage:

- Homepage content
- Contact details
- Lab hours
- Service notices
- Homepage/service images

This feature is approved but should come after the core quote and request workflow.

## Request Statuses

### Print Request Statuses

| Status | Meaning |
|---|---|
| `pending_review` | Request has been submitted and awaits admin review. |
| `design_in_progress` | Design work or adjustment is in progress. |
| `approved` | Request has been approved. |
| `payment_slip_issued` | Confirmed cost and payment slip have been issued. |
| `payment_submitted` | Client has uploaded payment receipt. |
| `payment_verified` | Admin has verified receipt. |
| `printing` | Print job is in progress. |
| `completed` | Print job is finished. |
| `rejected` | Request was declined. |

### Design Request Statuses

| Status | Meaning |
|---|---|
| `pending` | Request has been submitted. |
| `under_review` | Admin is reviewing the request. |
| `approved` | Admin accepted the request for design work. |
| `rejected` | Admin declined the request. |
| `completed` | Design request has been completed or resolved. |

## Important Data Snapshots

Submitted print requests should preserve quote-related data so requests remain traceable after pricing/profile changes.

Recommended quote snapshot fields:

- Quote token or quote ID
- Source type
- File or design source reference
- Material
- Quality
- Infill
- Quantity
- Estimated print time
- Filament weight
- Filament length
- Pricing breakdown
- Total estimated price
- Pricing config snapshot
- Material cost snapshot
- Slicer profile/version snapshot
- Quote creation timestamp
- Quote expiration timestamp

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development server, usually `http://localhost:5173`.

## Environment Requirements

The backend expects environment variables for:

- Server port
- CORS origin
- MySQL connection
- JWT secrets and expiration
- Mail settings
- MyMiniFactory API settings
- PrusaSlicer executable path

Do not commit real production secrets.

## Verification

Use these checks when changing the app:

```bash
cd frontend
npm run lint
npm run build
```

Backend currently has no test script defined. Verify backend changes manually through API behavior until automated tests are added.

## Development Notes

- Keep quote viewing and request submission separate.
- Keep user-facing workflows simple and guided.
- Keep admin workflows focused on operational tasks.
- Prefer backend-controlled validation for anything related to pricing, slicing, profiles, uploads, and permissions.
- Update this README and `AGENTS.md` when approved workflow decisions change.
 timestamp
- Quote expiration timestamp

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development server, usually `http://localhost:5173`.

## Environment Requirements

The backend expects environment variables for:

- Server port
- CORS origin
- MySQL connection
- JWT secrets and expiration
- Mail settings
- MyMiniFactory API settings
- PrusaSlicer executable path

Do not commit real production secrets.

## Verification

Use these checks when changing the app:

```bash
cd frontend
npm run lint
npm run build
```

Backend currently has no test script defined. Verify backend changes manually through API behavior until automated tests are added.

## Development Notes

- Keep quote viewing and request submission separate.
- Keep user-facing workflows simple and guided.
- Keep admin workflows focused on operational tasks.
- Prefer backend-controlled validation for anything related to pricing, slicing, profiles, uploads, and permissions.
- Update this README and `AGENTS.md` when approved workflow decisions change.
