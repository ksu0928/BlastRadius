import { useEffect, useState } from "react";
import { LOADING_MESSAGES } from "./mockData";

export const Loading = ({ label = "Synthesizing your decision intelligence" }: { label?: string }) => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      {/* Spinner */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-accent animate-spin-slow"
          style={{ filter: "drop-shadow(0 0 16px hsl(var(--primary)))" }}
        />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse-slow" />
      </div>

      {/* Title + rotating message */}
      <div className="text-center space-y-3">
        <div className="text-2xl font-bold text-gradient">{label}</div>
        <div key={msgIdx} className="text-sm text-muted-foreground animate-fade-up min-h-[1.5rem]">
          {LOADING_MESSAGES[msgIdx]}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {LOADING_MESSAGES.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-500"
            style={{
              background: i <= msgIdx % 5 ? "hsl(var(--primary))" : "hsl(var(--border))",
              boxShadow: i <= msgIdx % 5 ? "0 0 8px hsl(var(--primary))" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};
