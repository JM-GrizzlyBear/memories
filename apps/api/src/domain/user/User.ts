export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  birthday: Date;
  profilePhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
