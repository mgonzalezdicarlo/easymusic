"use client";

import { Archive, ArchiveRestore, Check, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENERIC_ERROR } from "@/features/auth/messages";
import { updateUserScaleRequest } from "@/features/scales/api";
import {
  ALL_MODES,
  type CatalogScale,
  filterScales,
  groupByKey,
  type ModeFilter,
  SCALE_MODES,
  scaleName,
} from "@/features/scales/catalog";
import {
  describeSetup,
  isActiveSetup,
  type ScaleSetup,
  type TrackingStatusValue,
} from "@/features/scales/configuration";
import { ScaleSetupDialog } from "@/features/scales/scale-setup-dialog";
import { toFormFailure } from "@/features/settings/api";
import { cn } from "@/lib/utils";

type ScaleCatalogProps = {
  scales: readonly CatalogScale[];
  /** The user's setups (active and archived) per scale id. Untracked scales are missing. */
  setups: Readonly<Record<string, readonly ScaleSetup[]>>;
};

type DialogState =
  | { type: "closed" }
  | { type: "create"; scale: CatalogScale }
  | { type: "edit"; scale: CatalogScale; setup: ScaleSetup };

const CLOSED: DialogState = { type: "closed" };
const NO_SETUPS: readonly ScaleSetup[] = [];

export function ScaleCatalog({ scales, setups }: Readonly<ScaleCatalogProps>) {
  const id = useId();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<ModeFilter>(ALL_MODES);
  const [dialog, setDialog] = useState<DialogState>(CLOSED);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();

  const visible = useMemo(
    () => filterScales(scales, { search, mode }),
    [scales, search, mode],
  );
  const groups = useMemo(() => groupByKey(visible), [visible]);

  const setupsOf = (scaleId: string) => setups[scaleId] ?? NO_SETUPS;
  const activeCount = (scaleId: string) =>
    setupsOf(scaleId).filter(isActiveSetup).length;
  const totalTracked = scales.filter((s) => activeCount(s.id) > 0).length;
  const filtersActive = search.trim() !== "" || mode !== ALL_MODES;

  function clearFilters() {
    setSearch("");
    setMode(ALL_MODES);
  }

  function refresh() {
    startRefresh(() => router.refresh());
  }

  // Archiving keeps the setup and its practice history. Restoring undoes it.
  async function changeStatus(
    scale: CatalogScale,
    setup: ScaleSetup,
    status: TrackingStatusValue,
  ) {
    setBusyId(setup.id);

    try {
      await updateUserScaleRequest(setup.id, { status });
      toast.success(
        status === "ARCHIVED"
          ? `Archived ${scaleName(scale)} (${describeSetup(setup)}). Its history is kept.`
          : `Restored ${scaleName(scale)} (${describeSetup(setup)}).`,
      );
      refresh();
    } catch (error) {
      toast.error(toFormFailure(error).formError ?? GENERIC_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  const searchId = `${id}-search`;
  const modeId = `${id}-mode`;

  return (
    <div className="space-y-6" aria-busy={refreshing || undefined}>
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
                    const scaleSetups = setupsOf(scale.id);
                    const count = activeCount(scale.id);
                    const tracked = count > 0;
                    const name = scaleName(scale);

                    return (
                      <li
                        key={scale.id}
                        data-tracked={tracked || undefined}
                        className={cn(
                          "flex flex-col gap-3 rounded-lg border p-3",
                          tracked
                            ? "border-primary/40 bg-accent/50"
                            : "bg-card",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="font-medium">{name}</span>
                          <div className="flex flex-wrap items-center gap-3">
                            {tracked ? (
                              <span className="text-primary inline-flex items-center gap-1 text-sm font-medium">
                                <Check className="size-4" aria-hidden="true" />
                                {count > 1
                                  ? `Tracked · ${count} setups`
                                  : "Tracked"}
                              </span>
                            ) : null}
                            <Button
                              type="button"
                              size="lg"
                              variant="outline"
                              aria-label={`${
                                tracked
                                  ? "Add another setup"
                                  : "Track this scale"
                              }: ${name}`}
                              onClick={() =>
                                setDialog({ type: "create", scale })
                              }
                            >
                              <Plus aria-hidden="true" />
                              {tracked ? "Add setup" : "Track this scale"}
                            </Button>
                          </div>
                        </div>

                        {scaleSetups.length > 0 ? (
                          <ul
                            aria-label={`Setups for ${name}`}
                            className="bg-background/60 divide-y rounded-md border text-sm"
                          >
                            {scaleSetups.map((setup) => {
                              const archived = setup.status === "ARCHIVED";
                              const label = describeSetup(setup);
                              const busy = busyId === setup.id || refreshing;

                              return (
                                <li
                                  key={setup.id}
                                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p
                                      className={cn(
                                        "font-medium",
                                        archived && "text-muted-foreground",
                                      )}
                                    >
                                      {label}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {`Target ${setup.targetBpm} BPM${
                                        archived ? " · Archived" : ""
                                      }`}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    {archived ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        disabled={busy}
                                        aria-label={`Restore setup: ${name}, ${label}`}
                                        onClick={() =>
                                          void changeStatus(
                                            scale,
                                            setup,
                                            "ACTIVE",
                                          )
                                        }
                                      >
                                        <ArchiveRestore aria-hidden="true" />
                                        Restore
                                      </Button>
                                    ) : (
                                      <>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          disabled={busy}
                                          aria-label={`Edit setup: ${name}, ${label}`}
                                          onClick={() =>
                                            setDialog({
                                              type: "edit",
                                              scale,
                                              setup,
                                            })
                                          }
                                        >
                                          <Pencil aria-hidden="true" />
                                          Edit
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          disabled={busy}
                                          aria-label={`Archive setup: ${name}, ${label}`}
                                          onClick={() =>
                                            void changeStatus(
                                              scale,
                                              setup,
                                              "ARCHIVED",
                                            )
                                          }
                                        >
                                          <Archive aria-hidden="true" />
                                          Archive
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {dialog.type !== "closed" ? (
        <ScaleSetupDialog
          key={
            dialog.type === "edit" ? dialog.setup.id : `new-${dialog.scale.id}`
          }
          scale={dialog.scale}
          setup={dialog.type === "edit" ? dialog.setup : undefined}
          setups={setupsOf(dialog.scale.id)}
          onClose={() => setDialog(CLOSED)}
          onSaved={() => {
            setDialog(CLOSED);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}
