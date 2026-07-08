import express from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import path from "path";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/router";
import { talentsRouter } from "./modules/talents/router";
import { lookupsRouter } from "./modules/lookups/router";
import { dashboardRouter } from "./modules/dashboard/router";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(
    session({
      cookie: {
        maxAge: 8 * 60 * 60 * 1000, // 8 hour idle timeout
        httpOnly: true,
        sameSite: "lax",
        secure: env.nodeEnv === "production",
      },
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
      }),
    })
  );

  app.use("/api/auth", authRouter);
  app.use("/api/talents", talentsRouter);
  app.use("/api/lookups", lookupsRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}
