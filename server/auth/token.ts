import jwt from "jsonwebtoken";

const SECRET = process.env.ADVANCED_AI_JWT_SECRET || (() => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADVANCED_AI_JWT_SECRET environment variable is required in production");
  }
  console.warn("⚠️  Using development JWT secret. Set ADVANCED_AI_JWT_SECRET in production!");
  return "dev-only-secret-change-in-production";
})();

export function signAA(userId: string) {
  return jwt.sign({ sub: userId, scope: "advanced-ai" }, SECRET, { expiresIn: "12h" });
}

export function verifyAA(token?: string) {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as { sub: string; scope: string; iat: number; exp: number };
  } catch {
    return null;
  }
}
