export const config = {
  "title": "Permit to Work",
  "tagline": "Control high-risk work — dual-team approvals, auto-populated hazards, and an 8-hour permit lifecycle.",
  "org": "Northwind Industrial",
  "port": 5173,
  "walkthrough": [
    {
      "route": "/app/dashboard",
      "title": "Permit dashboard",
      "sub": "Permits by status, recent activity and work-type breakdown."
    },
    {
      "route": "/app/permits/new",
      "title": "Raise a permit",
      "sub": "Pick a work type — hazards, PPE, precautions and required documents auto-populate."
    },
    {
      "route": "/app/permits",
      "title": "All permits",
      "sub": "Filter by status, type and site; see approvers and the expiry countdown."
    },
    {
      "route": "/app/approvals",
      "title": "Approvals",
      "sub": "Engineering and Operations approve independently before work begins."
    },
    {
      "route": "/app/observations",
      "title": "Observations",
      "sub": "Safety observations and suggestions raised against permits."
    }
  ],
  "closing": {
    "route": "/app/dashboard",
    "title": "Permit to Work — no high-risk job without sign-off.",
    "sub": "Start by registering your organization."
  }
}
