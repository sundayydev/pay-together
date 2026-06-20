import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getPrisma } from "../../../infrastructure/database/prisma";
import { PrismaUserRepository } from "../../../adapters/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "../../../adapters/repositories/prisma-refresh-token.repository";
import { RegisterUseCase } from "../../../usecases/auth/register.usecase";
import { LoginUseCase } from "../../../usecases/auth/login.usecase";

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

export const authRouter = new OpenAPIHono<{ Bindings: Bindings }>();

const RegisterInputSchema = z.object({
  phoneNumber: z.string(),
  password: z.string().min(6),
  name: z.string(),
  momoPhone: z.string().nullable().optional(),
  bankCode: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
}).openapi("RegisterInput");

import { createAppResponseSchema, BaseAppResponseSchema, AppResponse, AppResponseWithData } from "../../../utils/response";

const RegisterResponseSchema = createAppResponseSchema(
  z.object({
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string(),
  }),
  "Register"
);

const LoginInputSchema = z.object({
  phoneNumber: z.string(),
  password: z.string(),
}).openapi("LoginInput");

const LoginResponseSchema = createAppResponseSchema(
  z.object({
    token: z.string(),
    refresh_token: z.string(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      phoneNumber: z.string(),
    }),
  }),
  "Login"
);

const ErrorResponseSchema = BaseAppResponseSchema;

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  tags: ["Authentication"],
  summary: "Đăng ký tài khoản mới",
  description: "Tạo tài khoản người dùng mới sử dụng số điện thoại và mật khẩu. Số điện thoại đăng ký không được trùng lặp.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: RegisterResponseSchema,
        },
      },
      description: "User registered successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad Request / Validation Error",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  tags: ["Authentication"],
  summary: "Đăng nhập hệ thống",
  description: "Xác thực người dùng qua số điện thoại và mật khẩu để cấp JWT Token dùng cho các API yêu cầu đăng nhập.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LoginResponseSchema,
        },
      },
      description: "User logged in successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Unauthorized",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

authRouter.openapi(registerRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaUserRepository(prisma);
  const useCase = new RegisterUseCase(repo);

  try {
    const body = await c.req.json();
    const user = await useCase.execute(body);
    const responseData = {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
    };
    return c.json(AppResponseWithData.successWithData(responseData, "User registered successfully", 201), 201);
  } catch (error: any) {
    const status = error.message.includes("registered") ? 400 : 500;
    return c.json(AppResponse.fail(error.message, error, status), status as any);
  }
});

authRouter.openapi(loginRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const userRepo = new PrismaUserRepository(prisma);
  const tokenRepo = new PrismaRefreshTokenRepository(prisma);
  const useCase = new LoginUseCase(userRepo, tokenRepo);

  try {
    const body = await c.req.json();
    const jwtSecret = c.env.JWT_SECRET;
    const result = await useCase.execute(body, jwtSecret);
    return c.json(AppResponseWithData.successWithData(result, "Login successful", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 401), 401);
  }
});
