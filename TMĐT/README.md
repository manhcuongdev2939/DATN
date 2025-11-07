# Ecommerce (React + Tailwind + Node.js)

Structure:
- frontend: React + Tailwind + Vite
- backend: Node.js Express API

Run frontend:
- cd TMĐT/frontend
- npm install
- npm run dev

Run backend:
- cd TMĐT/backend
- npm install
- npm start

Endpoints:
- Frontend dev: http://localhost:5173
- Backend health: http://localhost:3001/api/health

Note: If PowerShell has issues with accented paths, run commands in Command Prompt (cmd).

MySQL setup:
- Create DB and a table products(id INT PK AI, name VARCHAR(255), price INT, brand VARCHAR(100)).
- Copy TMĐT/backend/ENV_EXAMPLE.txt to .env and fill credentials.
- Endpoint: GET http://localhost:3001/api/products to fetch products from MySQL.

Brands data:
- Seed: run SQL in TMĐT/backend/sql/seed_brands.sql on your MySQL database.
- List all brands: GET http://localhost:3001/api/brands
- Filter by category: GET http://localhost:3001/api/brands?category=laptop or category=phone
- Or path form: GET http://localhost:3001/api/brands/laptop  (or /phone)

Products on homepage:
- Seed data: run SQL in TMĐT/backend/sql/seed_products.sql
- Start backend first, then run frontend; homepage Featured section will fetch from http://localhost:3001/api/products
