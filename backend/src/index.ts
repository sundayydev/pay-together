import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { sign } from "hono/jwt";
import { authRouter } from "./infrastructure/http/routes/auth.routes";
import { banksRouter } from "./infrastructure/http/routes/banks.routes";
import { connectRouter } from "./infrastructure/http/routes/connect.routes";
import { groupsRouter } from "./infrastructure/http/routes/groups.routes";

type Bindings = {
  DATABASE_URL: string;
  VIETQR_API_URL: string;
  JWT_SECRET: string;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.text("PayTogether API - Cloudflare Workers Hono Edge is online!");
});

app.route("/api/auth", authRouter);
app.route("/api/banks", banksRouter);
app.route("/api/groups", groupsRouter);
app.route("/connect", connectRouter);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "PayTogether API",
    description:
      "API documentation for PayTogether backend running on Cloudflare Workers Edge",
  },
});

app.get("/scalar", async (c) => {
  const jwtSecret = c.env.JWT_SECRET;
  const devPayload = {
    sub: "00000000-0000-0000-0000-000000000000",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  };
  const token = await sign(devPayload, jwtSecret, "HS256");

  const handler = apiReference({
    theme: "saturn",
    spec: {
      url: "/doc",
    },
    authentication: {
      preferredSecurityScheme: "Bearer",
      securitySchemes: {
        Bearer: {
          token,
        },
      },
    },
  });

  return handler(c as any, async () => {});
});

export default app;
