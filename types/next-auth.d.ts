import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: "admin" | "member";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "member";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "member";
  }
}
