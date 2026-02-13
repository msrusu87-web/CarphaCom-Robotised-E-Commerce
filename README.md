# CarphaCom - E-Commerce Platform with AI Warehouse Digital Twin

> **Created by [Qubitpage](https://qubitpage.com)**

A full-stack e-commerce platform built with **Medusa v2**, featuring an AI-powered warehouse digital twin with autonomous robot orchestration. The platform includes a custom Next.js admin panel, a Next.js storefront, and a real-time warehouse simulation with 4 AGV robots.

![Medusa v2](https://img.shields.io/badge/Medusa-v2.13.1-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Storefront    │     │   Admin Panel    │     │  Warehouse Digital  │
│   (Next.js)     │     │   (Next.js)      │     │   Twin (Express)    │
│   Port: 8000    │     │   Port: 3000     │     │   Port: 4000        │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────────┘
         │                       │                         │
         └───────────┬───────────┘                         │
                     │                                     │
              ┌──────▼──────┐                              │
              │   Medusa    │◄─────────────────────────────┘
              │  Backend    │   (Warehouse Callback API)
              │  Port: 9000 │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐            ┌─────▼────┐
    │PostgreSQL│            │  Redis   │
    │  :5432   │            │  :6379   │
    └──────────┘            └──────────┘
```

## Features

### Storefront
- Product catalog with categories, search, and filters
- Shopping cart and checkout flow
- Multiple payment methods (PayU, bank transfer, cash on delivery)
- Customer accounts with order history
- Blog system with AI-generated content
- SEO optimized with sitemaps and meta tags
- Responsive design with Tailwind CSS

### Admin Panel
- **Dashboard** - Real-time KPIs, revenue charts, order statistics
- **Store Management** - Products, categories, orders, coupons, payments, shipping
- **CMS** - Blog posts, pages, media library, content automation
- **Marketing** - Email campaigns (Brevo), SMS campaigns, contact scraping
- **SEO** - Sitemaps, robots.txt, meta tags, Google Search Console integration
- **Security** - Vulnerability scanner, firewall monitoring, SSL checks
- **Google Integration** - Merchant Center, Analytics, Search Console, Ads
- **Invoicing** - Auto-generated invoices with e-Factura (Romanian e-invoicing) support
- **Supplier Management** - PNI B2B integration, product import/sync
- **User Management** - Roles, permissions, activity logs

### Warehouse Digital Twin
- **4 AGV Robots** with A* pathfinding algorithm
- **Real-time visualization** via Socket.IO
- **Autonomous order processing** pipeline:
  1. Order received → Robot dispatched to pick location
  2. Product picked → Robot navigates to packing station
  3. Packed → Fulfillment created → Shipment generated → AWB assigned
  4. Invoice auto-generated → Order marked complete
- **Gemini AI** integration for intelligent operations
- **NVIDIA Isaac Sim** compatible configuration

---

## Prerequisites

- **Node.js** >= 20.x
- **PostgreSQL** >= 16
- **Redis** >= 7
- **Yarn** or **npm**
- **PM2** (for production process management)
- **Nginx** (recommended for reverse proxy)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AkCoding/Carphatian-Ecommerce.git
cd Carphatian-Ecommerce
```

### 2. Set Up PostgreSQL

```bash
# Create database and user
sudo -u postgres psql
CREATE USER medusa WITH PASSWORD 'your_password';
CREATE DATABASE medusa_store OWNER medusa;
GRANT ALL PRIVILEGES ON DATABASE medusa_store TO medusa;
\q
```

### 3. Set Up Redis

```bash
# Install Redis
sudo apt install redis-server

# Set password in /etc/redis/redis.conf
# requirepass your_redis_password

sudo systemctl restart redis
```

### 4. Install & Configure Medusa Backend

```bash
cd medusa-backend

# Copy environment file
cp .env.example .env
# Edit .env with your credentials
nano .env

# Install dependencies
yarn install

# Run migrations and seed
npx medusa db:migrate
npx medusa db:seed

# Build the project
npx medusa build

# Start the server
npx medusa start
# Or with PM2:
pm2 start "npx medusa start" --name medusa-backend
```

The backend will run on `http://localhost:9000`.

### 5. Install & Configure Admin Panel

```bash
cd admin-panel

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your credentials
nano .env.local

# Install dependencies
npm install

# Build
npx next build

# Start
pm2 start "npx next start -p 3000" --name admin-panel
```

The admin panel will be available at `http://localhost:3000/app`.

### 6. Install & Configure Storefront

```bash
cd nextjs-storefront

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your credentials
nano .env.local

# Install dependencies
npm install

# Build
npx next build

# Start
pm2 start "npx next start -p 8000" --name storefront
```

The storefront will be available at `http://localhost:8000`.

### 7. Install & Configure Warehouse Orchestrator

```bash
cd warehouse-orchestrator

# Copy environment file
cp .env.example .env
# Edit .env with your credentials
nano .env

# Install dependencies
npm install

# Build
npx tsc

# Start
pm2 start "node dist/server.js" --name warehouse
```

The warehouse dashboard will be available at `http://localhost:4000`.

### 8. Nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Storefront
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin Panel
    location /app {
        proxy_pass http://localhost:3000/app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Medusa API
    location /store {
        proxy_pass http://localhost:9000/store;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /admin {
        proxy_pass http://localhost:9000/admin;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /auth {
        proxy_pass http://localhost:9000/auth;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Warehouse (WebSocket support required)
    location /warehouse {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## Project Structure

```
carphacom/
├── medusa-backend/          # Medusa v2 backend (API, modules, jobs)
│   ├── src/
│   │   ├── api/             # Custom API routes
│   │   │   ├── admin/       # Admin-specific endpoints
│   │   │   └── warehouse-callback/ # Warehouse → order lifecycle
│   │   ├── jobs/            # Scheduled jobs (PNI sync)
│   │   ├── modules/         # Custom Medusa modules
│   │   │   └── pni/         # PNI B2B supplier integration
│   │   └── lib/             # Shared utilities
│   └── medusa-config.ts     # Medusa configuration
│
├── admin-panel/             # Custom Next.js Admin Panel
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/     # Admin pages (dashboard, store, CMS, etc.)
│   │   │   ├── api/         # Internal API routes
│   │   │   └── login/       # Authentication
│   │   ├── components/      # Shared components (sidebar, modals)
│   │   └── lib/             # Services (email, invoice, marketing)
│   └── data/                # JSON data storage (invoices, settings)
│
├── nextjs-storefront/       # Customer-facing storefront
│   ├── src/
│   │   ├── app/             # Pages (home, products, checkout, blog)
│   │   ├── modules/         # Feature modules (cart, checkout, products)
│   │   └── lib/             # Data fetching, utilities
│   └── public/              # Static assets
│
└── warehouse-orchestrator/  # AI Warehouse Digital Twin
    ├── src/
    │   ├── server.ts        # Express + Socket.IO server
    │   └── warehouse.ts     # Robot orchestration, A* pathfinding
    ├── public/              # Real-time dashboard UI
    └── isaac-sim/           # NVIDIA Isaac Sim configuration
```

---

## Environment Variables

Each component requires its own environment file. See the `.env.example` files in each project directory for all available options.

| Component | File | Key Variables |
|-----------|------|---------------|
| Medusa Backend | `.env` | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET` |
| Admin Panel | `.env.local` | `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `DB_PASSWORD`, `GOOGLE_*` |
| Storefront | `.env.local` | `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |
| Warehouse | `.env` | `GEMINI_API_KEY`, `DATABASE_URL`, `MEDUSA_URL` |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Medusa v2.13.1, Node.js, TypeScript |
| Admin Panel | Next.js 15, React, Tailwind CSS, Chart.js |
| Storefront | Next.js 15, React, Tailwind CSS |
| Warehouse | Express.js, Socket.IO, Gemini AI |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Process Manager | PM2 |
| Email | Brevo (Sendinblue) |
| Payments | PayU, Bank Transfer, Cash on Delivery |
| AI | Google Gemini (warehouse operations) |

---

## Development

```bash
# Start all services in development mode
cd medusa-backend && npx medusa develop &
cd admin-panel && npm run dev &
cd nextjs-storefront && npm run dev &
cd warehouse-orchestrator && npx ts-node src/server.ts &
```

---

## Deployment

For production deployment, we recommend:

1. **VPS** with at least 4GB RAM
2. **Nginx** as reverse proxy with SSL (Let's Encrypt)
3. **PM2** for process management
4. **PostgreSQL** and **Redis** on the same server or managed services

```bash
# Quick deploy with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## License

This project is open source. See individual component licenses.

---

## Credits

**Created by [Qubitpage](https://qubitpage.com)**

Built with [Medusa](https://medusajs.com) - Open Source Commerce Platform
