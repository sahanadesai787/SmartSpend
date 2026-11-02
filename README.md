# SmartSpend – Personal Expense Analyzer

A multi-user personal finance application built with Java 17, Spring Boot, PostgreSQL, React and Vite.

## Features
- User registration and login with JWT authentication
- BCrypt password hashing
- User-isolated income and expense records
- Add, edit and delete transactions
- Dashboard totals: income, expenses and balance
- Monthly transaction list and category breakdown
- Responsive premium green-and-white interface

## Requirements
- Java 17+
- Node.js 20+
- PostgreSQL 14+
- Maven (or use the included Maven wrapper if added by your environment)

## 1. Database
Create a PostgreSQL database:

```sql
CREATE DATABASE smartspend_db;
```

## 2. Backend configuration
Set these environment variables before starting the backend:

Windows PowerShell:
```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/smartspend_db"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_postgres_password"
$env:JWT_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
```

Windows CMD:
```cmd
set DB_URL=jdbc:postgresql://localhost:5432/smartspend_db
set DB_USERNAME=postgres
set DB_PASSWORD=your_postgres_password
set JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
```

Linux/macOS:
```bash
export DB_URL=jdbc:postgresql://localhost:5432/smartspend_db
export DB_USERNAME=postgres
export DB_PASSWORD=your_postgres_password
export JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
```

Then run:
```bash
cd backend
mvn spring-boot:run
```
Backend: http://localhost:8080

For local development only, the default JWT secret is supplied in `application.properties`. Replace it for any deployment.

## 3. Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

The Vite development server proxies `/api` requests to the backend.

## 4. First use
1. Open http://localhost:5173
2. Register with your name, email and password (minimum 8 characters).
3. Sign in.
4. Add income and expense transactions.

## API overview
- `POST /api/auth/register` – create account
- `POST /api/auth/login` – sign in
- `GET /api/auth/me` – current user (JWT required)
- `GET /api/transactions` – list current user's transactions
- `POST /api/transactions` – create transaction
- `PUT /api/transactions/{id}` – update own transaction
- `DELETE /api/transactions/{id}` – delete own transaction
- `GET /api/dashboard/summary` – dashboard totals for current user

## Security notes
- Passwords are hashed using BCrypt.
- JWT is required for protected endpoints.
- Every transaction query is scoped to the authenticated user on the server.
- Never commit real database passwords or production JWT secrets.
- Before public deployment, configure HTTPS, a strong JWT secret, managed PostgreSQL, backups, rate limiting and email-based password reset.
