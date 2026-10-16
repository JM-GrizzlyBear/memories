import { z } from "zod";
import { ApiError } from "../../infrastructure/api/http";

// zod's errors → the first message for each field
export function firstErrors<Field extends string>(
  error: z.ZodError,
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  const fieldMessages = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  for (const [field, messages] of Object.entries(fieldMessages)) {
    if (messages?.[0]) errors[field as Field] = messages[0];
  }
  return errors;
}

// An error from the API → messages under fields, or one message for the whole form
export function apiErrorMessages<Field extends string>(
  error: unknown,
): {
  fields: Partial<Record<Field, string>>;
  form: string | null;
} {
  if (!(error instanceof ApiError)) {
    return { fields: {}, form: "Something went wrong. Please try again." };
  }
  const fields = Object.fromEntries(
    Object.entries(error.fieldErrors).map(([field, messages]) => [
      field,
      messages[0],
    ]),
  ) as Partial<Record<Field, string>>;
  return {
    fields,
    form: Object.keys(fields).length > 0 ? null : error.message,
  };
}
