import { cn } from "@/lib/utils";

export function BrandLogo({ className = "w-12" }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-border-soft/70 shrink-0",
        className,
      )}
      aria-label="Logo Sistem Informasi RPL NodeCraft.ID"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 6L14 14L6 22"
          stroke="#FFD166"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 6L22 14L14 22"
          stroke="#092C4C"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
