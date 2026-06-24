import { PrismaClient } from "@prisma/client";

// Real, standard automotive reference data — NOT fabricated. Seeds the assistant's knowledge base.
// Run: pnpm --filter @autolife/api exec tsx prisma/seed-knowledge.ts
const chunks: { source: string; title: string; text: string }[] = [
  {
    source: "OBD-II DTC reference",
    title: "P0401 — EGR flow insufficient",
    text: "Exhaust Gas Recirculation flow insufficient detected. Common causes: clogged EGR passages or valve, carbon build-up, a faulty EGR position sensor or vacuum supply. Usually drivable short-term, but it can cause rough idle, hesitation and higher emissions, and will fail an emissions / TUV test. Cleaning or replacing the EGR valve typically resolves it.",
  },
  {
    source: "OBD-II DTC reference",
    title: "P0420 — Catalyst efficiency below threshold (Bank 1)",
    text: "Catalytic converter efficiency below threshold. Common causes: an aging catalytic converter, worn oxygen sensors, or an exhaust leak. Often still drivable, but it indicates the converter or O2 sensors may need attention and the car will fail emissions testing.",
  },
  {
    source: "OBD-II DTC reference",
    title: "P0300 — Random/multiple cylinder misfire",
    text: "Random or multiple-cylinder misfire detected. Causes: worn spark plugs or ignition coils, fuel delivery problems, or vacuum leaks. Misfires dump unburned fuel into the exhaust and can damage the catalytic converter, so address it promptly and avoid hard driving until fixed.",
  },
  {
    source: "OBD-II DTC reference",
    title: "P0171 — System too lean (Bank 1)",
    text: "Fuel system running too lean. Causes: intake or vacuum leaks, a weak fuel pump, a clogged fuel filter, or a dirty mass-airflow (MAF) sensor. Generally drivable but causes poor performance and, long-term, increased engine wear.",
  },
  {
    source: "Maintenance guidance",
    title: "Timing chain wear and intervals",
    text: "Many modern engines are designed to run the timing chain for the life of the engine, but some are known for premature chain or tensioner wear (for example certain VAG 1.4/1.8/2.0 TSI and BMW N47 engines). A rattle on cold start is a common early warning sign. Always check model-specific service data before deciding on replacement.",
  },
  {
    source: "Maintenance guidance",
    title: "Engine oil change intervals",
    text: "Engine oil change intervals are typically 10,000-15,000 km or every 12 months on long-life schedules, and shorter (around 7,500-10,000 km) for severe use, short trips, or older engines. Always use the exact oil specification required by the manufacturer.",
  },
  {
    source: "Maintenance guidance",
    title: "Turbocharger wear and symptoms",
    text: "Turbocharger longevity depends heavily on oil quality and warm-up / cool-down habits. Symptoms of turbo wear include blue or black exhaust smoke, a whining noise, and loss of boost. Replacement is a significant repair — diagnose with a boost-pressure test before replacing the unit.",
  },
  {
    source: "Maintenance guidance",
    title: "Diesel Particulate Filter (DPF) issues",
    text: "DPF problems often show up as reduced power or codes around P242x. Frequent short trips prevent the filter from regenerating and lead to clogging; periodic longer drives at higher engine load help it regenerate. A blocked DPF may require a forced regeneration or cleaning.",
  },
];

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.knowledgeChunk.deleteMany();
    await prisma.knowledgeChunk.createMany({ data: chunks });
    const count = await prisma.knowledgeChunk.count();
    console.log(`Seeded ${count} knowledge chunks.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
