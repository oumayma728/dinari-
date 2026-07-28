# Dinari 💸

A personal finance tracker PWA built for Tunisian users. Installable on iPhone via Safari → Add to Home Screen. All data stored locally on device — no account, no server.

---

## Features

### 🏠 Home
- Balance card: **Salary** + **Carryover from last month** = Total Balance (tap any number to edit inline)
- **Planned remaining** — balance minus active category budgets and saved goal amounts
- **Actual remaining** — real balance after income/expense transactions this month
- Active categories list with budget vs spent + progress bar
- Last 5 transactions this month
- 🔥 **Streak counter** — consecutive days with a logged transaction

### 💸 Transactions
- Full history with month filter, filter by All / Income / Expenses
- Monthly totals (in / out)
- Add, edit, delete transactions (amount, type, description, date, category)

### 🏷️ Categories
- Add categories with name, emoji, type (Fixed / Variable / One-time), and budget
- Tick/untick active this month
- Expand to edit budget, priority (slider), type, or delete
- Sorted by priority on home screen

### 🎯 Saving Goals
- Create goals with name, emoji, target amount, and optional deadline
- SVG progress circle with % + monthly/weekly saving needed auto-calculated
- Deadline countdown badge, edit saved amount anytime

### ❤️ Wishlist
- Groups with items (name + optional price)
- Tick items as bought
- **🎯 Goal button** — converts any priced item into a saving goal in one tap

### 🤖 AI Advisor
- Chat interface with voice input (iOS Safari compatible)
- AI has full context: balance, categories, goals, wishlist, recent transactions
- Responds in **Tunisian Darija + French/English** mix
- Chat history persists across sessions
- Quick suggestion prompts on empty state

### ⚙️ Settings
- Edit name, reset all data

---

## Stack

- **Next.js 14** App Router + TypeScript
- **Groq API** (llama-3.3-70b) — server-side only, key never exposed to browser
- **localStorage** for all data (`dinari_v4`)
- **next-pwa** — installable on iPhone via Safari
- Pink theme `#C4607A`, mobile-first (max-width 430px)
