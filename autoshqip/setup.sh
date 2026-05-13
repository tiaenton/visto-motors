#!/bin/bash
set -e

echo "🚗 AutoShqip — Setup Script"
echo "================================"

echo ""
echo "1. Starting Docker services (PostgreSQL + Redis)..."
docker-compose up -d
sleep 3

echo ""
echo "2. Installing backend dependencies..."
cd backend
npm install

echo ""
echo "3. Setting up backend environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   ⚠️  Created backend/.env — fill in your API keys before continuing!"
fi

echo ""
echo "4. Generating Prisma client..."
npx prisma generate

echo ""
echo "5. Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "6. Seeding database with demo data..."
npx tsx prisma/seed.ts

echo ""
echo "7. Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "8. Setting up frontend environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "   ⚠️  Created frontend/.env.local — add your Stripe publishable key!"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Demo accounts:"
echo "  Admin:  admin@autoshqip.al / admin123"
echo "  Dealer: dealer@test.com / dealer123"
echo ""
echo "To start the app, open 2 terminals:"
echo ""
echo "  Terminal 1 (backend):"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 (frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo "================================"
