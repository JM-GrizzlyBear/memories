// The checklist under "Choose a new password" (the API checks the same rules)
export function passwordChecklist(password: string, confirm: string) {
  return [
    { id: "length", label: "At least 8 characters", met: password.length >= 8 },
    {
      id: "match",
      label: "Both passwords match",
      met: password.length > 0 && password === confirm,
    },
  ];
}
