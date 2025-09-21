# Dynamic Premium Simulator (React + .NET)

Full-stack demo showing how lifestyle & telematics metrics impact an insurance premium in real time.

- Frontend: React + Vite + Tailwind (dark/light), Recharts, PDF export
- Backend: .NET 9 minimal APIs, EF Core, SQL Server (Docker), Identity + JWT
- Payments: Stripe (test)

## Dev quickstart
1) Start SQL Server container (see docs/ or README comments).
2) Export env vars in the API terminal:
   - DB_CONN
   - JWT_SIGNING_KEY (>= 32 bytes)
   - STRIPE_SECRET / STRIPE_PUBLISHABLE (optional)
3) Run API: `ASPNETCORE_URLS=http://localhost:5000 dotnet run --project src/api --no-launch-profile`
4) Run web: `cd web && pnpm dev` and open http://localhost:5173

## Env
Copy `web/.env.example` to `web/.env` and fill your values.
