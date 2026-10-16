import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import "../../../application/query/mutationMeta";
import { ApiError } from "../../../infrastructure/api/http";
import { errorMessage } from "../../format/errorMessage";

// A red toast whenever an action fails (saving, deleting, liking, friend actions...).
// Problems with a field ("Title is required") stay under that field instead.
export function ErrorToasts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "error") return;

      const meta = event.mutation.options.meta;
      if (meta?.errorToast === false) return;

      const error = event.action.error;
      const isFieldProblem =
        error instanceof ApiError && Object.keys(error.fieldErrors).length > 0;
      if (isFieldProblem) return;

      // An ended session always says so (you're taken to the login page)
      const sessionEnded = error instanceof ApiError && error.status === 401;
      const custom = sessionEnded
        ? null
        : typeof meta?.errorMessage === "function"
          ? meta.errorMessage(error)
          : meta?.errorMessage;
      toast.error(custom ?? errorMessage(error), {
        id: sessionEnded ? "session-ended" : undefined, // only one of these at a time
        duration: 6000,
      });
    });
  }, [queryClient]);

  return null;
}
