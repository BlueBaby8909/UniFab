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
- Authenticated print request submission.
- Backend quote persistence through short-lived quote records/tokens.
- Slicer-based quote calculation using PrusaSlicer-generated G-code.
- Material and slicer profile management.
- Admin-managed pricing configuration.
- Client request history and request status tracking.
- Receipt upload after payment slip issuance.
- Design library using local admin designs and MyMiniFactory results.
- Admin readiness control for MyMiniFactory designs.
- Custom design requests with reference file uploads.
- Local design categories/tags for filtering.
- Printer information display.
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
11. Only admin-approved MyMiniFactory designs can proceed to direct print submission.
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
9. Backend stores a temporary quote record and returns a quote token.
10. User views the quote without needing to log in.

### 2. Submit Print Request

1. User reviews a successful quote.
2. User clicks submit.
3. If unauthenticated, the user is redirected to login with the quote token preserved.
4. After login, the frontend restores the quote from the backend.
5. User confirms submission.
6. Backend validates the quote token.
7. Backend creates a print request from the quote snapshot.
8. Request starts as `pending_review`.

### 3. Search Design Library

1. User opens the design library.
2. User searches or filters designs.
3. Backend returns local designs and MyMiniFactory results.
4. Backend applies admin overrides and readiness rules.
5. User views design details.
6. User can proceed only when the design is local/active or MyMiniFactory-ready.

### 4. Request Custom Design

1. User opens the custom design request form.
2. User must log in before submission.
3. User submits object details, dimensions, preferred material, intended use, quantity, and reference files.
4. Admin reviews the request.
5. Admin updates the design request status and notes.
6. If the request produces a printable design, admin may convert it into a local design or support a linked print request.

### 5. Track Requests and Upload Receipt

1. Client opens request history.
2. Client views request status, reference number, quote/confirmed cost, and status history.
3. After admin issues a payment slip, client pays through the university process.
4. Client uploads a receipt file.
5. Request moves to `payment_submitted`.
6. Admin verifies the receipt and advances the request.

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

Admins review submitted requests, confirm feasibility, set confirmed cost, issue payment slips, verify receipts, and update request status.

### Design Request Management

Admins review custom design requests, inspect reference files, update request status, and add admin notes.

### Design Library Management

Admins manage:

- Local designs
- Local design categories/tags
- MyMiniFactory design overrides
- MyMiniFactory readiness statuses

Recommended MyMiniFactory readiness statuses:

| Status | Behavior |
|---|---|
| `not_reviewed` | Visible, but cannot be submitted directly for printing. |
| `ready_for_printing` | Can proceed to quote/request flow. |
| `not_printable` | Visible as unavailable or blocked from submission. |
| `hidden` | Excluded from client-facing results. |

### Printer Information

Admins may manage printer details shown to users. Printer selection does not affect client quote generation or request submission in the current scope.

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
