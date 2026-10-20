// An error from our API, carrying the status code and any field errors
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;
  // A machine-readable reason, when the API sends one (e.g. "invalid_link")
  readonly code?: string;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string[]> = {},
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }
}

// The body as JSON, or {} when there's none (or it isn't JSON, like an HTML error page)
async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // For file uploads, the browser must set Content-Type itself
  // (it adds a "boundary" that separates the fields), so we only set JSON for other bodies
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: isFormData
      ? options.headers
      : { "Content-Type": "application/json", ...options.headers },
  });

  if (response.status === 204) return undefined as T;

  const data = await readJson(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? "Something went wrong",
      data.errors ?? {},
      data.code,
    );
  }

  return data as T;
}
