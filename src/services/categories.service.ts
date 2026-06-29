import { apiSlice, ApiResponse } from "./base-query";

export const categoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/categories",
        method: "GET",
      }),
    }),
    categoryDetail: builder.query<ApiResponse, string | number>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "GET",
      }),
    }),
    createCategory: builder.mutation<ApiResponse, Record<string, unknown>>({
      query: (body) => ({
        url: "/admin/categories",
        method: "POST",
        body,
      }),
    }),
    updateCategory: builder.mutation<ApiResponse, { id: string | number; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({
        url: `/admin/categories/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deleteCategory: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCategoriesQuery,
  useCategoryDetailQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
