import { apiSlice, ApiResponse } from "./base-query";

export interface LogFilterParams {
  type?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

export const logsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    allLogs: builder.query<ApiResponse, LogFilterParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.type) queryParams.append("type", params.type);
          if (params.from) queryParams.append("from", params.from);
          if (params.to) queryParams.append("to", params.to);
        }
        const queryString = queryParams.toString();
        return {
          url: `/admin/logs${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),
    logTypes: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/admin/logs/types",
        method: "GET",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useAllLogsQuery,
  useLogTypesQuery,
} = logsApi;
