# Travel Agency Sales Tracking System — Requirements Document

## 1. Project Overview

Build a web-based software system for small-to-medium travel agencies that primarily sell air tickets. The system replaces manual Excel-based tracking with a structured, role-based platform where agency owners can monitor sales across multiple branches and employees in real time.

**Primary goal:** Give travel agency owners full visibility into their business — who is selling what, from which branch, and how much revenue/profit is being generated — without relying on spreadsheets.

**Target users:** Small-to-medium travel agencies with one or more physical branches, each staffed by ticket-selling agents/employees, managed by a single owner/admin.

---

## 2. Core Concepts & Data Model

The system is organized around this hierarchy:

```
Travel Agency (Organization)
  └── Branch (physical location)
        └── Employee/Agent (individual login, sells tickets)
              └── Sale (an individual ticket sold)
  └── Owner/Admin (organization-level, sees everything across all branches)
```

### 2.1 Entities

**Organization**
- Represents one travel agency (the paying customer if this becomes multi-tenant SaaS later; for now, can be single-tenant per deployment)
- Fields: id, name, created_at

**Branch**
- Belongs to an Organization
- Fields: id, organization_id, name, location/address, created_at

**User (Employee/Agent or Owner/Admin)**
- Each user has their own login credentials (username/email + password)
- Role-based: `owner`/`admin` or `employee`/`agent`
- Employees are tied to exactly one Branch
- Owner/Admin is not tied to a specific branch — has organization-wide access
- Fields: id, organization_id, branch_id (nullable for owner), name, email, password_hash, role, created_at

**Sale (a ticket sold)**
- Belongs to one Employee, and by extension one Branch and one Organization
- Core fields:
  - Passenger name(s)
  - PNR / booking reference number
  - Airline
  - Route (origin → destination)
  - Travel date
  - Sale price (amount charged to customer)
  - Cost/net price (amount paid to supplier/airline/GDS) — used to calculate margin
  - Payment status (paid in full / partial / due)
  - Customer contact info (phone/email)
  - Sale date (when the ticket was sold/entered)
  - Status: issued / cancelled / refunded / void
  - Source of entry: manual / GDS document upload
  - Notes (free text)

### 2.2 Multi-tenancy note

Design the database schema so every core table includes `organization_id`, even if the first version is deployed for a single agency. This keeps the door open to running the same system for multiple agencies later without a schema redesign.

---

## 3. User Roles & Permissions

### 3.1 Employee / Agent
- Logs in with their own credentials
- Can create a new sale record (see Section 4 for entry methods)
- Can view and edit only their own sales
- Can view their own performance summary (today's sales, this month's sales, totals)
- Cannot see other employees' sales or other branches' data

### 3.2 Owner / Admin
- Single account (or multiple admin accounts) with organization-wide visibility
- Can view all sales across all branches and all employees
- Can filter/drill down by branch, by employee, by date range, by route/airline
- Can view an end-of-day summary (see Section 5)
- Can view monthly/yearly/custom-range reports (see Section 6)
- Can manage branches (add/edit/remove)
- Can manage employee accounts (add/edit/remove, assign to branch)
- Can export reports (PDF/Excel/CSV)

---

## 4. Sale Entry (Core Feature)

Sale entry must support two entry paths that both write to the **same underlying sale record and form**, so neither path is a separate system:

### 4.1 Manual Entry
- A structured form where the agent types in all sale fields directly (see field list in Section 2.1)
- This is the guaranteed-to-work baseline — the system must be fully functional using only this method
- Form validation: required fields (passenger name, route, sale price, sale date) must be enforced before saving

### 4.2 Assisted Entry via Document Upload
- Agent can upload a GDS-generated e-ticket/itinerary PDF (or paste raw confirmation text) instead of typing everything manually
- System attempts to extract key fields (PNR, passenger name, route, flight number, date, price) from the uploaded document/pasted text
- **Extraction approach:** send the extracted document text to an LLM (e.g., via the Anthropic API) with a prompt instructing it to return structured JSON matching the sale record fields. This avoids needing to hand-write and maintain separate parsers for each GDS format (Amadeus, Sabre, Travelport/Galileo all format confirmations differently).
- Extracted data pre-fills the same manual entry form — **it must never auto-save without the agent reviewing and confirming the pre-filled fields first**
- If extraction fails or only partially succeeds, pre-fill whatever fields were successfully extracted and leave the rest blank for manual completion — the agent must never be blocked from completing a sale due to a parsing failure
- Supported input formats: PDF upload (primary), plain text paste (secondary)

### 4.3 Explicitly out of scope for this version
- Direct GDS API integration (Amadeus for Developers, Sabre APIs, Travelport APIs) — this requires GDS certification/partner agreements and should only be considered in a future phase once the core product is validated with real agencies
- Automatic booking or ticket issuance through the system — this system tracks sales, it does not book tickets

---

## 5. Owner Dashboard

### 5.1 End-of-Day View
- Total tickets sold today across all branches
- Total revenue and total profit/margin for the day
- Breakdown by branch → then by employee within each branch
- Flags/highlights for anything unusual: refunds, cancellations, unusually large sales

### 5.2 Drill-down navigation
- Owner can click into a branch to see that branch's employees and their individual sales
- Owner can click into an individual employee to see their full sales history

### 5.3 Live vs. summary
- Build as an auto-refreshing/near-real-time summary view rather than a fully live socket-based dashboard for v1 — simpler to build and sufficient for the "what's happening in my business today" need

---

## 6. Reporting

### 6.1 Report types
- **Daily** — covered by the end-of-day dashboard view
- **Monthly** — total sales, revenue, profit, broken down by branch and by employee
- **Yearly** — same metrics, plus a month-over-month trend view to show seasonality
- **Custom date range** — owner selects any start/end date and gets the same breakdown; this should be built as one generic, flexible report engine that daily/monthly/yearly views are simply presets of

### 6.2 Metrics per report
- Number of tickets sold
- Gross revenue (sum of sale prices)
- Total cost (sum of cost/net prices)
- Net profit/margin (revenue − cost)
- Average sale value
- Top-performing branch for the period
- Top-performing employee for the period
- Optionally: most-sold routes and airlines (useful for supplier negotiation)

### 6.3 Report grouping
- Reports must be filterable/groupable by: branch, employee, date range, route, airline

### 6.4 Export
- Reports must be exportable to PDF and/or Excel/CSV, since owners will use these for accounting and tax purposes

### 6.5 Visualization
- Summary cards for headline numbers (total revenue, total profit, tickets sold) for the selected period
- A trend chart (bar/line) showing the period-over-period breakdown (e.g., daily bars within a monthly view, monthly bars within a yearly view)
- A detailed table below the chart with the branch/employee breakdown

---

## 7. Non-Functional Requirements

- **Security:** Role-based access control must be strictly enforced at the API/database level, not just hidden in the UI — an employee's credentials must never be able to fetch another employee's or branch's data, even via direct API calls
- **Data integrity:** Sales should support soft status changes (cancelled/refunded/void) rather than hard deletion, to preserve audit history
- **Auditability:** Each sale record should track who created/last edited it and when
- **Scalability of design:** Even if launched for one agency, the schema should support multiple organizations (multi-tenancy) without redesign, in case this becomes a product sold to multiple agencies later

---

## 8. Suggested Tech Stack

(Matches existing development experience — adjust if Claude Code recommends otherwise for the specific implementation)

- **Frontend:** Next.js (React)
- **Backend:** Node.js
- **Database:** PostgreSQL
- **Authentication:** Role-based auth (JWT or session-based), with organization/branch/employee scoping enforced at the query level
- **Document extraction:** PDF text extraction + LLM-based structured extraction (Anthropic API) for the assisted entry feature
- **Hosting:** Standard cloud hosting (AWS-compatible, given existing AWS certification)

---

## 9. Suggested Build Order (Phased)

**Phase 1 — Foundation**
1. Database schema: organizations, branches, users (with roles), sales
2. Authentication and role-based access control
3. Manual sale entry form (Section 4.1) — full CRUD for an employee's own sales

**Phase 2 — Owner Visibility**
4. Owner dashboard with end-of-day summary (Section 5)
5. Drill-down views by branch and by employee

**Phase 3 — Reporting**
6. Generic date-range report engine (Section 6.1–6.3)
7. Report visualizations (cards, chart, table)
8. Export to PDF/Excel

**Phase 4 — Assisted Entry**
9. PDF upload and text extraction
10. LLM-based field extraction and form pre-fill (Section 4.2)

**Phase 5 — Future / Out of Scope for Now**
11. GDS mid-office/back-office feed integration (Amadeus, Sabre, Travelport) once a real agency partner and their specific GDS is identified
12. Notifications (WhatsApp/email digests)
13. Multi-currency and multi-payment-method support if targeting agencies handling cross-border transactions

---

## 10. Summary of Key Product Principles

- One shared sale form serves both manual and assisted entry — assisted entry only pre-fills it, never bypasses agent review
- Employees see only their own data; owners see everything, with drill-down by branch and employee
- Reports are built as one flexible, filterable engine — daily/monthly/yearly are just presets of the same underlying query
- The system tracks sales; it does not book tickets or replace the GDS itself
- Schema should assume multi-tenancy from day one, even if deployed for a single agency initially
