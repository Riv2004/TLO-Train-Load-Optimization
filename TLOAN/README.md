# TLO - Train Load Optimization

Migrated to **.NET 8 Web API** + **Angular 17** + **SQL Server** (via SSMS).

## Solution Structure

| Project | Location | Purpose |
|---------|----------|---------|
| `TLO.Api` | `/TLO.Api/` | .NET 8 Web API backend |
| `TLO.Tests` | `/TLO.Tests/` | xUnit test project |
| `TLO.Client` | `/TLO.Client/` | Angular 17 frontend |
| `sql/` | `/server/sql/` | Instructor SQL adapted for EF Core |

## Prerequisites

- **Visual Studio Enterprise 2022** (with .NET 8 workload)
- **SQL Server** + **SSMS** (Microsoft SQL Server Management Studio)
- **Node.js** 18+ and Angular CLI (`npm install -g @angular/cli`)
- **bcrypt** NuGet package (included in `TLO.Api.csproj`)

## Backend Setup (.NET 8 + SQL Server)

### 1. Open in Visual Studio

Open `TLO.sln` in Visual Studio Enterprise.

### 2. Configure Connection String

Edit `TLO.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=TLO;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Use your SQL Server instance name (e.g. `localhost`, `.\SQLEXPRESS`, or your machine name).

### 3. Apply EF Core Migrations

In Visual Studio **Package Manager Console** (Tools → NuGet Package Manager → Package Manager Console), set **Default project: TLO.Api**, then run:

```
Add-Migration InitialCreate
Update-Database
```

This creates all tables: Destinations, Users, Locomotives, Railcars, Wells, Slots, Containers, LoadPlans, Assignments.

### 4. Apply Instructor SQL

Open `server/sql/InstructorSql_AdaptedForEfCore.sql` in **SSMS**, connect to your SQL Server, select the `TLO` database, and **Execute (F5)**. This adds:

- Indexes on Containers and Railcars
- Stored procedure `usp_GetEligibleContainers(@DestinationID)`
- View `vw_LoadPlanSummary`
- Seed data (5 destinations, 9 locomotives, 25 railcars, 80 containers, admin+planner users)
- ACID rollback demo

Run this **after** `Update-Database`.

### 5. Run the API

Press **F5** in Visual Studio, or run:

```
dotnet run --project TLO.Api
```

Swagger UI is available at `http://localhost:5000/` (or `https://localhost:5001/`).

## Frontend Setup (Angular)

### 1. Install dependencies

```bash
cd TLO.Client
npm install
```

### 2. Run

```bash
ng serve
```

Frontend runs at `http://localhost:4200` and proxies to the API at `http://localhost:5000`.

### 3. Login

Default credentials:
- **admin** / `admin123` — full access (master data CRUD, reset)
- **planner** / `planner123` — optimization and dashboard access

## API Endpoints (Swagger UI)

All endpoints require JWT Bearer token (except `POST /api/auth/login`).

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/login` | all | Authenticate, returns JWT |
| GET | `/api/auth/me` | all | Current user |
| GET | `/api/destinations` | all | List destinations |
| POST | `/api/destinations` | admin | Create destination |
| PUT | `/api/destinations/{id}` | admin | Update destination |
| DELETE | `/api/destinations/{id}` | admin | Delete destination |
| GET | `/api/locomotives` | all | List locomotives |
| POST | `/api/locomotives` | admin | Create locomotive |
| PUT | `/api/locomotives/{id}` | admin | Update locomotive |
| DELETE | `/api/locomotives/{id}` | admin | Delete locomotive |
| GET | `/api/railcars?destId=` | all | List railcars |
| POST | `/api/railcars` | admin | Create railcar |
| PUT | `/api/railcars/{id}` | admin | Update railcar |
| DELETE | `/api/railcars/{id}` | admin | Delete railcar |
| GET | `/api/containers?destId=` | all | List containers |
| POST | `/api/containers` | admin | Create container |
| PUT | `/api/containers/{id}` | admin | Update container |
| DELETE | `/api/containers/{id}` | admin | Delete container |
| POST | `/api/plans/optimize` | planner/admin | Run greedy optimization |
| POST | `/api/plans` | planner/admin | Save a plan |
| GET | `/api/plans` | planner/admin | List all plans |
| GET | `/api/plans/{id}` | planner/admin | Get plan by ID |
| GET | `/api/dashboard` | all | KPI dashboard data |
| GET | `/api/dashboard/charts/*` | all | Chart data |
| POST | `/api/reset` | admin | Reset yard to initial state |

## Database Schema

Core entities (EF Core Code First):

- **Destinations** — destId (PK), name
- **Users** — username (PK), role, salt, hash
- **Locomotives** — locoId (PK), railLine, orientation (H/V), x, y, status, destId (FK)
- **Railcars** — railCarId (PK), type (A/B), weight, status, destId (FK)
- **Wells** — wellId (PK), railCarId (FK), maxLengthFt, weightLimit
- **Slots** — slotId (PK), wellId (FK), slotType (BOTTOM/TOP), x, y
- **Containers** — containerId (PK), sizeFt, weight, x, y, yardTier, zoneId, priority, status, destId (FK)
- **LoadPlans** — planId (PK), createdAt, createdBy, destId, locoId, railLine, JSON columns
- **Assignments** — assignmentId (PK), planId (FK), containerId, railCarId, wellId, slotId, scores

## Hard Rules (R1-R7)

- R1: Container weight ≤ well weight limit (70,000 lb)
- R2: Container length ≤ well max length (40 ft)
- R3: TOP slot requires BOTTOM slot filled first
- R4: Container must be Available
- R5: Container and railcar must match plan destination
- R6: Railcar must be Available (not LOADED)
- R7: Combined well + railcar weight limits

## Optimization Algorithm

Greedy Next Best Executable Crane Move:
- Score = 40×priority + 20×utilization − 1.5×(travel + dig + reposition + zone)
- Penalties: dig-out (6/blocker), reposition (2/unit distance), zone-hop (3/zone change)
- Crane fixed at origin (0,0); 9 orthogonal rail lines (1-5 vertical, 6-9 horizontal)
- Railcars packed cumulatively by physical length (A=2, B=4 units)

## Running Tests

```
dotnet test TLO.Tests
```

## Files Created

This is a fresh implementation — all files are new. Key files:

- `TLO.Api/Program.cs` — DI, JWT auth, Swagger, CORS, middleware
- `TLO.Api/Data/TloDbContext.cs` — EF Core DbContext with all entities
- `TLO.Api/Data/SeedDatabase.cs` — Seeds 5 destinations, 9 locos, 25 railcars, 80 containers, users
- `TLO.Api/Services/PlanService.cs` — Optimization engine (ported from Node.js)
- `TLO.Api/Controllers/*` — All REST controllers with Swagger annotations
- `TLO.Client/src/app/` — Angular frontend (login, master-data, optimization, load-plan, kpi-dashboard, admin)
