"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePractice } from "@/features/practice/practice-provider";

export function LogPracticeButton({
  size = "default",
  className,
}: Readonly<{ size?: "default" | "lg"; className?: string }>) {
  const { openCreate } = usePractice();

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={openCreate}
    >
      <Plus aria-hidden="true" />
      Log practice
    </Button>
  );
}
