"use client";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}

export function Avatar({ src, name, email, className = "h-8 w-8" }: AvatarProps) {
  const [error, setError] = useState(false);

  // Reset error state if the src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  const getInitials = () => {
    const text = name || email || "";
    if (!text) return "";
    const parts = text.split(/[ .@_\-]+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  if (!src || error) {
    const initials = getInitials();
    return (
      <div
        className={`${className} rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0 select-none uppercase`}
        title={name || email || "User"}
      >
        {initials || <User className="h-4 w-4" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || email || "Avatar"}
      onError={() => setError(true)}
      className={`${className} rounded-full object-cover shrink-0`}
    />
  );
}
