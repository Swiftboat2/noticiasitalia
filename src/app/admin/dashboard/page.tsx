
import Dashboard from "@/components/admin/dashboard";

export default function DashboardPage() {
  // The Dashboard component will now handle its own data fetching on the client side.
  return (
      <Dashboard />
  );
}

// Enforce dynamic rendering
export const revalidate = 0;
