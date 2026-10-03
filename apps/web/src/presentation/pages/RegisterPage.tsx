import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function RegisterPage() {
  return (
    <AuthLayout
      title="Register"
      subtitle="Create your account. It only takes a minute."
    >
      <div className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
        />
        <Input
          id="password"
          label="Password"
          type="password"
          error="Password must be at least 8 characters"
        />
        <Button>Register</Button>
        <Button isLoading>Register</Button>
      </div>
    </AuthLayout>
  );
}
