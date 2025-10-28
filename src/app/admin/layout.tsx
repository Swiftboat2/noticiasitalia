"use client";

import { useEffect, type ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as FirebaseUser } from 'firebase/auth';

type CustomUser = FirebaseUser & {
  isAdmin?: boolean;
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for user to be loaded
    }

    if (!user) {
      // If loading is finished and there's no user, redirect to login,
      // unless we are already on the login page.
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
      setIsCheckingAdmin(false);
      return;
    }

    // User is authenticated, check for admin claim
    (user as CustomUser).getIdTokenResult()
      .then((idTokenResult) => {
        const isAdminClaim = !!idTokenResult.claims.admin;
        setIsAdmin(isAdminClaim);
        
        if (!isAdminClaim && pathname !== '/admin/login') {
            // If the user is not an admin and not trying to log in,
            // redirect them away. For now, we'll send them to the home page.
            router.push('/');
        }
      })
      .catch(() => {
        setIsAdmin(false);
        if (pathname !== '/admin/login') {
          router.push('/');
        }
      })
      .finally(() => {
        setIsCheckingAdmin(false);
      });

  }, [user, isUserLoading, router, pathname]);

  // Determine loading state
  const isLoading = isUserLoading || isCheckingAdmin;
  
  // Show skeleton while loading auth state or admin status.
  // Also show skeleton if we are about to redirect.
  if (isLoading || (!user && pathname !== "/admin/login")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  // If we are on the login page and the user IS authenticated as an admin, redirect to dashboard
  if (user && isAdmin && pathname === "/admin/login") {
    router.push("/admin/dashboard");
    return (
       <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // If the user is authenticated but not an admin, and not on the login page, don't show admin content
  if (user && !isAdmin && pathname !== '/admin/login') {
    // Already redirecting, show skeleton
    return (
      <div className="flex h-screen items-center justify-center">
        <p>No tienes permiso para acceder a esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}
