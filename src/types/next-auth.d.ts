import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    rol: string;
    buildingId: string | null;
    apartmentId: string | null;
    ad: string;
    soyad: string;
    locale?: string;
  }

  interface Session {
    user: User & {
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
    buildingId: string | null;
    apartmentId: string | null;
    ad: string;
    soyad: string;
    locale?: string;
  }
}
