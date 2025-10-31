"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isCheckingAuth = isUserLoading;

  useEffect(() => {
    // If we're still checking auth, do nothing.
    if (isCheckingAuth) {
      return;
    }

    // If auth check is done and there's no user, redirect to login
    // unless they are already trying to log in.
    if (!user && pathname !== "/admin/login") {
      router.push("/admin/login");
      return;
    }
    
    // If the user IS logged in and is on the login page, redirect to the dashboard.
    if (user && pathname === "/admin/login") {
      router.push("/admin/dashboard");
      return;
    }

  }, [user, isCheckingAuth, pathname, router]);


  // If auth state is loading, or we are about to redirect, show skeleton.
  if (isCheckingAuth || (!user && pathname !== "/admin/login")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // If the user IS logged in and is on the login page, we are redirecting so show a skeleton.
  if (user && pathname === "/admin/login") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // If all checks pass, render the children (the requested admin page).
  return <>{children}</>;
}
