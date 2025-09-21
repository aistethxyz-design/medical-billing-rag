# AISteth Manual Setup Guide

If the automated setup scripts are not working, follow these manual steps:

## Prerequisites
- Node.js 20 LTS installed
- npm available

## Step 1: Install Root Dependencies
```bash
npm install
```

## Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
npm install @tailwindcss/typography @tailwindcss/forms @tanstack/react-query @vitejs/plugin-react-swc
cd ..
```

## Step 3: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

## Step 4: Setup Prisma (WASM Engine for ARM64)
```bash
cd backend
set PRISMA_CLIENT_ENGINE_TYPE=wasm
npx prisma generate
npx prisma db push --accept-data-loss
cd ..
```

## Step 5: Start the Application
```bash
set PRISMA_CLIENT_ENGINE_TYPE=wasm
npm run dev
```

## Troubleshooting

### If you get a blank white screen:
1. Open browser developer tools (F12)
2. Check the Console tab for errors
3. Check the Network tab for failed requests

### Common Issues:

#### Frontend Issues:
- Missing dependencies: Run `cd frontend && npm install` again
- Vite build errors: Check if all dependencies are installed
- React errors: Check browser console for specific error messages

#### Backend Issues:
- Prisma engine errors: Make sure `PRISMA_CLIENT_ENGINE_TYPE=wasm` is set
- Database connection errors: Run `npx prisma db push` again
- Port conflicts: Check if port 3001 is available

#### Windows ARM64 Specific:
- Use WASM engine for Prisma: `set PRISMA_CLIENT_ENGINE_TYPE=wasm`
- If native engine fails, regenerate client: `npx prisma generate`

## Demo Login
- Email: demo@aisteth.com
- Password: demo123

## URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:3001 