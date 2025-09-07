
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { OptimizationDashboard } from "@/components/optimization-dashboard";

export default function HomePage() {
  return (
    <AuthWrapper>
      <OptimizationDashboard />
    </AuthWrapper>
  );
}
