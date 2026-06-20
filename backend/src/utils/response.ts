import { z } from "@hono/zod-openapi";

export class AppResponse {
  result: boolean;
  statusCode: number;
  message: string | null;
  exception: string | null;
  traceId: string | null;

  constructor(init: Partial<AppResponse>) {
    this.result = init.result ?? false;
    this.statusCode = init.statusCode ?? 200;
    this.message = init.message ?? null;
    this.exception = init.exception ?? null;
    this.traceId = init.traceId ?? crypto.randomUUID();
  }

  static success(
    message?: string | null,
    statusCode: number = 200,
  ): AppResponse {
    return new AppResponse({
      result: true,
      statusCode,
      message: message ?? "OK",
    });
  }

  static fail(
    message?: string | null,
    error?: Error | null,
    statusCode: number = 400,
  ): AppResponse {
    return new AppResponse({
      result: false,
      statusCode,
      message: message ?? error?.message ?? "Bad Request",
      exception: error?.stack ?? null,
    });
  }
}

export class AppResponseWithData<T> extends AppResponse {
  data: T;

  constructor(init: Partial<AppResponse> & { data: T }) {
    super(init);
    this.data = init.data;
  }

  static successWithData<T>(
    data: T,
    message?: string | null,
    statusCode: number = 200,
  ): AppResponseWithData<T> {
    return new AppResponseWithData<T>({
      result: true,
      statusCode,
      message: message ?? "OK",
      data,
    });
  }

  static failWithData<T>(
    data: T,
    message?: string | null,
    error?: Error | null,
    statusCode: number = 400,
  ): AppResponseWithData<T> {
    return new AppResponseWithData<T>({
      result: false,
      statusCode,
      message: message ?? error?.message ?? "Bad Request",
      exception: error?.stack ?? null,
      data,
    });
  }
}

export function createAppResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
  name: string,
) {
  return z
    .object({
      result: z.boolean(),
      statusCode: z.number(),
      message: z.string().nullable(),
      exception: z.string().nullable(),
      traceId: z.string().nullable(),
      data: dataSchema,
    })
    .openapi(`AppResponse_${name}`);
}

export const BaseAppResponseSchema = z
  .object({
    result: z.boolean(),
    statusCode: z.number(),
    message: z.string().nullable(),
    exception: z.string().nullable(),
    traceId: z.string().nullable(),
  })
  .openapi("AppResponse");
