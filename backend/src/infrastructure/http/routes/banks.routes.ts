import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { VietQRService } from "../../../infrastructure/services/vietqr.service";
import { BanksController } from "../../../adapters/controllers/banks.controller";

type Bindings = {
  DATABASE_URL: string;
  VIETQR_API_URL: string;
};

export const banksRouter = new OpenAPIHono<{ Bindings: Bindings }>();

const BankSchema = z.object({
  id: z.number(),
  bin: z.string(),
  code: z.string(),
  name: z.string(),
  shortName: z.string(),
  logoUrl: z.string().nullable(),
  appCode: z.string().nullable(),
  isActive: z.boolean(),
}).openapi("Bank");

import { createAppResponseSchema, BaseAppResponseSchema } from "../../../utils/response";

const BanksResponseSchema = createAppResponseSchema(z.array(BankSchema), "Banks");
const ErrorResponseSchema = BaseAppResponseSchema;

const banksRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Banks"],
  summary: "Lấy danh sách ngân hàng",
  description: "Truy vấn danh sách ngân hàng đang hoạt động trực tiếp từ VietQR API.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BanksResponseSchema,
        },
      },
      description: "Retrieve list of active banks",
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

banksRouter.openapi(banksRoute, async (c) => {
  const service = new VietQRService(c.env.VIETQR_API_URL);
  const controller = new BanksController(service);
  return controller.getBanks(c);
});
