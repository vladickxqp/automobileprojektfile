import { buildApp } from "./app";
import { env } from "./env";
import { prisma } from "./lib/prisma";

const app = buildApp();

async function shutdown() {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown();
  });
}

app.listen({ port: env.PORT, host: env.HOST }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
