import { apiSlice, ApiResponse } from "./base-query";

export const eventsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listEvents: builder.query<ApiResponse, void>({
      query: () => ({
        url: "/events",
        method: "GET",
      }),
      providesTags: ["Events"],
    }),
    eventDetail: builder.query<ApiResponse, string | number>({
      query: (id) => ({
        url: `/events/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Events", id }],
    }),
    createEvent: builder.mutation<ApiResponse, FormData | Record<string, unknown>>({
      query: (body) => ({
        url: "/admin/events",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Events"],
    }),
    updateEvent: builder.mutation<ApiResponse, { id: string | number; data: FormData | Record<string, unknown> }>({
      query: ({ id, data }) => ({
        url: `/admin/events/${id}`,
        method: data instanceof FormData ? "POST" : "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Events", id }, "Events"],
    }),
    deleteEvent: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/admin/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Events"],
    }),
    addEventComment: builder.mutation<ApiResponse, { id: string | number; data: { comment: string } }>({
      query: ({ id, data }) => ({
        url: `/events/${id}/comments`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Events", id }],
    }),
    editEventComment: builder.mutation<ApiResponse, { id: string | number; data: { comment: string } }>({
      query: ({ id, data }) => ({
        url: `/events/comments/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Events"],
    }),
    deleteEventComment: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/events/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Events"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEventsQuery,
  useEventDetailQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useAddEventCommentMutation,
  useEditEventCommentMutation,
  useDeleteEventCommentMutation,
} = eventsApi;
