import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getPrisma } from "../../../infrastructure/database/prisma";
import { PrismaUserRepository } from "../../../adapters/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "../../../adapters/repositories/prisma-refresh-token.repository";
import { TokenPasswordUseCase } from "../../../usecases/connect/token-password.usecase";
import { TokenRefreshUseCase } from "../../../usecases/connect/token-refresh.usecase";

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

export const connectRouter = new OpenAPIHono<{ Bindings: Bindings }>();

const TokenRequestSchema = z.object({
  grant_type: z.enum(["password", "refresh_token"]),
  username: z.string().optional(),
  password: z.string().optional(),
  refresh_token: z.string().optional(),
}).openapi("TokenRequest");

const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("Bearer"),
  expires_in: z.number(),
  refresh_token: z.string(),
}).openapi("TokenResponse");

const OAuth2ErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
}).openapi("OAuth2Error");

const tokenRoute = createRoute({
  method: "post",
  path: "/token",
  tags: ["Authentication (OIDC)"],
  summary: "OpenID Connect / OAuth2 Token Endpoint",
  description: "Cấp phát access token và refresh token theo cơ chế OpenID Connect / OAuth2. Hỗ trợ grant_type=password và grant_type=refresh_token.",
  request: {
    body: {
      content: {
        "application/x-www-form-urlencoded": {
          schema: TokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TokenResponseSchema,
        },
      },
      description: "Token issued successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: OAuth2ErrorSchema,
        },
      },
      description: "Bad Request (Invalid grant, client error, etc.)",
    },
    500: {
      content: {
        "application/json": {
          schema: OAuth2ErrorSchema,
        },
      },
      description: "Server error",
    },
  },
});

connectRouter.openapi(tokenRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const userRepo = new PrismaUserRepository(prisma);
  const tokenRepo = new PrismaRefreshTokenRepository(prisma);

  try {
    const body = await c.req.parseBody();
    const grantType = body.grant_type;

    if (grantType === "password") {
      const username = body.username as string;
      const password = body.password as string;

      if (!username || !password) {
        return c.json(
          {
            error: "invalid_request",
            error_description: "Missing username or password for password grant",
          },
          400
        );
      }

      const useCase = new TokenPasswordUseCase(userRepo, tokenRepo);
      const result = await useCase.execute({
        username,
        password,
        jwtSecret: c.env.JWT_SECRET,
      });

      return c.json(result, 200);
    } else if (grantType === "refresh_token") {
      const refreshToken = body.refresh_token as string;

      if (!refreshToken) {
        return c.json(
          {
            error: "invalid_request",
            error_description: "Missing refresh_token parameter",
          },
          400
        );
      }

      const useCase = new TokenRefreshUseCase(tokenRepo);
      const result = await useCase.execute({
        refreshToken,
        jwtSecret: c.env.JWT_SECRET,
      });

      return c.json(result, 200);
    } else {
      return c.json(
        {
          error: "unsupported_grant_type",
          error_description: "The authorization grant type is not supported by the authorization server",
        },
        400
      );
    }
  } catch (error: any) {
    const message = error.message as string;
    if (message.startsWith("invalid_grant:")) {
      const parts = message.split(": ");
      const errorType = parts[0];
      const errorDesc = parts.slice(1).join(": ");
      return c.json({ error: errorType, error_description: errorDesc }, 400);
    }
    return c.json({ error: "server_error", error_description: error.message }, 500);
  }
});
