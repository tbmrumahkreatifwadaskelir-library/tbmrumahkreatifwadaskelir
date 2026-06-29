import NextAuth from "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name: string;
      email: string;
      token: string;
      role: "admin" | "member";
      status: string;
      address?: string;
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    name: string;
    email: string;
    token: string;
    role: "admin" | "member";
    status: string;
    address?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    name: string;
    email: string;
    token: string;
    role: "admin" | "member";
    status: string;
    address?: string;
    phone?: string;
  }
}
