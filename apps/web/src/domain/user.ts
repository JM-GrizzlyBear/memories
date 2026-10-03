// A user as the API sends it (JSON has no Date type, so dates are strings)
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthday: string; // "2000-05-14T00:00:00.000Z"
  profilePhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
