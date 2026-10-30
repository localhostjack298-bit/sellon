import { brand } from "@/config/brand";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Sign in · ${brand.name}`,
  description: "Sign in to your Stellar Family Salon account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
