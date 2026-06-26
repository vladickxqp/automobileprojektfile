import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { ZodError } from "zod";
import { env } from "./env";
import { STORAGE_ROOT } from "./lib/storage";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { vehicleRoutes } from "./routes/vehicles";
import { eventRoutes } from "./routes/events";
import { documentRoutes } from "./routes/documents";
import { reminderRoutes } from "./routes/reminders";
import { assistantRoutes } from "./routes/assistant";
import { scanRoutes } from "./routes/scans";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: { level: env.NODE_ENV === "production" ? "info" : "debug" },
  });

  app.register(cors, { origin: true });
  app.register(jwt, { secret: env.JWT_SECRET });
  app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  // Dev-only static serving of uploaded files. Production uses S3/R2 with signed URLs.
  app.register(fastifyStatic, { root: STORAGE_ROOT, prefix: "/files/" });

  // Turn Zod validation failures into clean 400s.
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: "Validation failed", issues: error.issues });
    }
    reply.log.error(error);
    return reply.code(error.statusCode ?? 500).send({ error: error.message });
  });

  app.register(healthRoutes);
  app.register(authRoutes, { prefix: "/auth" });
  app.register(vehicleRoutes, { prefix: "/vehicles" });
  app.register(eventRoutes, { prefix: "/vehicles" });
  app.register(documentRoutes, { prefix: "/vehicles" });
  app.register(reminderRoutes, { prefix: "/vehicles" });
  app.register(assistantRoutes, { prefix: "/vehicles" });
  app.register(scanRoutes, { prefix: "/vehicles" });

  return app;
}
