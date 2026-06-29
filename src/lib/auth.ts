import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 jam
  },
  jwt: {
    maxAge: 60 * 60 * 24, // 24 jam
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;

        // Step 1: Login untuk mendapatkan token
        const loginRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          }
        );

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          throw new Error(loginData?.message || "Email atau password salah.");
        }

        if (!loginData?.data?.token) return null;

        const token = loginData.data.token;

        // Step 2: Ambil data lengkap user dari /auth/profile
        // Response admin → tidak ada member object
        // Response member → ada member object dengan member_code, age_category, dll
        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        const meData = await meRes.json();
        const user = meData?.data?.user;

        if (!meRes.ok || !user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          token: token,
          role: user.role,
          status: user.status,
          // Avatar: member pakai avatar_url dari member object, admin dari user
          avatar_url: user.member?.avatar_url ?? user.avatar_url ?? null,
          // Address & phone: prioritaskan dari member object (member punya data tersendiri)
          address: user.member?.address ?? user.address ?? null,
          phone: user.member?.phone ?? user.phone ?? null,
          // Data khusus member (null untuk admin)
          member: user.member
            ? {
                id: user.member.id,
                member_code: user.member.member_code,
                nik_nisn: user.member.nik_nisn,
                id_type: user.member.id_type,
                birth_date: user.member.birth_date,
                age: user.member.age,
                age_category: user.member.age_category,
                guardian_name: user.member.guardian_name,
                verification_status: user.member.verification_status,
                verified_at: user.member.verified_at,
              }
            : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Cast ke tipe extended kita (next-auth.d.ts augmentation)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extUser = user as any;
        token.id = extUser.id as number;
        token.email = extUser.email as string;
        token.name = extUser.name as string;
        token.token = extUser.token as string;
        token.role = extUser.role as "admin" | "member";
        token.status = extUser.status as string;
        token.avatar_url = (extUser.avatar_url as string | null) ?? null;
        if (extUser.address) token.address = extUser.address as string;
        if (extUser.phone) token.phone = extUser.phone as string;
        // Simpan data member jika ada (null untuk admin)
        token.member = extUser.member ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extSession = session.user as any;
        extSession.id = token.id;
        extSession.token = token.token;
        extSession.role = token.role;
        extSession.status = token.status;
        extSession.avatar_url = token.avatar_url ?? null;
        if (token.address) extSession.address = token.address;
        if (token.phone) extSession.phone = token.phone;
        // Teruskan data member ke session (null untuk admin)
        extSession.member = token.member ?? null;
      }
      return session;
    },
  },
};
