export interface ApiError {
  status?: number;
  data?: {
    message?: string;
  };
}


interface ApiErrorResponse {
  status: number;
  data: {
    code?: number;
    message: string;
    errors?: Record<string, string[]>; 
  };
}

export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as Record<string, unknown>).data === "object"
  );
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.data.message || "Terjadi kesalahan pada server.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak diketahui.";
}
