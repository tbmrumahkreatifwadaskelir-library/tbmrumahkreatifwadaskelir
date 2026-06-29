import { apiSlice } from "./base-query";
import { User, CreateUserPayload, Role } from "@/types/user";

type CreateRolePayload = { name: string };

// Type khusus untuk update password
type UpdatePasswordPayload = {
  password: string;
  password_confirmation: string;
};

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ 1. createUser (URL Updated)
    createUser: builder.mutation<User, CreateUserPayload>({
      query: (newUser) => ({
        url: "/user/users",
        method: "POST",
        body: newUser,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: User;
      }) => response.data,
    }),

    // ✅ 2. getUsers (URL Updated)
    getUsers: builder.query<
      { code: number; data: { data: User[]; last_page: number } },
      { page: number; paginate: number; search?: string; search_by?: string }
    >({
      query: ({ page, paginate, search = "", search_by = "name" }) => ({
        url: `/user/users?paginate=${paginate}&page=${page}&search=${search}&search_by=${search_by}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        data: { data: User[]; last_page: number };
      }) => response,
    }),

    // ✅ 3. updateUser (URL Updated)
    updateUser: builder.mutation<
      User,
      { id: number; payload: Partial<CreateUserPayload> }
    >({
      query: ({ id, payload }) => {
        return {
          url: `/user/users/${id}`,
          method: "PUT",
          body: payload,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        };
      },
      transformResponse: (response: { code: number; data: User }) =>
        response.data,
    }),

    // ✅ 4. deleteUser (URL Updated)
    deleteUser: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/user/users/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => response,
    }),

    // ✅ 5. updateUserStatus (URL Updated)
    updateUserStatus: builder.mutation<
      User,
      { id: number; payload: Partial<User> }
    >({
      query: ({ id, payload }) => ({
        url: `/user/users/${id}`,
        method: "PUT",
        body: payload,
      }),
    }),

    // ✅ 11. updateUserPassword (NEW)
    updateUserPassword: builder.mutation<
      { code: number; message: string },
      { id: number; payload: UpdatePasswordPayload }
    >({
      query: ({ id, payload }) => ({
        url: `/user/users/${id}/password`,
        method: "PUT",
        body: payload,
      }),
    }),

    // ✅ 12. validateUserEmail (NEW)
    validateUserEmail: builder.mutation<
      { code: number; message: string },
      number // Menerima ID user
    >({
      query: (id) => ({
        url: `/user/users/${id}/email`,
        method: "PUT", // Biasanya PUT/POST untuk trigger validasi
      }),
    }),

    // ----------------------------------------------------------------
    // ROLES SECTION
    // ----------------------------------------------------------------

    // ✅ 6. getRoles (URL Updated)
    getRoles: builder.query<Role[], void>({
      query: () => ({
        url: "/role/roles",
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: { data: Role[] };
      }) => response.data.data,
    }),

    // ✅ 7. getRoleById (URL Updated)
    getRoleById: builder.query<Role, number>({
      query: (id) => ({
        url: `/role/roles/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Role;
      }) => response.data,
    }),

    // ✅ 8. createRole (URL Updated)
    createRole: builder.mutation<Role, CreateRolePayload>({
      query: (newRole) => ({
        url: "/role/roles",
        method: "POST",
        body: newRole,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Role;
      }) => response.data,
    }),

    // ✅ 9. updateRole (URL Updated)
    updateRole: builder.mutation<
      Role,
      { id: number; payload: Partial<CreateRolePayload> }
    >({
      query: ({ id, payload }) => ({
        url: `/role/roles/${id}`,
        method: "PUT",
        body: payload,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Role;
      }) => response.data,
    }),

    // ✅ 10. deleteRole (URL Updated)
    deleteRole: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/role/roles/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => response,
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserPasswordMutation, // NEW export
  useValidateUserEmailMutation, // NEW export
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = usersApi;
