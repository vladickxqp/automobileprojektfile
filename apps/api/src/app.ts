import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { ZodError } from "zod";
import { env } from "./env";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { vehicleRoutes } from "./routes/vehicles";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: { level: env.NODE_ENV === "production" ? "info" : "debug" },
  });

  app.register(cors, { origin: true });
  app.register(jwt, { secret: env.JWT_SECRET });

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

  return app;
}
