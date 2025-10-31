"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  // Memoize the document reference to prevent re-renders
  const adminRoleRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [user, firestore]);

  // Use the useDoc hook to check for the existence of the admin role document
  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);
  
  const isAdmin = !!adminRole;
  const isCheckingAuth = isUserLoading || isAdminLoading;

  useEffect(() => {
    // If we're still checking auth, do nothing.
    if (isCheckingAuth) {
      return;
    }

    // If auth check is done and there's no user, redirect to login
    // unless they are already trying to log in.
    if (!user) {
      if (pathname !== "/admin/login") {
        router.push("/admin/login");
      }
      return;
    }

    // If the user is logged in but is NOT an admin, and is trying to access
    // something other than the login page, redirect them away.
    if (user && !isAdmin && pathname !== "/admin/login") {
      router.push("/");
    }
  }, [user, isAdmin, isCheckingAuth, pathname, router]);


  // If auth state is loading, or we are about to redirect, show skeleton.
  if (isCheckingAuth || (!user && pathname !== "/admin/login")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // If the user IS an admin and is on the login page, redirect to the dashboard.
  if (user && isAdmin && pathname === "/admin/login") {
    router.push("/admin/dashboard");
    // Show a skeleton while redirecting
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
    // If the user is authenticated but not an admin, and not on the login page, don't show admin content
  if (user && !isAdmin && pathname !== '/admin/login') {
    // Already redirecting, show a message while redirecting.
    return (
      <div className="flex h-screen items-center justify-center">
        <p>No tienes permiso para acceder a esta página.</p>
      </div>
    );
  }


  // If all checks pass, render the children (the requested admin page).
  return <>{children}</>;
}
