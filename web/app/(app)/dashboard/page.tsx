"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InicioView } from "@/components/app/dashboard/InicioView";

function DashboardRedirectGuard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("tab");
    const qs = nextParams.toString();

    if (tab === "cuentas" || tab === "salud-cuentas") {
      router.replace(`/dashboard/salud-cuentas${qs ? `?${qs}` : ""}`);
    } else if (tab === "equipo") {
      router.replace(`/dashboard/equipo${qs ? `?${qs}` : ""}`);
    }
  }, [router, searchParams]);

  return null;
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={null}>
        <DashboardRedirectGuard />
        <InicioView />
      </Suspense>
    </>
  );
}
