import { PrismaClient } from "@prisma/client";

// Real, standard OBD-II diagnostic trouble codes (SAE J2012). Reference data — run:
//   pnpm --filter @autolife/api exec tsx prisma/seed-dtc.ts
const codes = [
  { code: "P0401", description: "Exhaust Gas Recirculation flow insufficient detected", system: "engine", severity: 3 },
  { code: "P0420", description: "Catalyst system efficiency below threshold (Bank 1)", system: "engine", severity: 3 },
  { code: "P0300", description: "Random/multiple cylinder misfire detected", system: "engine", severity: 4 },
  { code: "P0301", description: "Cylinder 1 misfire detected", system: "engine", severity: 4 },
  { code: "P0171", description: "System too lean (Bank 1)", system: "fuel", severity: 3 },
  { code: "P0172", description: "System too rich (Bank 1)", system: "fuel", severity: 3 },
  { code: "P0128", description: "Coolant thermostat temperature below regulating temperature", system: "cooling", severity: 2 },
  { code: "P0011", description: "Intake camshaft timing over-advanced (Bank 1)", system: "engine", severity: 3 },
  { code: "P0455", description: "Evaporative emission system leak detected (large leak)", system: "emissions", severity: 2 },
  { code: "P0606", description: "ECM/PCM processor fault", system: "ecu", severity: 5 },
  { code: "P0102", description: "Mass air flow (MAF) circuit low input", system: "intake", severity: 3 },
  { code: "P0113", description: "Intake air temperature sensor circuit high input", system: "intake", severity: 2 },
];

async function main() {
  const prisma = new PrismaClient();
  try {
    for (const c of codes) {
      await prisma.dtcCodeRef.upsert({ where: { code: c.code }, update: c, create: c });
    }
    console.log(`Seeded ${codes.length} DTC reference codes.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
