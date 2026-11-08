import { StatusChip } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StatusTiketType } from "../types";

export function TicketStatusWithSteps({ status }: { status: StatusTiketType }) {
  const activeStepCount =
    status === "Ditugaskan"
      ? 1
      : status === "Dikerjakan"
        ? 2
        : status === "Menunggu_Verifikasi"
          ? 3
          : status === "Tercapai"
            ? 4
            : 3; // Ditolak shows 3 steps with step 3 in danger color

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <StatusChip status={status} />
      <div className="flex items-center gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => {
          const isDangerStep = status === "Ditolak" && step === 3;
          const isActive = step <= activeStepCount;
          return (
            <span
              key={step}
              className={cn(
                "h-1.5 w-3.5 rounded-full transition-colors",
                isDangerStep
                  ? "bg-danger"
                  : isActive
                    ? "bg-primary"
                    : "bg-border-soft",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
