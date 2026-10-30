import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CatalogScale } from "@/features/scales/catalog";
import { ScaleCatalog } from "@/features/scales/scale-catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

const scales: CatalogScale[] = [
  { id: "c-major", tonic: "C", mode: "MAJOR" },
  { id: "db-major", tonic: "Db", mode: "MAJOR" },
  { id: "c-sharp-minor", tonic: "C#", mode: "NATURAL_MINOR" },
  { id: "a-minor", tonic: "A", mode: "NATURAL_MINOR" },
  { id: "a-harmonic", tonic: "A", mode: "HARMONIC_MINOR" },
  { id: "d-dorian", tonic: "D", mode: "DORIAN" },
];

function setup(trackedCounts: Record<string, number> = {}) {
  render(<ScaleCatalog scales={scales} trackedCounts={trackedCounts} />);

  return userEvent.setup();
}

const status = () => screen.getByRole("status");
const searchBox = () => screen.getByLabelText("Search scales");
const trackButton = (name: string) =>
  screen.getByRole("button", { name: `Track this scale: ${name}` });

describe("ScaleCatalog", () => {
  it("lists every scale, grouped by key", () => {
    setup();

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["C", "C#/Db", "D", "A"]);
    expect(screen.getAllByRole("listitem")).toHaveLength(scales.length);
    expect(status()).toHaveTextContent("Showing 6 of 6 scales · 0 tracked");
  });

  it("filters by mode", async () => {
    const user = setup();

    await user.selectOptions(screen.getByLabelText("Mode"), "NATURAL_MINOR");

    expect(screen.getByText("A natural minor")).toBeInTheDocument();
    expect(screen.getByText("C# natural minor")).toBeInTheDocument();
    expect(screen.queryByText("C major")).not.toBeInTheDocument();
    expect(status()).toHaveTextContent("Showing 2 of 6 scales · 0 tracked");
  });

  it("searches by mode words", async () => {
    const user = setup();

    await user.type(searchBox(), "a harm");

    expect(screen.getByText("A harmonic minor")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("finds a scale by its other enharmonic name", async () => {
    const user = setup();

    await user.type(searchBox(), "c# major");

    expect(screen.getByText("Db major")).toBeInTheDocument();
    expect(screen.queryByText("C major")).not.toBeInTheDocument();
  });

  it("does not match C# or Db when searching for C", async () => {
    const user = setup();

    await user.type(searchBox(), "c major");

    expect(screen.getByText("C major")).toBeInTheDocument();
    expect(screen.queryByText("Db major")).not.toBeInTheDocument();
  });

  it("shows an empty state and clears the filters", async () => {
    const user = setup();

    await user.type(searchBox(), "zzz");

    expect(screen.getByText("No scales match your filters.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(scales.length);
    expect(searchBox()).toHaveValue("");
  });

  it("marks tracked scales and only offers to track the others", () => {
    setup({ "a-minor": 1 });

    expect(screen.getAllByText("Tracked")).toHaveLength(1);
    expect(
      screen.queryByRole("button", {
        name: "Track this scale: A natural minor",
      }),
    ).not.toBeInTheDocument();
    expect(trackButton("C major")).toBeEnabled();
    expect(status()).toHaveTextContent("Showing 6 of 6 scales · 1 tracked");
  });

  it("tracks a scale with the default setup and marks it", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    const user = setup();

    await user.click(trackButton("C major"));

    expect(await screen.findByText("Tracked")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/user-scales",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      scaleId: "c-major",
      octaves: 2,
      handsMode: "TOGETHER",
      targetBpm: 100,
    });
    expect(status()).toHaveTextContent("1 tracked");
  });

  it("keeps the button when tracking fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "CONFLICT", message: "Already tracked." },
        }),
        { status: 409 },
      ),
    );
    const user = setup();

    await user.click(trackButton("C major"));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(trackButton("C major")).toBeEnabled());
    expect(screen.queryByText("Tracked")).not.toBeInTheDocument();
  });
});
