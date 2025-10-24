import Dashboard from "@/components/admin/dashboard";

export default function DashboardPage() {
  // The Dashboard component will now handle its own data fetching on the client side.
  // We pass empty arrays for the initial state.
  return (
      <Dashboard initialNews={[]} initialTickerMessages={[]} />
  );
}

// Enforce dynamic rendering
export const revalidate = 0;
