// An error from our API, carrying the status code and any field errors
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  // 204 No Content (like logout): nothing to read
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Our API sends { error: "..." } or { errors: { field: [...] } }
    throw new ApiError(
      response.status,
      data.error ?? "Something went wrong",
      data.errors ?? {},
    );
  }

  return data as T;
}
