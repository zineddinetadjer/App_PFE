# InsightFlow - AI Social Listening & Analytics Platform

InsightFlow is an advanced social listening and AI analytics platform designed as a university graduation project (PFE). It combines automated Selenium scrapers, Natural Language Processing (NLP) models, and a modern, high-performance Next.js dashboard.

---

## 🚀 Key Features

1. **Automation Scrapers:** Automated, headless Selenium scrapers (Reddit, Twitter/X, Google News) with proxy headers, anti-bot mechanisms, dynamic scrolling, and automatic mock fallback mode.
2. **AI NLP Engine:** Sentiment classification (Positive, Neutral, Negative) using **TextBlob**, topic clustering, keyword extraction, and temporal frequency parsing.
3. **Interactive SaaS Dashboard:** Premium analytics dashboard featuring area, pie, and bar charts using **Recharts**, and an AI-generated executive report summary box.
4. **SaaS Reports:** Print-optimized, clean summary layouts suitable for executive export.
5. **Secure Authentication:** User signup and email-credentials signin powered by **NextAuth/Auth.js** and **Bcryptjs**.

---

## 🛠️ Tech Stack

- **Frontend & Backend:** Next.js 16 (App Router), TypeScript, TailwindCSS, Lucide Icons, Zustand.
- **Database ORM:** Prisma Client, LibSQL / SQLite driver adapter.
- **Visualization:** Recharts.
- **Python Backend Scripts:** Python 3.x, Selenium WebDriver, TextBlob NLP, Pandas, Numpy.

---

## 💻 System Installation

### 1. Clone & Next.js Setup

Navigate to your workspace directory and verify npm dependencies are configured:

```bash
# Install Node dependencies
npm install
```

### 2. Configure Environment

Copy the `.env.example` file and create a `.env` file in the root folder:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` is set to `"file:./dev.db"`. Set a custom secure string for `NEXTAUTH_SECRET`.

### 3. Database Migration

Sync your Prisma schema with the SQLite backend:

```bash
npx prisma db push
npx prisma generate
```

### 4. Setup Python Virtual Environment

Ensure Python 3 is installed on your system. Run these commands from the root directory:

```bash
# If the virtual environment is not active, activate it:
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Install requirements
pip install -r python/requirements.txt
```

Verify that NLTK tokenizers are downloaded within the environment:

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"
```

---

## 🏃 Running the Application

1. Spin up the Next.js development server:

```bash
npm run dev
```

2. Open browser page: **[http://localhost:3000](http://localhost:3000)**.
3. **Register** a new account, then **Login**.
4. Go to **Projects** and click **Add Project** to configure your keywords (e.g. keyword: `InsightFlow`, topic: `Social Listening`).
5. Open the **Scraper Module**, check the options (e.g. check "Mock Mode" for instant captcha-free demo runs), and click **Launch Scrapers**.
6. View live logs in the console terminal. Once completed, navigate to **Dashboard** or **SaaS Reports** to view your charts and AI summaries!
