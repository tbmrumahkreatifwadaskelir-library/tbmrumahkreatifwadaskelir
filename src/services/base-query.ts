import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: async (headers) => {
    const session = await getSession();
    if (session?.user.token) {
      headers.set("Authorization", `Bearer ${session.user.token}`);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event('session-expired'));
    }
  }
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Profile", "Books", "Categories", "Loans", "Members", "Users", "Events", "Notifications", "Favorites", "Fines", "Settings"],
  endpoints: () => ({}),
});

