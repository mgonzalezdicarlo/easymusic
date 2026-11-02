import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogScale } from "@/features/scales/catalog";
import type { ScaleSetup } from "@/features/scales/configuration";
import { ScaleCatalog } from "@/features/scales/scale-catalog";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const scales: CatalogScale[] = [
  { id: "c-major", tonic: "C", mode: "MAJOR" },
  { id: "db-major", tonic: "Db", mode: "MAJOR" },
  { id: "c-sharp-minor", tonic: "C#", mode: "NATURAL_MINOR" },
  { id: "a-minor", tonic: "A", mode: "NATURAL_MINOR" },
  { id: "a-harmonic", tonic: "A", mode: "HARMONIC_MINOR" },
  { id: "d-dorian", tonic: "D", mode: "DORIAN" },
];

const together2: ScaleSetup = {
  id: "s1",
  octaves: 2,
  handsMode: "TOGETHER",
  targetBpm: 100,
  status: "ACTIVE",
};

function setup(setups: Record<string, ScaleSetup[]> = {}) {
  render(<ScaleCatalog scales={scales} setups={setups} />);

  return userEvent.setup();
}

beforeEach(() => {
  refresh.mockClear();
});

const status = () => screen.getByRole("status");
const searchBox = () => screen.getByLabelText("Search scales");
const trackButton = (name: string) =>
  screen.getByRole("button", { name: `Track this scale: ${name}` });
const addSetupButton = (name: string) =>
  screen.getByRole("button", { name: `Add another setup: ${name}` });

async function typeBpm(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  value: string,
) {
  const field = within(dialog).getByLabelText("Target tempo (BPM)");

  await user.clear(field);
  await user.type(field, value);
}

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

  it("marks tracked scales, lists their setups and offers to add another", () => {
    setup({ "a-minor": [together2] });

    expect(screen.getAllByText("Tracked")).toHaveLength(1);
    expect(
      screen.queryByRole("button", {
        name: "Track this scale: A natural minor",
      }),
    ).not.toBeInTheDocument();
    expect(addSetupButton("A natural minor")).toBeEnabled();
    expect(trackButton("C major")).toBeEnabled();

    const list = screen.getByRole("list", {
      name: "Setups for A natural minor",
    });

    expect(list).toHaveTextContent("2 octaves, hands together");
    expect(list).toHaveTextContent("Target 100 BPM");
    expect(status()).toHaveTextContent("Showing 6 of 6 scales · 1 tracked");
  });

  it("counts setups of the same scale", () => {
    setup({
      "c-major": [
        together2,
        { ...together2, id: "s2", octaves: 4, handsMode: "SEPARATE" },
      ],
    });

    expect(screen.getByText("Tracked · 2 setups")).toBeInTheDocument();
    expect(status()).toHaveTextContent("1 tracked");
  });

  it("does not count a scale with only archived setups as tracked", () => {
    setup({ "a-minor": [{ ...together2, status: "ARCHIVED" }] });

    expect(status()).toHaveTextContent("Showing 6 of 6 scales · 0 tracked");
    expect(trackButton("A natural minor")).toBeEnabled();
    expect(screen.getByText(/Archived/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Restore setup: A natural minor, 2 octaves, hands together",
      }),
    ).toBeEnabled();
  });

  it("tracks a scale with the chosen configuration", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    const user = setup();

    await user.click(trackButton("C major"));

    const dialog = await screen.findByRole("dialog", { name: "Track C major" });

    await user.selectOptions(within(dialog).getByLabelText("Octaves"), "4");
    await user.selectOptions(
      within(dialog).getByLabelText("Hands"),
      "SEPARATE",
    );
    await typeBpm(user, dialog, "80");
    await user.click(
      within(dialog).getByRole("button", { name: "Track scale" }),
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/user-scales",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      scaleId: "c-major",
      octaves: 4,
      handsMode: "SEPARATE",
      targetBpm: 80,
    });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("blocks a duplicate configuration before calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = setup({ "c-major": [together2] });

    await user.click(addSetupButton("C major"));

    const dialog = await screen.findByRole("dialog");

    // The default setup (2 octaves, hands together) is already tracked.
    await user.click(
      within(dialog).getByRole("button", { name: "Track scale" }),
    );

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "You already track C major with 2 octaves, hands together.",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the server message when tracking fails", async () => {
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

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", { name: "Track scale" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Already tracked.",
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("edits a setup and sends only the changed fields", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const user = setup({ "c-major": [together2] });

    await user.click(
      screen.getByRole("button", {
        name: "Edit setup: C major, 2 octaves, hands together",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Edit C major setup",
    });

    await typeBpm(user, dialog, "120");
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/user-scales/s1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      targetBpm: 120,
    });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("archives a setup without deleting it", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const user = setup({ "c-major": [together2] });

    await user.click(
      screen.getByRole("button", {
        name: "Archive setup: C major, 2 octaves, hands together",
      }),
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/user-scales/s1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      status: "ARCHIVED",
    });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("restores an archived setup", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const user = setup({ "c-major": [{ ...together2, status: "ARCHIVED" }] });

    await user.click(
      screen.getByRole("button", {
        name: "Restore setup: C major, 2 octaves, hands together",
      }),
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      status: "ACTIVE",
    });
  });
});
