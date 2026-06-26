"use client";

import { useEffect, useState } from "react";

interface LocalTimeProps {
  iso: string;
  className?: string;
}

export function LocalTime({ iso, className }: LocalTimeProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(
      new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, [iso]);

  if (!formatted) return null;
  return <span className={className}>{formatted}</span>;
}
