import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getPrisma } from "../../../infrastructure/database/prisma";
import { PrismaGroupRepository } from "../../../adapters/repositories/prisma-group.repository";
import { PrismaExpenseRepository } from "../../../adapters/repositories/prisma-expense.repository";
import { PrismaSettlementRepository } from "../../../adapters/repositories/prisma-settlement.repository";

import { CreateGroupUseCase } from "../../../usecases/groups/create-group.usecase";
import { ListUserGroupsUseCase } from "../../../usecases/groups/list-user-groups.usecase";
import { GetGroupDetailsUseCase } from "../../../usecases/groups/get-group-details.usecase";
import { JoinGroupUseCase } from "../../../usecases/groups/join-group.usecase";
import { GetGroupMembersUseCase } from "../../../usecases/groups/get-group-members.usecase";
import { CalculateBalancesUseCase } from "../../../usecases/groups/calculate-balances.usecase";
import { CreateSettlementSessionUseCase } from "../../../usecases/groups/create-settlement-session.usecase";
import { ConfirmSettlementUseCase } from "../../../usecases/groups/confirm-settlement.usecase";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { createAppResponseSchema, BaseAppResponseSchema, AppResponse, AppResponseWithData } from "../../../utils/response";

type Bindings = {
  DATABASE_URL: string;
};

type Variables = {
  userId: string;
};

export const groupsRouter = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

// Bảo vệ tất cả các tuyến đường của nhóm
groupsRouter.use("/*", authMiddleware);

// --- SCHEMAS ---

const CreateGroupInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
}).openapi("CreateGroupInput");

const JoinGroupInputSchema = z.object({
  inviteCode: z.string().min(1),
}).openapi("JoinGroupInput");

const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  inviteCode: z.string(),
}).openapi("Group");

const GroupMemberSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  userId: z.string(),
  role: z.enum(["ADMIN", "MEMBER"]),
  joinedAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string(),
  }).optional(),
}).openapi("GroupMember");

const GroupDetailsSchema = GroupSchema.extend({
  members: z.array(GroupMemberSchema).optional(),
}).openapi("GroupDetails");

const UserBalanceSchema = z.object({
  userId: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  netBalance: z.number(),
}).openapi("UserBalance");

const DebtTransferSchema = z.object({
  fromUserId: z.string(),
  fromUserName: z.string(),
  fromUserPhone: z.string(),
  toUserId: z.string(),
  toUserName: z.string(),
  toUserPhone: z.string(),
  amount: z.number(),
}).openapi("DebtTransfer");

const BalancesSchema = z.object({
  balances: z.array(UserBalanceSchema),
  debts: z.array(DebtTransferSchema),
}).openapi("Balances");

const CreateSessionInputSchema = z.object({
  startDate: z.string().openapi({ description: "Ngày bắt đầu khoảng quyết toán (ISO 8601)" }),
  endDate: z.string().openapi({ description: "Ngày kết thúc khoảng quyết toán (ISO 8601)" }),
}).openapi("CreateSessionInput");

const SettlementSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  payerId: z.string(),
  receiverId: z.string(),
  amount: z.number(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOMO"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  description: z.string().nullable(),
  settlementSessionId: z.string().nullable(),
  payer: z.object({
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string(),
  }).optional(),
  receiver: z.object({
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string(),
    bankCode: z.string().nullable(),
    bankAccount: z.string().nullable(),
    bankAccountName: z.string().nullable(),
  }).optional(),
}).openapi("Settlement");

const SettlementSessionSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["PENDING", "COMPLETED"]),
  createdById: z.string(),
  settlements: z.array(SettlementSchema).optional(),
}).openapi("SettlementSession");

const CreateGroupResponseSchema = createAppResponseSchema(GroupSchema, "CreateGroup");
const JoinGroupResponseSchema = createAppResponseSchema(GroupSchema, "JoinGroup");
const ListGroupsResponseSchema = createAppResponseSchema(z.array(GroupSchema), "ListGroups");
const GroupDetailsResponseSchema = createAppResponseSchema(GroupDetailsSchema, "GroupDetails");
const GroupMembersResponseSchema = createAppResponseSchema(z.array(GroupMemberSchema), "GroupMembers");
const BalancesResponseSchema = createAppResponseSchema(BalancesSchema, "Balances");
const CreateSessionResponseSchema = createAppResponseSchema(SettlementSessionSchema, "CreateSession");
const ListSessionsResponseSchema = createAppResponseSchema(z.array(SettlementSessionSchema), "ListSessions");
const SessionDetailsResponseSchema = createAppResponseSchema(SettlementSessionSchema, "SessionDetails");
const ConfirmSettlementResponseSchema = createAppResponseSchema(SettlementSchema, "ConfirmSettlement");
const ErrorResponseSchema = BaseAppResponseSchema;

// --- ROUTE DEFINITIONS ---

// 1. Tạo nhóm mới
const createGroupRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Groups"],
  summary: "Tạo nhóm mới",
  description: "Tạo một nhóm chia sẻ chi phí mới. Tự động thêm người tạo làm ADMIN và sinh mã mời.",
  request: {
    body: {
      content: { "application/json": { schema: CreateGroupInputSchema } },
    },
  },
  security: [{ Bearer: [] }],
  responses: {
    201: {
      content: { "application/json": { schema: CreateGroupResponseSchema } },
      description: "Group created successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 2. Danh sách các nhóm của user
const listGroupsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Groups"],
  summary: "Danh sách nhóm của người dùng",
  description: "Lấy danh sách tất cả các nhóm mà người dùng hiện tại đang tham gia.",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: ListGroupsResponseSchema } },
      description: "List of groups retrieved successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 3. Xem chi tiết nhóm
const getGroupDetailsRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Groups"],
  summary: "Chi tiết nhóm",
  description: "Lấy thông tin chi tiết của một nhóm cụ thể theo ID cùng với các thành viên.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của nhóm" }),
    }),
  },
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: GroupDetailsResponseSchema } },
      description: "Group details retrieved successfully",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Group not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 4. Tham gia nhóm bằng inviteCode
const joinGroupRoute = createRoute({
  method: "post",
  path: "/join",
  tags: ["Groups"],
  summary: "Tham gia nhóm",
  description: "Tham gia vào một nhóm hiện có bằng cách cung cấp mã mời (Invite Code).",
  request: {
    body: {
      content: { "application/json": { schema: JoinGroupInputSchema } },
    },
  },
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: JoinGroupResponseSchema } },
      description: "Joined group successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid invite code or already a member",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 5. Danh sách thành viên nhóm
const getGroupMembersRoute = createRoute({
  method: "get",
  path: "/:id/members",
  tags: ["Groups"],
  summary: "Thành viên nhóm",
  description: "Lấy danh sách các thành viên trong một nhóm.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của nhóm" }),
    }),
  },
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: GroupMembersResponseSchema } },
      description: "Group members retrieved successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 6. Tính toán công nợ và số dư tối giản
const getBalancesRoute = createRoute({
  method: "get",
  path: "/:id/balances",
  tags: ["Settlements"],
  summary: "Tính toán số dư & nợ chéo tối giản",
  description: "Tính toán số dư ròng của các thành viên từ các chi tiêu chưa quyết toán và đưa ra sơ đồ gom nợ tối giản.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của nhóm" }),
    }),
  },
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: BalancesResponseSchema } },
      description: "Balances calculated successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 7. Chốt sổ nhóm (Tạo phiên quyết toán)
const createSessionRoute = createRoute({
  method: "post",
  path: "/:id/settle",
  tags: ["Settlements"],
  summary: "Chốt sổ nhóm theo khoảng ngày",
  description: "Tạo một phiên quyết toán chốt các khoản chi tiêu chưa chốt trong khoảng ngày và sinh ra các khoản nợ phải trả chuyển khoản.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của nhóm" }),
    }),
    body: {
      content: { "application/json": { schema: CreateSessionInputSchema } },
    },
  },
  security: [{ Bearer: [] }],
  responses: {
    201: {
      content: { "application/json": { schema: CreateSessionResponseSchema } },
      description: "Settlement session created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid date range or no pending expenses",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 8. Danh sách các phiên quyết toán (chốt sổ)
const listSessionsRoute = createRoute({
  method: "get",
  path: "/:id/sessions",
  tags: ["Settlements"],
  summary: "Danh sách phiên chốt sổ",
  description: "Lấy danh sách lịch sử các phiên chốt sổ quyết toán của nhóm.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của nhóm" }),
    }),
  },
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: ListSessionsResponseSchema } },
      description: "List of settlement sessions retrieved successfully",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 9. Xem chi tiết phiên chốt sổ kèm các giao dịch nợ
const getSessionDetailsRoute = createRoute({
  method: "get",
  path: "/:id/sessions/:sessionId",
  tags: ["Settlements"],
  summary: "Chi tiết phiên chốt sổ",
  description: "Lấy chi tiết một phiên chốt sổ kèm danh sách chi tiêu và các giao dịch nợ chuyển khoản cụ thể.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của nhóm" }),
      sessionId: z.string().openapi({ description: "ID của phiên chốt sổ" }),
    }),
  },
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: SessionDetailsResponseSchema } },
      description: "Session details retrieved successfully",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Session not found",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// 10. Người nhận xác nhận đã chuyển nợ
const confirmSettlementRoute = createRoute({
  method: "post",
  path: "/:id/settlements/:settlementId/confirm",
  tags: ["Settlements"],
  summary: "Xác nhận đã nhận tiền nợ",
  description: "Chỉ người nhận tiền mới có quyền gọi API này để xác nhận đã nhận chuyển khoản nợ từ con nợ.",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ID của nhóm" }),
      settlementId: z.string().openapi({ description: "ID của khoản quyết toán" }),
    }),
  },
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: ConfirmSettlementResponseSchema } },
      description: "Settlement confirmed successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid permission or already completed",
    },
    401: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Unauthorized",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Server error",
    },
  },
});

// --- ROUTE HANDLERS ---

// 1. Handler Tạo nhóm
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

// 2. Handler Lấy danh sách nhóm
groupsRouter.openapi(listGroupsRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaGroupRepository(prisma);
  const useCase = new ListUserGroupsUseCase(repo);

  try {
    const userId = c.get("userId");
    const groups = await useCase.execute(userId);
    const responseData = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? null,
      inviteCode: g.inviteCode,
    }));
    return c.json(AppResponseWithData.successWithData(responseData, "User groups retrieved successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});

// 3. Handler Lấy chi tiết nhóm
groupsRouter.openapi(getGroupDetailsRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaGroupRepository(prisma);
  const useCase = new GetGroupDetailsUseCase(repo);

  try {
    const { id } = c.req.valid("param");
    const group = await useCase.execute(id);
    if (!group) {
      return c.json(AppResponse.fail("Không tìm thấy nhóm.", null, 404), 404);
    }
    const responseData = {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      inviteCode: group.inviteCode,
      members: group.members?.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user ? {
          id: m.user.id,
          name: m.user.name,
          phoneNumber: m.user.phoneNumber,
        } : undefined,
      })),
    };
    return c.json(AppResponseWithData.successWithData(responseData, "Group details retrieved successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});

// 4. Handler Tham gia nhóm
groupsRouter.openapi(joinGroupRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaGroupRepository(prisma);
  const useCase = new JoinGroupUseCase(repo);

  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const group = await useCase.execute({
      inviteCode: body.inviteCode,
      userId,
    });
    const responseData = {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      inviteCode: group.inviteCode,
    };
    return c.json(AppResponseWithData.successWithData(responseData, "Joined group successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 400), 400);
  }
});

// 5. Handler Lấy thành viên nhóm
groupsRouter.openapi(getGroupMembersRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaGroupRepository(prisma);
  const useCase = new GetGroupMembersUseCase(repo);

  try {
    const { id } = c.req.valid("param");
    const members = await useCase.execute(id);
    const responseData = members.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user ? {
        id: m.user.id,
        name: m.user.name,
        phoneNumber: m.user.phoneNumber,
      } : undefined,
    }));
    return c.json(AppResponseWithData.successWithData(responseData, "Group members retrieved successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});

// 6. Handler Lấy số dư và công nợ tối giản
groupsRouter.openapi(getBalancesRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const groupRepo = new PrismaGroupRepository(prisma);
  const expenseRepo = new PrismaExpenseRepository(prisma);
  const useCase = new CalculateBalancesUseCase(groupRepo, expenseRepo);

  try {
    const { id: groupId } = c.req.valid("param");
    const result = await useCase.execute(groupId);
    return c.json(AppResponseWithData.successWithData(result, "Calculated balances and debts successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});

// 7. Handler Chốt sổ nhóm (Tạo phiên quyết toán)
groupsRouter.openapi(createSessionRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const groupRepo = new PrismaGroupRepository(prisma);
  const expenseRepo = new PrismaExpenseRepository(prisma);
  const settlementRepo = new PrismaSettlementRepository(prisma);
  const useCase = new CreateSettlementSessionUseCase(groupRepo, expenseRepo, settlementRepo);

  try {
    const { id: groupId } = c.req.valid("param");
    const createdById = c.get("userId");
    const body = await c.req.json();

    const session = await useCase.execute({
      groupId,
      createdById,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    const responseData = {
      id: session.id,
      groupId: session.groupId,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate.toISOString(),
      status: session.status,
      createdById: session.createdById,
      settlements: session.settlements?.map((s) => ({
        id: s.id,
        groupId: s.groupId,
        payerId: s.payerId,
        receiverId: s.receiverId,
        amount: Number(s.amount),
        paymentMethod: s.paymentMethod,
        status: s.status,
        description: s.description ?? null,
        settlementSessionId: s.settlementSessionId ?? null,
      })) || [],
    };

    return c.json(AppResponseWithData.successWithData(responseData, "Settlement session created successfully", 201), 201);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 400), 400);
  }
});

// 8. Handler Danh sách các phiên quyết toán
groupsRouter.openapi(listSessionsRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaSettlementRepository(prisma);

  try {
    const { id: groupId } = c.req.valid("param");
    const sessions = await repo.listSessionsByGroupId(groupId);
    const responseData = sessions.map((s) => ({
      id: s.id,
      groupId: s.groupId,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      status: s.status,
      createdById: s.createdById,
    }));
    return c.json(AppResponseWithData.successWithData(responseData, "Retrieved sessions successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});

// 9. Handler Xem chi tiết phiên quyết toán
groupsRouter.openapi(getSessionDetailsRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaSettlementRepository(prisma);

  try {
    const { sessionId } = c.req.valid("param");
    const session = await repo.getSessionById(sessionId);
    if (!session) {
      return c.json(AppResponse.fail("Không tìm thấy phiên quyết toán này.", null, 404), 404);
    }

    const responseData = {
      id: session.id,
      groupId: session.groupId,
      startDate: session.startDate.toISOString(),
      endDate: session.endDate.toISOString(),
      status: session.status,
      createdById: session.createdById,
      settlements: session.settlements?.map((s) => ({
        id: s.id,
        groupId: s.groupId,
        payerId: s.payerId,
        receiverId: s.receiverId,
        amount: Number(s.amount),
        paymentMethod: s.paymentMethod,
        status: s.status,
        description: s.description ?? null,
        settlementSessionId: s.settlementSessionId ?? null,
        payer: s.payer ? {
          id: s.payer.id,
          name: s.payer.name,
          phoneNumber: s.payer.phoneNumber,
        } : undefined,
        receiver: s.receiver ? {
          id: s.receiver.id,
          name: s.receiver.name,
          phoneNumber: s.receiver.phoneNumber,
          bankCode: s.receiver.bankCode ?? null,
          bankAccount: s.receiver.bankAccount ?? null,
          bankAccountName: s.receiver.bankAccountName ?? null,
        } : undefined,
      })) || [],
    };

    return c.json(AppResponseWithData.successWithData(responseData, "Retrieved session details successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});

// 10. Handler Xác nhận đã trả/nhận tiền nợ
groupsRouter.openapi(confirmSettlementRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaSettlementRepository(prisma);
  const useCase = new ConfirmSettlementUseCase(repo);

  try {
    const { settlementId } = c.req.valid("param");
    const userId = c.get("userId");

    const settlement = await useCase.execute({
      settlementId,
      userId,
    });

    const responseData = {
      id: settlement.id,
      groupId: settlement.groupId,
      payerId: settlement.payerId,
      receiverId: settlement.receiverId,
      amount: Number(settlement.amount),
      paymentMethod: settlement.paymentMethod,
      status: settlement.status,
      description: settlement.description ?? null,
      settlementSessionId: settlement.settlementSessionId ?? null,
      payer: settlement.payer ? {
        id: settlement.payer.id,
        name: settlement.payer.name,
        phoneNumber: settlement.payer.phoneNumber,
      } : undefined,
      receiver: settlement.receiver ? {
        id: settlement.receiver.id,
        name: settlement.receiver.name,
        phoneNumber: settlement.receiver.phoneNumber,
        bankCode: settlement.receiver.bankCode ?? null,
        bankAccount: settlement.receiver.bankAccount ?? null,
        bankAccountName: settlement.receiver.bankAccountName ?? null,
      } : undefined,
    };

    return c.json(AppResponseWithData.successWithData(responseData, "Settlement confirmed successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 400), 400);
  }
});
