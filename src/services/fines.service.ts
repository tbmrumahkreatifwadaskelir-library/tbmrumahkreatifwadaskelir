import { apiSlice, ApiResponse } from "./base-query";

export const finesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    myFines: builder.query<ApiResponse, { status?: string; per_page?: number; page?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.status) queryParams.append("status", params.status);
          if (params.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());
          if (params.page !== undefined) queryParams.append("page", params.page.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: `/fines/my${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Fines"],
    }),
    myFinesSummary: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/fines/my/summary",
        method: "GET",
      }),
      providesTags: ["Fines"],
    }),
    payFine: builder.mutation<ApiResponse, { id: string | number }>({
      query: ({ id }) => ({
        url: `/fines/${id}/pay`,
        method: "POST",
      }),
      invalidatesTags: ["Fines"],
    }),
    paymentStatus: builder.query<ApiResponse, { id: string | number }>({
      query: ({ id }) => ({
        url: `/fines/${id}/payment-status`,
        method: "GET",
      }),
    }),
    adminAllFines: builder.query<ApiResponse, { status?: string; member_id?: string | number; from?: string; to?: string; search?: string; per_page?: number; page?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.status) queryParams.append("status", params.status);
          if (params.member_id) queryParams.append("member_id", params.member_id.toString());
          if (params.from) queryParams.append("from", params.from);
          if (params.to) queryParams.append("to", params.to);
          if (params.search) queryParams.append("search", params.search);
          if (params.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());
          if (params.page !== undefined) queryParams.append("page", params.page.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: `/admin/fines${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Fines"],
    }),
    adminFinesSummary: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/admin/fines/summary",
        method: "GET",
      }),
      providesTags: ["Fines"],
    }),
    adminPaymentHistory: builder.query<ApiResponse, { per_page?: number; page?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());
          if (params.page !== undefined) queryParams.append("page", params.page.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: `/admin/fines/payments${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Fines"],
    }),
    adminConfirmManualPayment: builder.mutation<ApiResponse, { id: string | number; payment_method: string; notes?: string }>({
      query: ({ id, payment_method, notes }) => ({
        url: `/admin/fines/loan/${id}/confirm-manual`,
        method: "POST",
        body: { payment_method, notes },
      }),
      invalidatesTags: ["Fines", "Loans"],
    }),
    simulateDokuWebhook: builder.mutation<unknown, { invoice_number: string; amount: number; status?: string }>({
      query: ({ invoice_number, amount, status = "SUCCESS" }) => ({
        url: `/webhooks/doku`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Id": "MOCK-CLIENT-ID",
          "Request-Id": "mock-req-id",
          "Request-Timestamp": new Date().toISOString(),
          "Signature": "HMACSHA256=mock"
        },
        body: {
          order: {
            invoice_number,
            amount
          },
          transaction: {
            status,
            date: new Date().toISOString(),
            original_request_id: "original-req-id"
          },
          channel: {
            id: "QRIS"
          }
        }
      }),
      invalidatesTags: ["Fines", "Loans"],
    }),
    adminWaiveFine: builder.mutation<ApiResponse, { id: string | number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/fines/loan/${id}/waive`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Fines", "Loans"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useMyFinesQuery,
  useMyFinesSummaryQuery,
  usePayFineMutation,
  usePaymentStatusQuery,
  useAdminAllFinesQuery,
  useAdminFinesSummaryQuery,
  useAdminPaymentHistoryQuery,
  useAdminConfirmManualPaymentMutation,
  useSimulateDokuWebhookMutation,
  useAdminWaiveFineMutation,
} = finesApi;
