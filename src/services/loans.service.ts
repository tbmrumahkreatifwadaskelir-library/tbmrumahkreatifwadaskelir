import { apiSlice, ApiResponse } from "./base-query";

export interface ListLoansParams {
  per_page?: number;
  page?: number;
  status?: string;
  search?: string;
}

export const loansApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    myLoans: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/loans/my",
        method: "GET",
      }),
      providesTags: ["Loans"],
    }),
    adminAllLoans: builder.query<ApiResponse, ListLoansParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());
          if (params.page !== undefined) queryParams.append("page", params.page.toString());
          if (params.status) queryParams.append("status", params.status);
          if (params.search) queryParams.append("search", params.search);
        }
        const queryString = queryParams.toString();
        return {
          url: `/admin/loans${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),
    adminPendingLoans: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/admin/loans/pending",
        method: "GET",
      }),
    }),
    adminOverdueLoans: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/admin/loans/overdue",
        method: "GET",
      }),
    }),
    adminLoanDetail: builder.query<ApiResponse, string | number>({
      query: (id) => ({
        url: `/admin/loans/${id}`,
        method: "GET",
      }),
    }),
    createLoan: builder.mutation<ApiResponse, {
      book_id: number | string;
      loan_duration?: number;
      delivery_method?: "pickup" | "delivery";
      delivery_address?: string;
      delivery_notes?: string;
    }>({
      query: (body) => ({
        url: "/loans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loans"],
    }),
    extendLoan: builder.mutation<ApiResponse, { id: string | number; days_requested: number; reason?: string }>({
      query: ({ id, days_requested, reason }) => ({
        url: `/loans/${id}/extend`,
        method: "POST",
        body: { days_requested, reason },
      }),
      invalidatesTags: ["Loans"],
    }),
    approveLoan: builder.mutation<ApiResponse, { id: string | number; delivery_fee?: number }>({
      query: ({ id, delivery_fee }) => ({
        url: `/admin/loans/${id}/approve`,
        method: "POST",
        body: delivery_fee !== undefined ? { delivery_fee } : undefined,
      }),
      invalidatesTags: ["Loans"],
    }),
    rejectLoan: builder.mutation<ApiResponse, { id: string | number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/loans/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
    }),
    returnLoan: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/admin/loans/${id}/return`,
        method: "POST",
      }),
    }),
    updateDeliveryStatus: builder.mutation<ApiResponse, { id: string | number; delivery_status: string; admin_notes?: string }>({
      query: ({ id, delivery_status, admin_notes }) => ({
        url: `/admin/loans/${id}/delivery-status`,
        method: "POST",
        body: { delivery_status, admin_notes },
      }),
      invalidatesTags: ["Loans"],
    }),
    retryDeliveryPayment: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/loans/${id}/delivery-pay`,
        method: "POST",
      }),
      invalidatesTags: ["Loans"],
    }),
    scanLoan: builder.mutation<ApiResponse, { book_code: string; member_code: string }>({
      query: (body) => ({
        url: "/admin/loans/scan/loan",
        method: "POST",
        body,
      }),
    }),
    scanReturn: builder.mutation<ApiResponse, { book_code: string }>({
      query: (body) => ({
        url: "/admin/loans/scan/return",
        method: "POST",
        body,
      }),
    }),
    adminPendingExtensions: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/admin/loans/extensions/pending",
        method: "GET",
      }),
    }),
    adminVerifyExtension: builder.mutation<ApiResponse, { id: string | number; action: 'approve' | 'reject'; rejection_reason?: string }>({
      query: ({ id, action, rejection_reason }) => ({
        url: `/admin/loans/extensions/${id}/verify`,
        method: "POST",
        body: { action, rejection_reason: rejection_reason || "" },
      }),
      invalidatesTags: ["Loans"],
    }),
    getDigitalStreamUrl: builder.mutation<ApiResponse, string>({
      query: (token) => ({
        url: `/digital-access/${token}/read-link`,
        method: "POST",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useMyLoansQuery,
  useAdminAllLoansQuery,
  useAdminPendingLoansQuery,
  useAdminOverdueLoansQuery,
  useAdminLoanDetailQuery,
  useCreateLoanMutation,
  useExtendLoanMutation,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useReturnLoanMutation,
  useScanLoanMutation,
  useScanReturnMutation,
  useAdminPendingExtensionsQuery,
  useAdminVerifyExtensionMutation,
  useRetryDeliveryPaymentMutation,
  useUpdateDeliveryStatusMutation,
  useGetDigitalStreamUrlMutation,
} = loansApi;
