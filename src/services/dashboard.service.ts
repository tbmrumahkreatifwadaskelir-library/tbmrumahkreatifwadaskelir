import { apiSlice, ApiResponse } from "./base-query";

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    memberDashboard: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/dashboard/member",
        method: "GET",
      }),
    }),
    adminDashboard: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/admin/dashboard",
        method: "GET",
      }),
    }),
    adminLoanTrends: builder.query<ApiResponse, { year?: number; month?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.year) queryParams.append("year", params.year.toString());
        if (params?.month) queryParams.append("month", params.month.toString());
        const queryString = queryParams.toString();
        return {
          url: `/admin/dashboard/trends${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),
    adminLiteracyAnalytics: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/admin/analytics/literacy",
        method: "GET",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useMemberDashboardQuery,
  useAdminDashboardQuery,
  useAdminLoanTrendsQuery,
  useAdminLiteracyAnalyticsQuery,
} = dashboardApi;
