// services/frontend/src/app/page.tsx
//
// Root route: redirect to /dashboard if authenticated, else to /login.
// Runs as a lightweight client component so it can read localStorage.
// The actual shell (Sidebar + Header) lives in layout.tsx and is skipped
// for public routes — this page is intentionally minimal.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Render a centered spinner while the redirect resolves.
  // This is only visible for one frame in practice.
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <LoadingSpinner variant="page" size={32} label="Redirecting…" />
    </div>
  );
}
