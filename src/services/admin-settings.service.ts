import { apiSlice, ApiResponse } from "./base-query";

export const adminSettingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminSettings: builder.query<ApiResponse<{ settings: Record<string, string | number | string[]> }>, void>({
      query: () => ({
        url: "/settings",
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
    updateAdminSettings: builder.mutation<
      ApiResponse,
      { settings: Record<string, string | number | string[]> }
    >({
      query: (body) => ({
        url: "/admin/settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} = adminSettingsApi;
