import { Suspense } from "react";
import { ReportePublico } from "@/components/app/reports/ReportePublico";

export default function ReportePage() {
  return (
    <Suspense fallback={null}>
      <ReportePublico />
    </Suspense>
  );
}
