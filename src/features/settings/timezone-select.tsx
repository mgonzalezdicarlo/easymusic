"use client";

import { Button } from "@/components/ui/button";
import { useDetectedTimezone } from "@/features/settings/use-detected-timezone";
import { cn } from "@/lib/utils";

type TimezoneSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  timezones: readonly string[];
  invalid?: boolean;
  describedBy?: string;
};

// A native select: about 400 names, with typeahead and a good picker on mobile.
export function TimezoneSelect({
  id,
  value,
  onChange,
  timezones,
  invalid,
  describedBy,
}: TimezoneSelectProps) {
  const detected = useDetectedTimezone();
  const options = timezones.includes(value) ? timezones : [value, ...timezones];

  return (
    <div className="space-y-1">
      <select
        id={id}
        name="timezone"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2 py-1 text-base transition-colors outline-none focus-visible:ring-3 aria-invalid:ring-3 md:text-sm [&>option]:bg-popover [&>option]:text-popover-foreground",
        )}
      >
        {options.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      {detected && detected !== value ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => onChange(detected)}
        >
          Use this device&apos;s timezone ({detected})
        </Button>
      ) : null}
    </div>
  );
}
