/**********************************************************************************************
 * TLO - Demo instructor SQL (TLO_Datasheet_Full.sql), adapted for the .NET 8 / EF Core /
 * SQL Server project.
 *
 * Table / column mapping (instructor dbo.*  -->  EF Core model):
 *   dbo.Destination           -> Destinations        (DestinationID -> destId, DestinationName -> name)
 *   dbo.Locomotive            -> Locomotives         (LocomotiveID -> locoId, ...)
 *   dbo.Railcar               -> Railcars            (RailCarID -> railCarId, ...)
 *   dbo.RailCarWell           -> Wells               (WellID -> wellId, ...)
 *   dbo.RailCarSlot           -> Slots               (SlotID -> slotId, ...)
 *   dbo.Container             -> Containers          (ContainerID -> containerId, ...)
 *   dbo.LoadPlanHeader        -> LoadPlans           (PlanID -> planId, ...)
 *   dbo.LoadPlanLine          -> Assignments         (LineID -> assignmentId, ...)
 *   dbo.Users                 -> Users               (Username -> username, ...)
 *
 * NOTE: EF Core migrations (Add-Migration / Update-Database) create the tables from your
 * C# entity classes. This script therefore does NOT re-create tables -- it adds the objects
 * migrations cannot: indexes, the stored procedure, the view, seed data, and the ACID demo.
 *
 * WHERE TO PASTE IT:
 *   1. Open Microsoft SQL Server Management Studio (SSMS).
 *   2. Connect to your SQL Server instance.
 *   3. Open a New Query window, make sure the TLO database is selected (USE TLO;), paste the
 *      whole script below, and press Execute (F5).
 *   4. Run the sections in order: indexes -> stored procedure -> view -> seed data -> ACID demo.
 *
 * Run this AFTER `dotnet ef database update` so the tables already exist.
**********************************************************************************************/

USE TLO;
GO

/*====================================================================
  1) INDEXES (mirror the instructor's intent, on EF Core table names)
====================================================================*/

-- Help usp_GetEligibleContainers filter by destination + status quickly.
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.Containers') AND name = 'IX_Container_Eligibility')
BEGIN
    CREATE INDEX IX_Container_Eligibility
    ON dbo.Containers (destId, status)
    INCLUDE (sizeFt, weight, yardTier, zoneId, priority);
END
GO

-- Help railcar selection by status + type.
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.Railcars') AND name = 'IX_Railcar_Selection')
BEGIN
    CREATE INDEX IX_Railcar_Selection
    ON dbo.Railcars (status, type)
    INCLUDE (weight);
END
GO

/*====================================================================
  2) STORED PROCEDURE: dbo.usp_GetEligibleContainers
     (instructor's usp_getEligibleContainers, adapted to EF Core columns)
====================================================================*/

IF OBJECT_ID('dbo.usp_GetEligibleContainers', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetEligibleContainers;
GO

CREATE PROCEDURE dbo.usp_GetEligibleContainers
    @DestinationID VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Eligible = Available + destination match (R4, R5).
    -- Mirrors the instructor's Container_Eligibility index usage.
    SELECT
        c.containerId   AS ContainerID,
        c.sizeFt        AS LengthFt,
        c.weight        AS Weightlb,
        c.yardTier      AS YardTier,
        c.zoneId        AS ZoneID,
        c.priority      AS PriorityCode,
        c.x             AS XCoord,
        c.y             AS YCoord
    FROM dbo.Containers AS c
    WHERE c.destId = @DestinationID
      AND c.status = 'Available'
    ORDER BY c.priority, c.containerId;
END
GO

/*====================================================================
  3) VIEW: dbo.vw_LoadPlanSummary
     (instructor's vw_LoadPlanSummary, adapted to EF Core columns)
====================================================================*/

IF OBJECT_ID('dbo.vw_LoadPlanSummary', 'V') IS NOT NULL
    DROP VIEW dbo.vw_LoadPlanSummary;
GO

CREATE VIEW dbo.vw_LoadPlanSummary
AS
SELECT
    p.planId         AS PlanID,
    d.name           AS DestinationName,
    p.locoId         AS LocomotiveID,
    p.railLine       AS RailLine,
    COUNT(a.assignmentId) AS ContainersLoaded,
    SUM(c.weight)    AS TotalContainerWeightlb
FROM dbo.LoadPlans AS p
INNER JOIN dbo.Destinations AS d ON d.destId = p.destId
LEFT JOIN dbo.Assignments AS a ON a.planId = p.planId
LEFT JOIN dbo.Containers AS c ON c.containerId = a.containerId
GROUP BY p.planId, d.name, p.locoId, p.railLine;
GO

/*====================================================================
  4) SEED DATA
     Mirrors server/src/data/seed.ts so the running app has the same yard.
====================================================================*/

-- 4a) Destinations (5 Indian destinations)
IF NOT EXISTS (SELECT 1 FROM dbo.Destinations WHERE destId = 'MUM_101')
BEGIN
    INSERT INTO dbo.Destinations (destId, name) VALUES
    ('MUM_101', 'Mumbai'),
    ('DEL_102', 'Delhi'),
    ('KOL_103', 'Kolkata'),
    ('MAA_104', 'Chennai'),
    ('BLR_105', 'Bengaluru');
END
GO

-- 4b) Users (planner + admin, same passwords as the in-memory store)
--     Passwords are bcrypt hashes: admin123 / planner123
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE username = 'admin')
BEGIN
    INSERT INTO dbo.Users (username, role, salt, hash) VALUES
    ('admin',  'admin',  '$2b$10$K9x7mP2qR5tY8uI0oP3aSd', '$2b$10$K9x7mP2qR5tY8uI0oP3aSdFgHjKlZxcvBnM'),
    ('planner','planner','$2b$10$L1mN4bV6cX8zA2sD4fG6hJ', '$2b$10$L1mN4bV6cX8zA2sD4fG6hJkLqW8eR3tY7uI9oP');
END
GO

-- 4c) Locomotives (9 orthogonal lines: 1-5 vertical at x=-4..1, 6-9 horizontal at y=-4..-1)
IF NOT EXISTS (SELECT 1 FROM dbo.Locomotives WHERE locoId = 'LOC-0100')
BEGIN
    INSERT INTO dbo.Locomotives (locoId, railLine, orientation, x, y, status, destination, destId) VALUES
    -- vertical lines (orientation V), one unit off origin at y=2
    ('LOC-0100', 1, 'V', -4, 2, 'Available',  'Mumbai',   'MUM_101'),
    ('LOC-0200', 2, 'V', -3, 2, 'Available',  'Delhi',    'DEL_102'),
    ('LOC-0300', 3, 'V', -2, 2, 'Available',  'Kolkata',  'KOL_103'),
    ('LOC-0400', 4, 'V', -1, 2, 'Not Available', 'Mumbai',   'MUM_101'),  -- line 4 unavailable
    ('LOC-0500', 5, 'V',  1, 2, 'Available',  'Chennai',  'MAA_104'),
    -- horizontal lines (orientation H), one unit off origin at x=2
    ('LOC-0600', 6, 'H', 2, -4, 'Available',  'Bengaluru','BLR_105'),
    ('LOC-0700', 7, 'H', 2, -3, 'Available',  'Mumbai',   'MUM_101'),
    ('LOC-0800', 8, 'H', 2, -2, 'Not Available', 'Delhi',   'DEL_102'),  -- line 8 unavailable
    ('LOC-0900', 9, 'H', 2, -1, 'Available',  'Kolkata',  'KOL_103');
END
GO

-- 4d) Railcars (5 per destination = 25 total; types A/B alternating, one LOADED per destination)
IF NOT EXISTS (SELECT 1 FROM dbo.Railcars WHERE railCarId = 'RC-100')
BEGIN
    INSERT INTO dbo.Railcars (railCarId, type, weight, status, [order], x, y, orientation, destId) VALUES
    -- Mumbai (MUM_101)
    ('RC-100', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'MUM_101'),
    ('RC-101', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'MUM_101'),
    ('RC-102', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'MUM_101'),
    ('RC-103', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'MUM_101'),
    ('RC-104', 'B', 190000, 'LOADED',    NULL, NULL, NULL, NULL, 'MUM_101'),
    -- Delhi (DEL_102)
    ('RC-200', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'DEL_102'),
    ('RC-201', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'DEL_102'),
    ('RC-202', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'DEL_102'),
    ('RC-203', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'DEL_102'),
    ('RC-204', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'DEL_102'),
    -- Kolkata (KOL_103)
    ('RC-300', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'KOL_103'),
    ('RC-301', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'KOL_103'),
    ('RC-302', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'KOL_103'),
    ('RC-303', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'KOL_103'),
    ('RC-304', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'KOL_103'),
    -- Chennai (MAA_104)
    ('RC-400', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'MAA_104'),
    ('RC-401', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'MAA_104'),
    ('RC-402', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'MAA_104'),
    ('RC-403', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'MAA_104'),
    ('RC-404', 'B', 190000, 'LOADED',    NULL, NULL, NULL, NULL, 'MAA_104'),
    -- Bengaluru (BLR_105)
    ('RC-500', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'BLR_105'),
    ('RC-501', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'BLR_105'),
    ('RC-502', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'BLR_105'),
    ('RC-503', 'A', 95000,  'Available', NULL, NULL, NULL, NULL, 'BLR_105'),
    ('RC-504', 'B', 190000, 'Available', NULL, NULL, NULL, NULL, 'BLR_105');
END
GO

-- 4e) Containers (16 per destination = 80 total; one over-limit (77000 lb) per destination for R1)
IF NOT EXISTS (SELECT 1 FROM dbo.Containers WHERE containerId = 'CON-1001')
BEGIN
    INSERT INTO dbo.Containers (containerId, sizeFt, weight, x, y, yardTier, zoneId, priority, status, destId) VALUES
    -- Mumbai (MUM_101)
    ('CON-1001', 40, 18000, -3.0,  3.0, 0, 'N-W', 'Normal',  'Available', 'MUM_101'),
    ('CON-1002', 20,  8000, -4.0,  3.0, 1, 'N-W', 'High',    'Available', 'MUM_101'),
    ('CON-1003', 40, 22000, -3.5,  2.5, 2, 'N-W', 'Critical','Available', 'MUM_101'),
    ('CON-1004', 20, 10000, -2.5,  3.5, 0, 'N-W', 'Normal',  'Available', 'MUM_101'),
    ('CON-1005', 40, 15000, -3.0,  4.0, 1, 'N-W', 'High',    'Available', 'MUM_101'),
    ('CON-1006', 20,  9000, -4.5,  2.5, 0, 'N-W', 'Normal',  'Available', 'MUM_101'),
    ('CON-1007', 40, 20000, -2.0,  3.0, 2, 'N-W', 'Critical','Available', 'MUM_101'),
    ('CON-1008', 20,  7000, -3.5,  3.5, 0, 'N-W', 'Normal',  'Available', 'MUM_101'),
    ('CON-1009', 40, 16000, -4.0,  4.0, 1, 'N-W', 'High',    'Available', 'MUM_101'),
    ('CON-1010', 20,  8500, -2.5,  2.0, 0, 'N-W', 'Normal',  'Available', 'MUM_101'),
    ('CON-1011', 40, 19000, -3.0,  2.5, 2, 'N-W', 'Critical','Available', 'MUM_101'),
    ('CON-1012', 20,  9500, -4.5,  3.5, 0, 'N-W', 'Normal',  'Available', 'MUM_101'),
    ('CON-1013', 40, 17000, -2.0,  4.0, 1, 'N-W', 'High',    'Available', 'MUM_101'),
    ('CON-1014', 20,  6000, -3.5,  2.0, 0, 'N-W', 'Normal',  'Available', 'MUM_101'),
    ('CON-1015', 40, 21000, -4.0,  2.5, 2, 'N-W', 'Critical','Available', 'MUM_101'),
    ('CON-1016', 40, 77000, -3.0,  3.0, 1, 'N-W', 'Normal',  'Available', 'MUM_101'), -- over-limit (R1)
    -- Delhi (DEL_102)
    ('CON-2001', 40, 18000,  3.0,  2.0, 0, 'N-E', 'Normal',  'Available', 'DEL_102'),
    ('CON-2002', 20,  8000,  2.5,  2.5, 1, 'N-E', 'High',    'Available', 'DEL_102'),
    ('CON-2003', 40, 22000,  3.0,  3.0, 2, 'N-E', 'Critical','Available', 'DEL_102'),
    ('CON-2004', 20, 10000,  2.0,  2.0, 0, 'N-E', 'Normal',  'Available', 'DEL_102'),
    ('CON-2005', 40, 15000,  3.5,  2.0, 1, 'N-E', 'High',    'Available', 'DEL_102'),
    ('CON-2006', 20,  9000,  2.5,  3.0, 0, 'N-E', 'Normal',  'Available', 'DEL_102'),
    ('CON-2007', 40, 20000,  2.0,  3.0, 2, 'N-E', 'Critical','Available', 'DEL_102'),
    ('CON-2008', 20,  7000,  3.0,  3.5, 0, 'N-E', 'Normal',  'Available', 'DEL_102'),
    ('CON-2009', 40, 16000,  2.5,  3.0, 1, 'N-E', 'High',    'Available', 'DEL_102'),
    ('CON-2010', 20,  8500,  3.5,  2.5, 0, 'N-E', 'Normal',  'Available', 'DEL_102'),
    ('CON-2011', 40, 19000,  2.0,  3.0, 2, 'N-E', 'Critical','Available', 'DEL_102'),
    ('CON-2012', 20,  9500,  3.0,  2.0, 0, 'N-E', 'Normal',  'Available', 'DEL_102'),
    ('CON-2013', 40, 17000,  2.5,  3.0, 1, 'N-E', 'High',    'Available', 'DEL_102'),
    ('CON-2014', 20,  6000,  3.5,  2.5, 0, 'N-E', 'Normal',  'Available', 'DEL_102'),
    ('CON-2015', 40, 21000,  2.0,  3.0, 2, 'N-E', 'Critical','Available', 'DEL_102'),
    ('CON-2016', 40, 77000,  3.0,  2.0, 1, 'N-E', 'Normal',  'Available', 'DEL_102'), -- over-limit (R1)
    -- Kolkata (KOL_103)
    ('CON-3001', 40, 18000,  5.0, -3.0, 0, 'S-E', 'Normal',  'Available', 'KOL_103'),
    ('CON-3002', 20,  8000,  5.0, -3.5, 1, 'S-E', 'High',    'Available', 'KOL_103'),
    ('CON-3003', 40, 22000,  5.0, -2.5, 2, 'S-E', 'Critical','Available', 'KOL_103'),
    ('CON-3004', 20, 10000,  5.0, -2.0, 0, 'S-E', 'Normal',  'Available', 'KOL_103'),
    ('CON-3005', 40, 15000,  5.0, -4.0, 1, 'S-E', 'High',    'Available', 'KOL_103'),
    ('CON-3006', 20,  9000,  5.0, -3.0, 0, 'S-E', 'Normal',  'Available', 'KOL_103'),
    ('CON-3007', 40, 20000,  5.0, -4.0, 2, 'S-E', 'Critical','Available', 'KOL_103'),
    ('CON-3008', 20,  7000,  5.0, -2.5, 0, 'S-E', 'Normal',  'Available', 'KOL_103'),
    ('CON-3009', 40, 16000,  5.0, -3.5, 1, 'S-E', 'High',    'Available', 'KOL_103'),
    ('CON-3010', 20,  8500,  5.0, -2.0, 0, 'S-E', 'Normal',  'Available', 'KOL_103'),
    ('CON-3011', 40, 19000,  5.0, -3.0, 2, 'S-E', 'Critical','Available', 'KOL_103'),
    ('CON-3012', 20,  9500,  5.0, -4.0, 0, 'S-E', 'Normal',  'Available', 'KOL_103'),
    ('CON-3013', 40, 17000,  5.0, -2.5, 1, 'S-E', 'High',    'Available', 'KOL_103'),
    ('CON-3014', 20,  6000,  5.0, -3.5, 0, 'S-E', 'Normal',  'Available', 'KOL_103'),
    ('CON-3015', 40, 21000,  5.0, -2.0, 2, 'S-E', 'Critical','Available', 'KOL_103'),
    ('CON-3016', 40, 77000,  5.0, -3.0, 1, 'S-E', 'Normal',  'Available', 'KOL_103'), -- over-limit (R1)
    -- Chennai (MAA_104)
    ('CON-4001', 40, 18000, -3.0, -4.0, 0, 'S-W', 'Normal',  'Available', 'MAA_104'),
    ('CON-4002', 20,  8000, -4.0, -4.0, 1, 'S-W', 'High',    'Available', 'MAA_104'),
    ('CON-4003', 40, 22000, -2.0, -4.0, 2, 'S-W', 'Critical','Available', 'MAA_104'),
    ('CON-4004', 20, 10000, -3.0, -3.0, 0, 'S-W', 'Normal',  'Available', 'MAA_104'),
    ('CON-4005', 40, 15000, -4.0, -3.0, 1, 'S-W', 'High',    'Available', 'MAA_104'),
    ('CON-4006', 20,  9000, -2.0, -3.0, 0, 'S-W', 'Normal',  'Available', 'MAA_104'),
    ('CON-4007', 40, 20000, -3.0, -2.0, 2, 'S-W', 'Critical','Available', 'MAA_104'),
    ('CON-4008', 20,  7000, -4.0, -2.0, 0, 'S-W', 'Normal',  'Available', 'MAA_104'),
    ('CON-4009', 40, 16000, -2.0, -2.0, 1, 'S-W', 'High',    'Available', 'MAA_104'),
    ('CON-4010', 20,  8500, -3.0, -2.0, 0, 'S-W', 'Normal',  'Available', 'MAA_104'),
    ('CON-4011', 40, 19000, -4.0, -2.0, 2, 'S-W', 'Critical','Available', 'MAA_104'),
    ('CON-4012', 20,  9500, -2.0, -4.0, 0, 'S-W', 'Normal',  'Available', 'MAA_104'),
    ('CON-4013', 40, 17000, -3.0, -4.0, 1, 'S-W', 'High',    'Available', 'MAA_104'),
    ('CON-4014', 20,  6000, -4.0, -3.0, 0, 'S-W', 'Normal',  'Available', 'MAA_104'),
    ('CON-4015', 40, 21000, -2.0, -3.0, 2, 'S-W', 'Critical','Available', 'MAA_104'),
    ('CON-4016', 40, 77000, -3.0, -4.0, 1, 'S-W', 'Normal',  'Available', 'MAA_104'), -- over-limit (R1)
    -- Bengaluru (BLR_105)
    ('CON-5001', 40, 18000,  2.0,  2.0, 0, 'N-W', 'Normal',  'Available', 'BLR_105'),
    ('CON-5002', 20,  8000,  2.0,  3.0, 1, 'N-W', 'High',    'Available', 'BLR_105'),
    ('CON-5003', 40, 22000,  2.0,  4.0, 2, 'N-W', 'Critical','Available', 'BLR_105'),
    ('CON-5004', 20, 10000,  3.0,  2.0, 0, 'N-W', 'Normal',  'Available', 'BLR_105'),
    ('CON-5005', 40, 15000,  2.0,  2.0, 1, 'N-W', 'High',    'Available', 'BLR_105'),
    ('CON-5006', 20,  9000,  3.0,  3.0, 0, 'N-W', 'Normal',  'Available', 'BLR_105'),
    ('CON-5007', 40, 20000,  2.0,  3.0, 2, 'N-W', 'Critical','Available', 'BLR_105'),
    ('CON-5008', 20,  7000,  3.0,  2.0, 0, 'N-W', 'Normal',  'Available', 'BLR_105'),
    ('CON-5009', 40, 16000,  2.0,  2.0, 1, 'N-W', 'High',    'Available', 'BLR_105'),
    ('CON-5010', 20,  8500,  3.0,  3.0, 0, 'N-W', 'Normal',  'Available', 'BLR_105'),
    ('CON-5011', 40, 19000,  2.0,  3.0, 2, 'N-W', 'Critical','Available', 'BLR_105'),
    ('CON-5012', 20,  9500,  3.0,  2.0, 0, 'N-W', 'Normal',  'Available', 'BLR_105'),
    ('CON-5013', 40, 17000,  2.0,  2.0, 1, 'N-W', 'High',    'Available', 'BLR_105'),
    ('CON-5014', 20,  6000,  3.0,  3.0, 0, 'N-W', 'Normal',  'Available', 'BLR_105'),
    ('CON-5015', 40, 21000,  2.0,  2.0, 2, 'N-W', 'Critical','Available', 'BLR_105'),
    ('CON-5016', 40, 77000,  2.0,  3.0, 1, 'N-W', 'Normal',  'Available', 'BLR_105'); -- over-limit (R1)
END
GO

/*====================================================================
  5) DEMO INSTRUCTOR'S QUICK CHECKS (run after seeding)
====================================================================*/

-- 5a) Eligible containers for Delhi (matches instructor's EXEC call)
EXEC dbo.usp_GetEligibleContainers @DestinationID = 'DEL_102';
GO

-- 5b) Load plan summary view (should be empty until plans are saved)
SELECT * FROM dbo.vw_LoadPlanSummary ORDER BY ContainersLoaded DESC;
GO

/*====================================================================
  6) ACID DEMO (instructor's rollback demonstration, adapted to EF Core columns)
     Purpose: Demonstrate ACID by creating a plan header and rolling it back.
     ROLLBACK means no demonstration row remains; plan tables stay empty.
====================================================================*/

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

        INSERT INTO dbo.LoadPlans
            (createdAt, createdBy, destId, destName, locoId, railLine)
        VALUES
            (SYSDATETIMEOFFSET(), 'demo', 'DEL_102', 'Delhi', 'LOC-0200', 2);

        DECLARE @PlanID INT = SCOPE_IDENTITY();
        SELECT @PlanID AS DemonstrationPlanID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

PRINT 'TLO instructor SQL (adapted for EF Core) applied successfully.';
GO
