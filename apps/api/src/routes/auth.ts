import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { localeSchema } from "@autolife/shared";
import { prisma } from "../lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(120).optional(),
  locale: localeSchema.optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName ?? null,
        locale: body.locale ?? "en",
        authProvider: "email",
      },
    });

    const token = app.jwt.sign({ sub: user.id });
    return reply.code(201).send({ token, user: { id: user.id, email: user.email } });
  });

  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({ sub: user.id });
    return reply.send({ token, user: { id: user.id, email: user.email } });
  });

  // TODO(Phase 0+): Sign in with Apple / Google (OAuth) — see docs/ARCHITECTURE.md §3.
}
