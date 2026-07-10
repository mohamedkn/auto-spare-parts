import { cookies } from "next/headers";
import { verifyToken, AuthTokenPayload } from "./jwt";

export async function getUserSession(): Promise<AuthTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}
