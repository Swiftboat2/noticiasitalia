"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login,
    // unless we are already on the login page.
    if (!isUserLoading && !user && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [user, isUserLoading, router, pathname]);

  // While loading auth state, show a skeleton screen.
  // Also show skeleton if we are about to redirect.
  if (isUserLoading || (!user && pathname !== "/admin/login")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  // If we are on the login page and the user IS authenticated, redirect to dashboard
  if (user && pathname === "/admin/login") {
    router.push("/admin/dashboard");
    return (
       <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
