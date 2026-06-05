# Permit to Work (PTW)

A multi-organization **Permit to Work** safety management app — raise high-risk work permits
(hot work, confined space, height, electrical, excavation, hazardous material handling), route
them through **Engineering + Operations** approval, track live status with automatic 8-hour
expiry, and print/PDF the permit with a status watermark.

Built with **React 18 + Vite + Firebase (Auth + Firestore) + Tailwind + Recharts + Framer Motion**.

## Roles (RBAC)

| Role | Capabilities |
|------|--------------|
| **Admin** | Everything, plus user management & audit log |
| **Engineering** | Create, view, edit, approve/reject, close, extend |
| **Operations** | Create, view, edit, approve/reject, close, extend |
| **Technician** | Create permits (and request closure/extension on their own) |

New sign-ups land as **pending Technician**; an Admin approves them and assigns the final role.

## Permit lifecycle / status

`Draft → Approved → Approved & Work in Progress → (Extended / Extended & In Progress) → Closed`,
with `Not Closed / Expired` when the 8-hour window elapses without closure. A permit is **Approved**
only when **both** Engineering and Operations approve. Closure and extension each require both teams
again. Status is derived live from approvals + time, so permits auto-expire with no backend cron.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in your Firebase web config
npm run dev               # http://localhost:5173
npm test                 # unit tests (status + permissions logic)
npm run build
```

### Firebase setup

1. Create a Firebase project, enable **Authentication → Email/Password** and **Cloud Firestore**.
2. Copy the web app config into `.env` (the `VITE_FIREBASE_*` keys).
3. Deploy security rules + indexes:
   ```bash
   firebase use <your-project-id>
   firebase deploy --only firestore:rules,firestore:indexes
   ```

Until `.env` is filled, the app shows a friendly "Connect Firebase" setup screen.

## Data model (Firestore)

```
organizations/{orgId}                     org doc
orgIndex/{nameLower}                       public signup lookup
users/{uid}                                name,email,phone,orgId,role,status
organizations/{orgId}/permits/{permitId}   the permit + approvals/closure/extension
organizations/{orgId}/meta/counters        permit-number sequence
organizations/{orgId}/auditLogs/{id}       append-only trail
```
