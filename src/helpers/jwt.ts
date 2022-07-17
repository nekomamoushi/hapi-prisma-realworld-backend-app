import Hapi from "@hapi/hapi";
import jwt from "jsonwebtoken";

export const API_AUTH_STATEGY = "jwt";

export const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_JWT_SECRET";
export const JWT_ALGORITHM = "HS256";
export const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 1;

export function generateJwtToken(tokenId: number): string {
  const jwtPayload = { tokenId };
  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
  });
}

interface APITokenPayload {
  tokenId: number;
}

export async function validateAPIToken(
  decoded: APITokenPayload,
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { prisma } = request.server.app;
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.tokenId,
    },
  });

  let isValid = false;
  if (user) {
    isValid = true;
  }
  return { isValid, credentials: { userId: decoded.tokenId } };
}
