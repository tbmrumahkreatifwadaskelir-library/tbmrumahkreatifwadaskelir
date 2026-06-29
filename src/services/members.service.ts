import { apiSlice } from "./base-query";

// ─── Response Types ───────────────────────────────────────────────────────────

export interface MemberUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  email_verified_at: string | null;
  created_at: string;
}

export interface MemberData {
  id: number;
  member_code: string;
  nik_nisn: string;
  id_type: string;
  phone: string | null;
  address: string | null;
  birth_date: string;
  age: number;
  age_category: string; // 'adult' | 'child'
  guardian_name: string | null;
  verification_status: string; // 'pending' | 'verified' | 'rejected'
  verified_at: string | null;
  avatar_url: string | null;
  identity_doc_path: string | null;
  identity_doc_url?: string | null;
  total_loans: number;
  created_at: string;
  user: MemberUser;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedMembersResponse {
  members: MemberData[];
  pagination: PaginationMeta;
}

export interface UpdateMemberPayload {
  id: string | number;
  name?: string;
  email?: string;
  status?: string;
  nik_nisn?: string;
  id_type?: "ktp" | "kk" | "kartu_pelajar";
  phone?: string;
  address?: string;
  birth_date?: string;
  guardian_name?: string;
  guardian_nik?: string;
  guardian_phone?: string;
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  nik_nisn: string;
  id_type: "ktp" | "kk" | "kartu_pelajar";
  phone?: string;
  address?: string;
  birth_date?: string;
  guardian_name?: string;
  guardian_nik?: string;
  guardian_phone?: string;
  identity_doc?: File;
}

export interface VerifyMemberPayload {
  id: string | number;
  action: "approve" | "reject";
  reason?: string;
}

export interface MembersSummaryData {
  total_members: number;
  total_active_members: number;
  pending_count: number;
  approved_today: number;
  rejected_today: number;
  rejected_count: number;
}

export interface ReactivationRequest {
  id: number;
  user_id: number;
  reason: string;
  status: string;
  created_at: string;
  user: MemberUser;
}

export interface PaginatedReactivationsResponse {
  data: ReactivationRequest[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ─── API Slice ────────────────────────────────────────────────────────────────

export const membersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /admin/members/summary
    membersSummary: builder.query<ApiResponse<MembersSummaryData>, void>({
      query: () => ({
        url: "/admin/members/summary",
        method: "GET",
      }),
      providesTags: ["Members"],
    }),

    // GET /admin/members?per_page=&search=&status=
    listMembers: builder.query<ApiResponse<PaginatedMembersResponse>, Record<string, unknown> | void>({
      query: (params) => ({
        url: "/admin/members",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Members"],
    }),

    // GET /admin/members/pending
    pendingMembers: builder.query<ApiResponse<PaginatedMembersResponse>, Record<string, unknown> | void>({
      query: (params) => ({
        url: "/admin/members/pending",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: ["Members"],
    }),

    // GET /admin/members/:id
    memberDetail: builder.query<ApiResponse<MemberData>, string | number>({
      query: (id) => ({
        url: `/admin/members/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Members", id }],
    }),

    // POST /admin/members/:id/verify  { action: "approve" | "reject", reason? }
    verifyMember: builder.mutation<ApiResponse, VerifyMemberPayload>({
      query: ({ id, action, reason }) => ({
        url: `/admin/members/${id}/verify`,
        method: "POST",
        body: reason ? { action, reason } : { action },
      }),
      invalidatesTags: ["Members"],
    }),

    // PUT /admin/members/:id  { phone?, address? }
    updateMember: builder.mutation<ApiResponse, UpdateMemberPayload>({
      query: ({ id, ...body }) => ({
        url: `/admin/members/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Members",
        { type: "Members", id },
      ],
    }),

    deleteMember: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/admin/members/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Members"],
    }),

    createMember: builder.mutation<ApiResponse, FormData | CreateMemberPayload>({
      query: (body) => ({
        url: "/admin/members",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Members"],
    }),

    // GET /admin/reactivations/pending
    pendingReactivations: builder.query<ApiResponse<PaginatedReactivationsResponse>, void>({
      query: () => ({
        url: "/admin/reactivations/pending",
        method: "GET",
      }),
      providesTags: ["Members"],
    }),

    // POST /admin/reactivations/:id/verify
    verifyReactivation: builder.mutation<ApiResponse, VerifyMemberPayload>({
      query: ({ id, action, reason }) => ({
        url: `/admin/reactivations/${id}/verify`,
        method: "POST",
        body: reason ? { action, reason } : { action },
      }),
      invalidatesTags: ["Members"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useMembersSummaryQuery,
  useListMembersQuery,
  usePendingMembersQuery,
  useMemberDetailQuery,
  useVerifyMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
  useCreateMemberMutation,
  usePendingReactivationsQuery,
  useVerifyReactivationMutation,
} = membersApi;
