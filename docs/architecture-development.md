# AI Question Generator - Development Workflow & Deployment

## Development Workflow

### Local Development Setup

**Prerequisites:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git >= 2.30.0
- Vercel CLI >= 32.0.0

**Initial Setup:**
```bash
# Clone repository
git clone https://github.com/your-org/ai-question-generator.git
cd ai-question-generator

# Install dependencies
npm install

# Copy environment files
cp .env.example .env.local

# Start development servers
npm run dev
```

**Development Commands:**
```bash
# Start all services (frontend + backend)
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Build all packages
npm run build

# Run type checking
npm run type-check

# Run E2E tests
npm run test:e2e
```

### Monorepo Structure

```
ai-question-generator/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yml             # Continuous Integration
│       ├── deploy-preview.yml # Preview deployments
│       └── deploy-prod.yml    # Production deployments
├── apps/                       # Application packages
│   └── web/                    # Frontend application (React)
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       └── package.json
├── infrastructure/             # IaC definitions
│   ├── vercel.json
│   └── supabase/
├── scripts/                    # Build/deploy scripts
│   ├── build.sh
│   ├── deploy.sh
│   └── test.sh
├── docs/                       # Documentation
├── .env.example                # Environment template
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json                # Root package.json
├── turbo.json                  # Turborepo configuration
├── tsconfig.json               # TypeScript configuration
└── README.md
```

### Turborepo Configuration

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### Environment Configuration

```bash
# .env.example
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
VITE_APP_URL=http://localhost:5173
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=application/pdf
DEFAULT_QUESTION_COUNT=10
MAX_QUESTION_COUNT=50

# Development Configuration
NODE_ENV=development
VITE_VERCEL_ENV=development
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
        env:
          NODE_ENV: test
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BROWSERS_PATH: 0
```

### Preview Deployment

```yaml
# .github/workflows/deploy-preview.yml
name: Deploy Preview

on:
  pull_request:
    branches: [main]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Production Deployment

```yaml
# .github/workflows/deploy-prod.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
        env:
          NODE_ENV: test
      
      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL_PROD }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_PROD }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_PROD }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **CDN/Edge:** Vercel Global Edge Network

**Backend Deployment:**
- **Platform:** Vercel Functions
- **Build Command:** `npm run build`
- **Deployment Method:** Serverless Functions (Edge Runtime)

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:5173 | http://localhost:5173/api | Local development |
| Preview | https://ai-qg-git-feature.vercel.app | https://ai-qg-git-feature.vercel.app/api | Feature branch testing |
| Production | https://ai-question-generator.vercel.app | https://ai-question-generator.vercel.app/api | Live environment |

### Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "apps/web/src/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "apps/web/$1"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "OPENAI_API_KEY": "@openai_api_key"
  },
  "functions": {
    "apps/web/src/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Supabase Configuration

```sql
-- Database setup script
-- Run this in Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (as defined in database schema)
-- ... (table creation scripts)

-- Set up RLS policies
-- ... (RLS policy scripts)

-- Create database functions
-- ... (function scripts)
```

## Development Tools and Scripts

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "db:generate": "supabase gen types typescript --local > packages/shared/src/types/database.ts",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db seed",
    "deploy:preview": "vercel --target preview",
    "deploy:prod": "vercel --target production"
  }
}
```

### Development Scripts

```bash
#!/bin/bash
# scripts/setup.sh - Initial project setup

echo "Setting up AI Question Generator..."

# Install dependencies
npm install

# Copy environment files
cp .env.example .env.local

# Generate database types
npm run db:generate

# Start development server
npm run dev
```

```bash
#!/bin/bash
# scripts/deploy.sh - Deployment script

echo "Deploying to Vercel..."

# Build application
npm run build

# Deploy to Vercel
vercel --prod

echo "Deployment complete!"
```

## Code Quality and Standards

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
};
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./apps/web/src/*"],
      "@/components/*": ["./apps/web/src/components/*"],
      "@/services/*": ["./apps/web/src/services/*"],
      "@/types/*": ["./packages/shared/src/types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "vite-env.d.ts"],
  "exclude": ["node_modules"]
}
```

## Monitoring and Observability

### Vercel Analytics

```typescript
// apps/web/src/main.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <Router />
      <Analytics />
    </>
  );
}
```

### Custom Error Tracking

```typescript
// apps/web/src/utils/errorTracking.ts
export class ErrorTracker {
  static trackError(error: Error, context?: Record<string, any>) {
    console.error('Error tracked:', error, context);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, LogRocket, or similar
    }
  }
  
  static trackEvent(event: string, properties?: Record<string, any>) {
    console.log('Event tracked:', event, properties);
    
    // Track custom events
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
    }
  }
}
```

## Database Management

### Migration Scripts

```bash
#!/bin/bash
# scripts/migrate.sh - Database migration script

echo "Running database migrations..."

# Generate types from current schema
npm run db:generate

# Apply migrations
supabase db push

echo "Migrations complete!"
```

### Seed Data

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedDatabase() {
  // Insert seed data
  const { error } = await supabase
    .from('users')
    .insert([
      {
        email: 'test@example.com',
        role: 'teacher',
      },
    ]);

  if (error) {
    console.error('Seed error:', error);
  } else {
    console.log('Database seeded successfully');
  }
}

seedDatabase();
```
