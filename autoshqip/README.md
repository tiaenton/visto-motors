# AutoShqip — Albanian Car Marketplace

Full-stack car marketplace platform for Albania. Built with Node.js + Express backend and Next.js frontend.

## Stack
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM, Redis, JWT auth
- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
- **Payments**: Stripe (subscriptions + one-time boosts)
- **Storage**: Cloudflare R2 (or AWS S3)
- **Infra**: Docker Compose

---

## Quick Start (Local)

### 1. Prerequisites
- Node.js 20+
- Docker + Docker Compose
- A Stripe account (free)

### 2. Clone & install
```bash
git clone <your-repo>
cd autoshqip

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 3. Environment variables
```bash
# Backend
cp backend/.env.example backend/.env
# Fill in your values (see below)

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 4. Start database
```bash
docker-compose up -d
```

### 5. Run migrations
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 6. Start both servers
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:3000

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://autoshqip:password@localhost:5432/autoshqip
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=autoshqip-images
R2_PUBLIC_URL=https://your-bucket.r2.dev
FRONTEND_URL=http://localhost:3000
EMAIL_FROM=noreply@autoshqip.al
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
NODE_ENV=development
PORT=4000
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Project Structure
```
autoshqip/
├── backend/
│   ├── src/
│   │   ├── routes/         # Express routes
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, rate limit, upload
│   │   ├── models/         # Prisma models (in prisma/schema.prisma)
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # API client, utils
│   │   └── hooks/          # React hooks
│   └── package.json
├── infra/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Team Responsibilities
| Area | Owner |
|------|-------|
| Backend API, Auth, Payments, Security | Cybersecurity dev |
| Frontend UI, Search, Recommendations, SEO | Data scientist |

## Deployment
See `infra/` folder for nginx config. Deploy backend to Railway/Render, frontend to Vercel.
