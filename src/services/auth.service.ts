import { apiSlice } from "./base-query";
import {
  ForgotPasswordPayload,
  User,
  LoginPayload,
  VerifyOtpPayload,
  ConfirmResetPasswordPayload,
  ReactivateAccountPayload,
  AdminRegisterPayload,
} from "@/types/user";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ data: { user: User; token: string } }, LoginPayload>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    logoutAll: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout-all",
        method: "POST",
      }),
    }),

    // Register pakai FormData karena ada file upload (identity_doc)
    register: builder.mutation<{ data: { user: User } }, FormData>({
      query: (formData) => ({
        url: "/auth/register",
        method: "POST",
        body: formData,
      }),
    }),

    forgotPassword: builder.mutation<void, ForgotPasswordPayload>({
      query: (body) => ({
        url: "/password/reset",
        method: "POST",
        body,
      }),
    }),

    // UPDATE PROFILE (POST /auth/profile dengan _method=PUT sebagai form field)
    updateProfile: builder.mutation<{ data: { user: User } }, FormData>({
      query: (formData) => ({
        url: "/auth/profile",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Profile"],
    }),

    // GET PROFILE
    getProfile: builder.query<{ data: { user: User } }, void>({
      query: () => ({
        url: "/auth/profile",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    // GET PROFILE STATS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getProfileStats: builder.query<{ data: any }, void>({
      query: () => ({
        url: "/auth/profile/stats",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),
    // CHANGE PASSWORD
    changePassword: builder.mutation<
      { message: string },
      { current_password: string; password: string; password_confirmation: string }
    >({
      query: (body) => ({
        url: "/auth/password",
        method: "PUT",
        body,
      }),
    }),
    // VERIFY OTP
    verifyOtp: builder.mutation<{ data: { signature: string } }, VerifyOtpPayload>({
      query: (body) => ({
        url: "/password/verify-otp",
        method: "POST",
        body,
      }),
    }),

    // CONFIRM RESET PASSWORD
    confirmResetPassword: builder.mutation<void, ConfirmResetPasswordPayload>({
      query: (body) => ({
        url: "/password/reset-confirm",
        method: "POST",
        body,
      }),
    }),

    // REQUEST ACCOUNT REACTIVATION
    reactivateAccount: builder.mutation<void, ReactivateAccountPayload>({
      query: (body) => ({
        url: "/auth/reactivate-request",
        method: "POST",
        body,
      }),
    }),

    // REGISTRATION STATUS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registrationStatus: builder.query<{ data: any }, string>({
      query: (memberId) => ({
        url: `/registration-status/${memberId}`,
        method: "GET",
      }),
    }),

    // ADMIN REGISTER
    registerAdmin: builder.mutation<{ data: { user: User } }, AdminRegisterPayload>({
      query: (body) => ({
        url: "/admin/register",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useUpdateProfileMutation,
  useGetProfileQuery,
  useGetProfileStatsQuery,
  useChangePasswordMutation,
  useVerifyOtpMutation,
  useConfirmResetPasswordMutation,
  useReactivateAccountMutation,
  useRegistrationStatusQuery,
  useRegisterAdminMutation,
} = authApi;
