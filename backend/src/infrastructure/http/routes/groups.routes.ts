import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getPrisma } from "../../../infrastructure/database/prisma";
import { PrismaGroupRepository } from "../../../adapters/repositories/prisma-group.repository";
import { CreateGroupUseCase } from "../../../usecases/groups/create-group.usecase";
import { authMiddleware } from "../../../middlewares/auth.middleware";

type Bindings = {
  DATABASE_URL: string;
};

type Variables = {
  userId: string;
};

export const groupsRouter = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

// Protect all group routes
groupsRouter.use("/*", authMiddleware);

const CreateGroupInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
}).openapi("CreateGroupInput");

const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  inviteCode: z.string(),
}).openapi("Group");

import { createAppResponseSchema, BaseAppResponseSchema, AppResponse, AppResponseWithData } from "../../../utils/response";

const CreateGroupResponseSchema = createAppResponseSchema(GroupSchema, "CreateGroup");
const ErrorResponseSchema = BaseAppResponseSchema;

const createGroupRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Groups"],
  summary: "Tạo nhóm mới",
  description: "Tạo một nhóm chia sẻ chi phí mới. Tự động thêm người tạo làm ADMIN và sinh mã mời thành viên.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateGroupInputSchema,
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CreateGroupResponseSchema,
        },
      },
      description: "Group created successfully",
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

groupsRouter.openapi(createGroupRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaGroupRepository(prisma);
  const useCase = new CreateGroupUseCase(repo);

  try {
    const creatorId = c.get("userId");
    const body = await c.req.json();
    const group = await useCase.execute({
      name: body.name,
      description: body.description,
      creatorId,
    });
    const responseData = {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      inviteCode: group.inviteCode,
    };
    return c.json(AppResponseWithData.successWithData(responseData, "Group created successfully", 201), 201);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});
