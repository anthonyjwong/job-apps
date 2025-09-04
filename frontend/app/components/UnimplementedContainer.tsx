"use client";
import React from "react";
import { useTheme } from "../providers/ThemeProvider";

type UnimplementedProps<T extends keyof React.JSX.IntrinsicElements = "div"> = {
  as?: T;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  label?: string;
};

export function UnimplementedContainer<T extends keyof React.JSX.IntrinsicElements = "div">(
  { as, children, style, label = "unimplemented" }: UnimplementedProps<T>
) {
  const { dark: darkMode } = useTheme();
  const Tag = (as || "div") as React.ElementType;

  const theme = {
    text: darkMode ? "#f3f3f3" : "#222",
  } as const;
  const muted = darkMode ? "#9ca3af" : "#6b7280";

  return (
    <Tag
      style={{
        border: `1px solid ${darkMode ? "#7f1d1d" : "#fecaca"}`,
        background: darkMode ? "#3f1d1d" : "#fef2f2",
        borderRadius: 6,
        padding: "2px 8px",
        marginBottom: 4,
        color: theme.text,
        position: "relative",
        minHeight: 48,
        ...(style || {}),
      }}
    >
      {children}
      <span
        style={{
          position: "absolute",
          right: 8,
          bottom: 4,
          fontSize: 12,
          color: muted,
        }}
      >
        {label}
      </span>
    </Tag>
  );
}
