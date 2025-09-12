"use client";

import { useEffect, type ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This code runs only on the client
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
    setLoading(false);
    
    if (!authStatus && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [router, pathname]);

  if (loading || (!isAuthenticated && pathname !== '/admin/login')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  return <>{children}</>;
}
