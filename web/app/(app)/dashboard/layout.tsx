"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DashboardSubNav } from "@/components/app/DashboardSubNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="hubly-touch" style={{ width: "100%", minWidth: 0 }}>
      <Suspense fallback={null}>
        <DashboardSubNav />
        <div key={pathname} className="tablero-aparece">
          {children}
        </div>
      </Suspense>
    </div>
  );
}
