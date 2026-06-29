import { apiSlice, ApiResponse } from "./base-query";

export interface ListBooksParams {
  per_page?: number;
  page?: number;
  search?: string;
  sort?: string;
  category?: string;
  book_code?: string;
}

export const booksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listBooks: builder.query<ApiResponse, ListBooksParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());
          if (params.page !== undefined) queryParams.append("page", params.page.toString());
          if (params.search) queryParams.append("search", params.search);
          if (params.sort) queryParams.append("sort", params.sort);
          if (params.category) queryParams.append("category", params.category);
          if (params.book_code) queryParams.append("book_code", params.book_code);
        }
        const queryString = queryParams.toString();
        return {
          url: `/books${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),
    popularBooks: builder.query<ApiResponse, { limit?: number } | void>({
      query: (params) => ({
        url: `/books/popular${params?.limit ? `?limit=${params.limit}` : ""}`,
        method: "GET",
      }),
    }),
    bookDetail: builder.query<ApiResponse, string | number>({
      query: (id) => ({
        url: `/books/${id}`,
        method: "GET",
      }),
    }),
    recommendedBooks: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/books/recommended",
        method: "GET",
      }),
    }),
    // Cari buku berdasarkan book_code (scan barcode)
    searchBookByCode: builder.query<ApiResponse, string>({
      query: (book_code) => ({
        url: `/books?search=${encodeURIComponent(book_code)}&per_page=5`,
        method: "GET",
      }),
    }),
    createBook: builder.mutation<ApiResponse, Record<string, unknown> | FormData>({
      query: (body) => ({
        url: "/admin/books",
        method: "POST",
        body,
      }),
    }),
    updateBook: builder.mutation<ApiResponse, { id: string | number; data: Record<string, unknown> | FormData }>({
      query: ({ id, data }) => ({
        url: `/admin/books/${id}`,
        method: "POST", // Use POST for FormData with _method=PUT, or PUT directly if not FormData. Redux Toolkit will pass FormData over POST well with Laravel if _method is appended. Or we just use PUT. Wait, Laravel requires POST with _method=PUT for multipart forms. Let's make the component pass it.
        body: data,
      }),
    }),
    deleteBook: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/admin/books/${id}`,
        method: "DELETE",
      }),
    }),
    addBookReview: builder.mutation<ApiResponse, { id: string | number; data: { rating: number; review: string } }>({
      query: ({ id, data }) => ({
        url: `/books/${id}/reviews`,
        method: "POST",
        body: data,
      }),
    }),
    updateBookReview: builder.mutation<ApiResponse, { id: string | number; data: { rating: number; review: string } }>({
      query: ({ id, data }) => ({
        url: `/books/reviews/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deleteBookReview: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/books/reviews/${id}`,
        method: "DELETE",
      }),
    }),
    getFavoriteBooks: builder.query<ApiResponse, { per_page?: number; page?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        const queryString = queryParams.toString();
        return {
          url: `/books/favorites${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Favorites"],
    }),
    toggleFavoriteBook: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/books/${id}/favorite`,
        method: "POST",
      }),
      invalidatesTags: ["Favorites"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListBooksQuery,
  usePopularBooksQuery,
  useBookDetailQuery,
  useRecommendedBooksQuery,
  useSearchBookByCodeQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useAddBookReviewMutation,
  useUpdateBookReviewMutation,
  useDeleteBookReviewMutation,
  useGetFavoriteBooksQuery,
  useToggleFavoriteBookMutation,
} = booksApi;
