import { PrismaClient } from '@prisma/client';
import { DESTINATIONS, seedLocomotives, seedRailcars, seedContainers } from '../src/data/seed';

const prisma = new PrismaClient();

async function main() {
  // Destinations
  for (const d of DESTINATIONS) {
    await prisma.destination.upsert({
      where: { destId: d.destId },
      update: { name: d.name },
      create: d,
    });
  }

  // Locomotives (flatten coordinate into x/y)
  for (const l of seedLocomotives()) {
    await prisma.locomotive.upsert({
      where: { locoId: l.locoId },
      update: {
        railLine: l.railLine,
        orientation: l.orientation,
        x: l.coordinate.x,
        y: l.coordinate.y,
        status: l.status,
        destination: l.destination,
        destId: l.destId,
      },
      create: {
        locoId: l.locoId,
        railLine: l.railLine,
        orientation: l.orientation,
        x: l.coordinate.x,
        y: l.coordinate.y,
        status: l.status,
        destination: l.destination,
        destId: l.destId,
      },
    });
  }

  // Railcars (flatten coordinate into x/y)
  for (const r of seedRailcars()) {
    await prisma.railcar.upsert({
      where: { railCarId: r.railCarId },
      update: {
        type: r.type,
        weight: r.weight,
        status: r.status,
        order: r.order,
        x: r.coordinate?.x ?? null,
        y: r.coordinate?.y ?? null,
        orientation: r.orientation ?? null,
        destId: r.destId,
      },
      create: {
        railCarId: r.railCarId,
        type: r.type,
        weight: r.weight,
        status: r.status,
        order: r.order,
        x: r.coordinate?.x ?? null,
        y: r.coordinate?.y ?? null,
        orientation: r.orientation ?? null,
        destId: r.destId,
      },
    });
  }

  // Containers (flatten coordinate into x/y)
  for (const c of seedContainers()) {
    await prisma.container.upsert({
      where: { containerId: c.containerId },
      update: {
        sizeFt: c.sizeFt,
        weight: c.weight,
        x: c.coordinate.x,
        y: c.coordinate.y,
        yardTier: c.yardTier,
        zoneId: c.zoneId,
        priority: c.priority,
        status: c.status,
        destId: c.destId,
      },
      create: {
        containerId: c.containerId,
        sizeFt: c.sizeFt,
        weight: c.weight,
        x: c.coordinate.x,
        y: c.coordinate.y,
        yardTier: c.yardTier,
        zoneId: c.zoneId,
        priority: c.priority,
        status: c.status,
        destId: c.destId,
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });