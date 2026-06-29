import { apiSlice } from "./base-query";
import { Notification } from "@/types/notification";

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get all notifications (with paginasi)
    getNotifications: builder.query<
      {
        data: Notification[];
        unread_count: number;
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
      },
      { page: number; paginate: number; unread?: boolean }
    >({
      query: ({ page, paginate, unread }) => {
        let url = `/notifications?paginate=${paginate}&page=${page}`;
        if (unread !== undefined) {
          url += `&unread=${unread}`;
        }
        return url;
      },
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: {
          unread_count: number;
          notifications: Notification[];
          pagination: {
            current_page: number;
            last_page: number;
            total: number;
            per_page: number;
          };
        };
      }) => ({
        data: response.data.notifications,
        unread_count: response.data.unread_count,
        current_page: response.data.pagination.current_page,
        last_page: response.data.pagination.last_page,
        total: response.data.pagination.total,
        per_page: response.data.pagination.per_page,
      }),
    }),

    // ✅ Get notification by ID
    getNotificationById: builder.query<Notification, string>({
      query: (id) => `/notifications/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: Notification;
      }) => response.data,
    }),

    // ✅ Mark notification as read
    markNotificationAsRead: builder.mutation<
      { message: string },
      { id: string }
    >({
      query: (payload) => ({
        url: `/notifications/${payload.id}/read`,
        method: "POST",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => ({
        message: response.message,
      }),
    }),
    // ✅ Mark all notifications as read
    markAllNotificationsAsRead: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
      }),
    }),

    // ✅ Delete notification
    deleteNotification: builder.mutation<{ success: boolean; message: string }, string | number>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
