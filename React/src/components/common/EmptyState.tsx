import CourtLinePattern from "./CourtLinePattern";

type EmptyStateProps = {
  message: string;
  cta?: { label: string; onClick: () => void };
  variant?: "default" | "compact";
};

export default function EmptyState({ message, cta, variant = "default" }: EmptyStateProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center text-center ${variant === "default" ? "py-12 md:py-16" : "py-6 md:py-8"} rounded-3xl bg-text-light-soft border border-container-border overflow-hidden`}>
      <CourtLinePattern className="absolute inset-0 m-auto h-full w-full max-w-md opacity-100" />
      <div className="relative z-10 flex flex-col items-center gap-4 px-6">
        <p className="font-lato text-base md:text-lg text-text">{message}</p>
        {cta && (
          <button type="button" onClick={cta.onClick} className="rounded-2xl bg-primary px-6 py-3 font-lato font-bold text-secondary lift-on-hover">
            {cta.label}
          </button>
        )}
      </div>
    </div>
  );
}
