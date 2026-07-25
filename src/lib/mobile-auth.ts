import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

interface MobileUser {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  rol: string;
  buildingId: string | null;
  apartmentId: string | null;
}

export async function getUser(req?: NextRequest): Promise<MobileUser | null> {
  // First try NextAuth session (web)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || "",
      ad: session.user.ad,
      soyad: session.user.soyad,
      rol: session.user.rol,
      buildingId: session.user.buildingId,
      apartmentId: session.user.apartmentId,
    };
  }

  // Then try mobile JWT token
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as MobileUser;
        return decoded;
      } catch {
        return null;
      }
    }
  }

  return null;
}
