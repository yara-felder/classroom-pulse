import React from "react";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-teal-700",
  "bg-emerald-700",
  "bg-cyan-700",
  "bg-sky-700",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-amber-700",
  "bg-rose-700",
];

const SIZES = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-14 h-14 text-sm",
};

const colorIndex = (key) => {
  const text = String(key || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash % COLORS.length;
};

export const initialsForStudent = (name, id) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const fromId = String(id || "").replace(/[^a-z0-9]/gi, "");
  return (fromId.slice(0, 2) || "?").toUpperCase();
};

export const StudentAvatar = ({ name, id, size = "lg", className }) => {
  const initials = initialsForStudent(name, id);
  const color = COLORS[colorIndex(id || name)];
  return (
    <span
      aria-hidden="true"
      data-testid={id ? `student-avatar-${id}` : "student-avatar"}
      className={cn(
        "inline-flex items-center justify-center shrink-0 rounded-full font-bold text-white shadow-sm select-none",
        SIZES[size] || SIZES.lg,
        color,
        className
      )}
    >
      {initials}
    </span>
  );
};
