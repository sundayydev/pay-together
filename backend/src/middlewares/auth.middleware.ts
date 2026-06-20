import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const jwtSecret = c.env.JWT_SECRET || "fallback-secret-for-dev";
    const payload = await verify(token, jwtSecret, "HS256");
    c.set("userId", payload.sub as string);
    await next();
  } catch (error) {
    return c.json({ success: false, error: "Unauthorized: Token verification failed" }, 401);
  }
}
