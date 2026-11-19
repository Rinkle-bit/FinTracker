# FinTrack — Smart Personal Finance Operating System

FinTrack is an intelligent personal-finance platform built with **React 18, Vite, Recharts, Express, JWT, and Supabase (PostgreSQL)** with seamless zero-config fallback for local development.

Unlike traditional generic trackers that merely show where money was spent in the past, FinTrack functions as a **proactive financial co-pilot** that helps users make confident decisions before spending.

---

## 🚀 What Makes FinTrack Different? (Key Innovations)

### 1. ✦ Predictive "Safe-to-Spend" Daily Gauge & Burn Rate
* **Dynamic Daily Allowance:** Calculates exactly how much discretionary money you can safely spend today based on your income, committed recurring bills, and savings goal targets:
  $$\text{Daily Safe Spend} = \frac{\text{Discretionary Pool} - \text{Discretionary Spent}}{\text{Days Left in Month}}$$
* **Visual Pace Arc:** Instant visual feedback (Healthy, Warning, or Overdrawn) so you know your financial runway each morning.

### 2. ✦ Natural Language Smart Quick-Add Bar
* Type everyday sentences like:
  * *"Dinner with team 1450"* $\rightarrow$ Auto-extracts Title: "Dinner with team", Amount: ₹1,450, Category: "Food", Type: "Expense", Date: Today.
  * *"Salary credited 65000"* $\rightarrow$ Auto-extracts Category: "Salary", Type: "Income".
  * *"Uber to airport 450 yesterday"* $\rightarrow$ Auto-detects yesterday's date.
* Live chip previews and 1-key addition (`Enter ↵`) with zero tedious modal clicking.

### 3. ✦ Bank SMS & Receipt Scanner
* Paste debit alerts from banks (HDFC, SBI, ICICI, Axis, UPI) or text invoices.
* Automatically parses merchant, transaction amount, date, and categorizes without manual typing.

### 4. ✦ 48-Hour "Anti-Impulse" Cooling Chamber
* Behavioral economics feature designed to curb impulse shopping.
* Locks desired items into a 48-hour cool-down period.
* Calculates the **Opportunity Cost**:
  * **Labor Hours:** Tells you how many hours of work the item actually costs based on your income.
  * **Savings Impact:** Shows how much it delays your active milestones.
* Tracks all money successfully saved when you resist an impulse purchase!

### 5. ✦ Day-by-Day Interactive Financial Calendar
* Complete monthly ledger calendar mapping income arrivals and expense clusters by date.

### 6. ✦ Cloud Backend (Supabase PostgreSQL) + Instant Local Demo
* **Logged-in Users:** Transactions, budgets, goals, and recurring items sync to Supabase PostgreSQL via JWT authentication.
* **Guest / Demo Mode:** Anyone can instantly explore the app with pre-seeded data using browser `localStorage` without setup.

---

## Tech Stack

- **Frontend:** React 18, Vite, Recharts, Lucide Icons, Modern CSS Design System (Dark & Light themes)
- **Backend:** Node.js, Express, `@supabase/supabase-js`, JWT, bcryptjs
- **Database:** Supabase (PostgreSQL with Row Level Security & Indexes)

---

## ⚡ Connecting to Supabase (3 Simple Steps)

### Step 1: Run the Database Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project (e.g. `fintrack`).
3. In the left navigation, click **SQL Editor** $\rightarrow$ **New query**.
4. Copy the entire contents of [`supabase_schema.sql`](./supabase_schema.sql) and click **Run**.
   *(This creates the `users`, `transactions`, `budgets`, `goals`, `recurring`, and `impulses` tables with indexes and security policies).*

### Step 2: Configure Backend Environment
1. In your Supabase Dashboard, go to **Project Settings** $\rightarrow$ **API**.
2. Copy your **Project URL** and **service_role key** (or anon key).
3. Open `FinTrack/backend/.env` and paste:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=super_secure_jwt_secret_key

   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-service-role-or-anon-key
   ```

### Step 3: Run FinTrack
In terminal 1 (Backend):
```bash
cd backend
npm install
npm run dev
```
Terminal will print:
`Connected to Supabase PostgreSQL database.`

In terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## API Endpoints

- `POST /api/auth/register` — Register new user in Supabase
- `POST /api/auth/login` — Authenticate user (returns JWT token)
- `GET /api/transactions` — Fetch user transactions (filterable by `?month=YYYY-MM`)
- `POST /api/transactions` — Add single transaction
- `POST /api/transactions/bulk` — Bulk import transactions (e.g., CSV imports)
- `DELETE /api/transactions/:id` — Delete transaction
- `GET /api/budgets` — Fetch category budgets
- `POST /api/budgets` — Upsert category budget limit
- `DELETE /api/budgets/:category` — Delete category budget
- `GET /api/goals` — Fetch savings goals
- `POST /api/goals` — Create savings goal
- `PATCH /api/goals/:id` — Update saved amount or goal target
- `DELETE /api/goals/:id` — Delete savings goal
- `GET /api/recurring` — Fetch recurring items
- `POST /api/recurring` — Create recurring item
- `DELETE /api/recurring/:id` — Delete recurring item
- `GET /api/health` — System status and Supabase connection indicator
