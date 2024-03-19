import express, { NextFunction, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import rateLimit from "express-rate-limit";
import controller from "./controller";
import config from "./config";

function createServer() {
  const app = express();

  Sentry.init({
    dsn: config.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hr
      max: 30, // limits each IP to 30 requests per windowMs
      message: "Too many requests from this IP",
    })
  );

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "cache"],
    })
  );

  app.use((_, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");

    next();
  });

  app.get("/healthz", (_, res: Response) => res.sendStatus(200));
  app.use("/", controller);

  app.use(Sentry.Handlers.errorHandler());

  app.use(function onError(err: any, _: any, res: any, __: any) {
    console.error(err, "Error occured:");
    res.statusCode = 500;
    res.json({
      status: false,
      error_id: res.sentry,
      message: "unexpected error occured",
    });
  });

  return app;
}

export default createServer;
