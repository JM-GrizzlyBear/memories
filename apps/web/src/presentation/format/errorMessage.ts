import { ApiError } from "../../infrastructure/api/http";

// A short, human sentence for anything that went wrong
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session ended. Please log in again.";
    if (error.status === 404) {
      return "This isn't available anymore. It may have been deleted.";
    }
    if (error.status === 413) return "That's too large to upload.";
    if (error.status >= 500) {
      return "Something went wrong on our side. Please try again.";
    }
    return error.message;
  }
  // fetch() itself failed: offline, or the server isn't reachable
  return "Can't reach Memories right now. Check your connection and try again.";
}
