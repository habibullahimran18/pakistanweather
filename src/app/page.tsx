import { DashboardShell } from "@/components/dashboard/shell";
import { Providers } from "@/components/dashboard/providers";

export default function Page() {
  return (
    <Providers>
      <DashboardShell />
    </Providers>
  );
}
