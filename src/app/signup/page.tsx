import { brand } from "@/config/brand";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Create account · ${brand.name}`,
  description: "Create your Stellar Family Salon account.",
};

export default function SignupPage() {
  return <SignupForm />;
}
