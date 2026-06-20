import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getPrisma } from "../../../infrastructure/database/prisma";
import { PrismaExpenseRepository } from "../../../adapters/repositories/prisma-expense.repository";
import { CreateExpenseUseCase } from "../../../usecases/expenses/create-expense.usecase";
import { ListExpensesUseCase } from "../../../usecases/expenses/list-expenses.usecase";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { createAppResponseSchema, BaseAppResponseSchema, AppResponse, AppResponseWithData } from "../../../utils/response";

type Bindings = {
  DATABASE_URL: string;
};

type Variables = {
  userId: string;
};

// expensesRouter sẽ được mount tại "/api/groups/:groupId/expenses"
export const expensesRouter = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>();

// Bảo vệ tất cả các tuyến đường
expensesRouter.use("/*", authMiddleware);

// --- SCHEMAS ---

const CreateExpenseInputSchema = z.object({
  paidById: z.string().min(1).openapi({ description: "ID người chi trả khoản tiền này" }),
  amount: z.number().gt(0).openapi({ description: "Tổng số tiền chi tiêu" }),
  description: z.string().min(1).openapi({ description: "Mô tả nội dung chi tiêu" }),
  expenseDate: z.string().optional().openapi({ description: "Ngày chi tiêu (định dạng ISO 8601)" }),
  splits: z.array(
    z.object({
      userId: z.string().openapi({ description: "ID thành viên tham gia chia tiền" }),
      amount: z.number().optional().nullable().openapi({ description: "Số tiền cụ thể nếu tự phân bổ (tùy chọn)" }),
    })
  ).openapi({ description: "Danh sách thành viên tham gia chia tiền" }),
}).openapi("CreateExpenseInput");

const ExpenseSplitSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  user: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
}).openapi("ExpenseSplit");

const ExpenseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  paidById: z.string(),
  amount: z.number(),
  description: z.string(),
  expenseDate: z.string(),
  status: z.enum(["PENDING", "SETTLED"]),
  paidBy: z.object({
    id: z.string(),
    name: z.string(),
    phoneNumber: z.string(),
  }).optional(),
  splits: z.array(ExpenseSplitSchema),
}).openapi("Expense");

const CreateExpenseResponseSchema = createAppResponseSchema(ExpenseSchema, "CreateExpense");
const ListExpensesResponseSchema = createAppResponseSchema(z.array(ExpenseSchema), "ListExpenses");
const ErrorResponseSchema = BaseAppResponseSchema;

// --- ROUTE DEFINITIONS ---

// 1. Tạo khoản chi tiêu mới
const createExpenseRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Expenses"],
  summary: "Tạo khoản chi tiêu mới",
  description: "Ghi nhận khoản chi tiêu mới của nhóm và tự động phân bổ chia nợ giữa các thành viên tham gia.",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateExpenseInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: CreateExpenseResponseSchema } },
      description: "Expense created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error or invalid split values",
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

// 2. Lịch sử chi tiêu của nhóm
const listExpensesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Expenses"],
  summary: "Lịch sử chi tiêu",
  description: "Lấy danh sách toàn bộ các khoản chi tiêu đang hoạt động của nhóm.",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: ListExpensesResponseSchema } },
      description: "List of expenses retrieved successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Validation error or invalid parameters",
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

// 1. Handler Tạo khoản chi
expensesRouter.openapi(createExpenseRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaExpenseRepository(prisma);
  const useCase = new CreateExpenseUseCase(repo);

  try {
    const groupId = c.req.param("groupId");
    if (!groupId) {
      return c.json(AppResponse.fail("Không tìm thấy groupId trong đường dẫn.", null, 400), 400);
    }
    const createdById = c.get("userId");
    const body = await c.req.json();

    const expense = await useCase.execute({
      groupId,
      paidById: body.paidById,
      amount: body.amount,
      description: body.description,
      expenseDate: body.expenseDate,
      createdById,
      splits: body.splits,
    });

    const responseData = {
      id: expense.id,
      groupId: expense.groupId,
      paidById: expense.paidById,
      amount: Number(expense.amount),
      description: expense.description,
      expenseDate: expense.expenseDate.toISOString(),
      status: expense.status,
      paidBy: expense.paidBy ? {
        id: expense.paidBy.id,
        name: expense.paidBy.name,
        phoneNumber: expense.paidBy.phoneNumber,
      } : undefined,
      splits: expense.splits?.map((s) => ({
        id: s.id,
        userId: s.userId,
        amount: Number(s.amount),
        user: s.user ? {
          id: s.user.id,
          name: s.user.name,
        } : undefined,
      })) || [],
    };

    return c.json(AppResponseWithData.successWithData(responseData, "Expense created successfully", 201), 201);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 400), 400);
  }
});

// 2. Handler Lịch sử chi tiêu
expensesRouter.openapi(listExpensesRoute, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const repo = new PrismaExpenseRepository(prisma);
  const useCase = new ListExpensesUseCase(repo);

  try {
    const groupId = c.req.param("groupId");
    if (!groupId) {
      return c.json(AppResponse.fail("Không tìm thấy groupId trong đường dẫn.", null, 400), 400);
    }
    const expenses = await useCase.execute(groupId);

    const responseData = expenses.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      paidById: e.paidById,
      amount: Number(e.amount),
      description: e.description,
      expenseDate: e.expenseDate.toISOString(),
      status: e.status,
      paidBy: e.paidBy ? {
        id: e.paidBy.id,
        name: e.paidBy.name,
        phoneNumber: e.paidBy.phoneNumber,
      } : undefined,
      splits: e.splits?.map((s) => ({
        id: s.id,
        userId: s.userId,
        amount: Number(s.amount),
        user: s.user ? {
          id: s.user.id,
          name: s.user.name,
        } : undefined,
      })) || [],
    }));

    return c.json(AppResponseWithData.successWithData(responseData, "Group expenses retrieved successfully", 200), 200);
  } catch (error: any) {
    return c.json(AppResponse.fail(error.message, error, 500), 500);
  }
});
