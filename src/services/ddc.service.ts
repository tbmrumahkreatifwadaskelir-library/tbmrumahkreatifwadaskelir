import { apiSlice, ApiResponse } from "./base-query";

export const ddcApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listMainClasses: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/ddc",
        method: "GET",
      }),
    }),
    searchDdc: builder.query<ApiResponse, string>({
      query: (q) => ({
        url: `/ddc/search?q=${encodeURIComponent(q)}`,
        method: "GET",
      }),
    }),
    suggestDdc: builder.query<ApiResponse, string>({
      query: (q) => ({
        url: `/ddc/suggest?q=${encodeURIComponent(q)}`,
        method: "GET",
      }),
    }),
    showDdcDetail: builder.query<ApiResponse, string>({
      query: (code) => ({
        url: `/ddc/${code}`,
        method: "GET",
      }),
    }),
    booksByDdc: builder.query<ApiResponse, { code: string; search?: string; page?: number; per_page?: number; sort?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append("search", params.search);
        if (params.page !== undefined) queryParams.append("page", params.page.toString());
        if (params.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());
        if (params.sort) queryParams.append("sort", params.sort);
        const queryString = queryParams.toString();
        return {
          url: `/ddc/${params.code}/books${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMainClassesQuery,
  useSearchDdcQuery,
  useSuggestDdcQuery,
  useShowDdcDetailQuery,
  useBooksByDdcQuery,
} = ddcApi;
