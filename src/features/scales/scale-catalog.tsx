"use client";

import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENERIC_ERROR } from "@/features/auth/messages";
import { type TrackScaleBody, trackScaleRequest } from "@/features/scales/api";
import {
  ALL_MODES,
  type CatalogScale,
  filterScales,
  groupByKey,
  type ModeFilter,
  SCALE_MODES,
  scaleName,
} from "@/features/scales/catalog";
import { toFormFailure } from "@/features/settings/api";
import { cn } from "@/lib/utils";

// E4-02 replaces this with a configuration dialog. Until then a scale is tracked with a
// common starting setup that the API accepts.
const DEFAULT_TRACKING: Omit<TrackScaleBody, "scaleId"> = {
  octaves: 2,
  handsMode: "TOGETHER",
  targetBpm: 100,
};

type ScaleCatalogProps = {
  scales: readonly CatalogScale[];
  /** Active tracked configurations per scale id. Scales that are not tracked are missing. */
  trackedCounts: Readonly<Record<string, number>>;
};

export function ScaleCatalog({
  scales,
  trackedCounts,
}: Readonly<ScaleCatalogProps>) {
  const id = useId();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<ModeFilter>(ALL_MODES);
  // Scales tracked in this visit, shown at once while the server data refreshes.
  const [justTracked, setJustTracked] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const visible = useMemo(
    () => filterScales(scales, { search, mode }),
    [scales, search, mode],
  );
  const groups = useMemo(() => groupByKey(visible), [visible]);

  const trackedCount = (scaleId: string) =>
    Math.max(trackedCounts[scaleId] ?? 0, justTracked.has(scaleId) ? 1 : 0);
  const totalTracked = scales.filter((s) => trackedCount(s.id) > 0).length;
  const filtersActive = search.trim() !== "" || mode !== ALL_MODES;

  function clearFilters() {
    setSearch("");
    setMode(ALL_MODES);
  }

  async function track(scale: CatalogScale) {
    setPendingId(scale.id);

    try {
      await trackScaleRequest({ scaleId: scale.id, ...DEFAULT_TRACKING });
      setJustTracked((current) => new Set(current).add(scale.id));
      toast.success(`${scaleName(scale)} is now tracked.`);
      router.refresh();
    } catch (error) {
      toast.error(toFormFailure(error).formError ?? GENERIC_ERROR);
    } finally {
      setPendingId(null);
    }
  }

  const searchId = `${id}-search`;
  const modeId = `${id}-mode`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5 sm:w-72">
          <label htmlFor={searchId} className="text-sm font-medium">
            Search scales
          </label>
          <Input
            id={searchId}
            type="search"
            autoComplete="off"
            placeholder="e.g. C major, F# or dorian"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={modeId} className="text-sm font-medium">
            Mode
          </label>
          <select
            id={modeId}
            value={mode}
            onChange={(event) => setMode(event.target.value as ModeFilter)}
            className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 [&>option]:bg-popover [&>option]:text-popover-foreground h-8 w-full rounded-lg border bg-transparent px-2 py-1 text-base transition-colors outline-none focus-visible:ring-3 sm:w-auto md:text-sm"
          >
            <option value={ALL_MODES}>All modes</option>
            {SCALE_MODES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p role="status" className="text-muted-foreground text-sm">
        {`Showing ${visible.length} of ${scales.length} scales · ${totalTracked} tracked`}
      </p>

      {groups.length === 0 ? (
        <div className="bg-card flex max-w-xl flex-col items-start gap-3 rounded-xl border p-4">
          <p className="text-sm">No scales match your filters.</p>
          {filtersActive ? (
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const headingId = `${id}-key-${group.pitchClass}`;

            return (
              <section key={group.pitchClass} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="text-muted-foreground mb-2 text-sm font-semibold tracking-tight"
                >
                  {group.label}
                </h2>
                <ul className="flex flex-col gap-2 md:grid md:grid-cols-2 xl:grid-cols-3">
                  {group.scales.map((scale) => {
                    const count = trackedCount(scale.id);
                    const tracked = count > 0;
                    const name = scaleName(scale);

                    return (
                      <li
                        key={scale.id}
                        data-tracked={tracked || undefined}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg border p-3",
                          tracked
                            ? "border-primary/40 bg-accent/50"
                            : "bg-card",
                        )}
                      >
                        <span className="font-medium">{name}</span>
                        {tracked ? (
                          <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
                            <Check className="size-4" aria-hidden="true" />
                            {count > 1
                              ? `Tracked · ${count} setups`
                              : "Tracked"}
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            disabled={pendingId === scale.id}
                            aria-label={`Track this scale: ${name}`}
                            onClick={() => void track(scale)}
                          >
                            <Plus aria-hidden="true" />
                            {pendingId === scale.id
                              ? "Tracking…"
                              : "Track this scale"}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
