import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LoggableScale } from "@/features/scales/practice";
import { ScalePracticeForm } from "@/features/scales/scale-practice-form";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const scales: LoggableScale[] = [
  {
    id: "c-major",
    tonic: "C",
    mode: "MAJOR",
    octaves: 2,
    handsMode: "TOGETHER",
    targetBpm: 120,
    last: { cleanBpm: 80, maxBpm: 96, durationMinutes: 10 },
  },
  {
    id: "a-minor",
    tonic: "A",
    mode: "NATURAL_MINOR",
    octaves: 1,
    handsMode: "SEPARATE",
    targetBpm: 90,
    last: null,
  },
];

function setup() {
  const onDone = vi.fn();

  render(
    <ScalePracticeForm scales={scales} onDone={onDone} onCancel={vi.fn()} />,
  );

  return { onDone, user: userEvent.setup() };
}

const picker = () => screen.getByLabelText("Add a scale");

beforeEach(() => refresh.mockClear());

describe("ScalePracticeForm", () => {
  it("prefills a scale from its last entry", async () => {
    const { user } = setup();

    await user.selectOptions(picker(), "c-major");

    expect(screen.getByLabelText("Clean BPM")).toHaveValue(80);
    expect(screen.getByLabelText("Max BPM")).toHaveValue(96);
    expect(screen.getByLabelText("Minutes")).toHaveValue(10);
  });

  it("starts blank for a scale without history", async () => {
    const { user } = setup();

    await user.selectOptions(picker(), "a-minor");

    expect(screen.getByLabelText("Clean BPM")).toHaveValue(null);
  });

  it("logs several scales in one request", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    const { onDone, user } = setup();

    await user.selectOptions(picker(), "c-major");
    await user.selectOptions(picker(), "a-minor");
    await user.type(screen.getAllByLabelText("Clean BPM")[1], "60");
    await user.type(screen.getAllByLabelText("Max BPM")[1], "70");
    await user.type(screen.getAllByLabelText("Minutes")[1], "15");
    await user.click(screen.getByRole("button", { name: "Log 2 scales" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/scale-practice",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      entries: [
        {
          userScaleId: "c-major",
          cleanBpm: 80,
          maxBpm: 96,
          durationMinutes: 10,
          notes: null,
        },
        {
          userScaleId: "a-minor",
          cleanBpm: 60,
          maxBpm: 70,
          durationMinutes: 15,
          notes: null,
        },
      ],
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("blocks a max tempo below the clean tempo before calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { onDone, user } = setup();

    await user.selectOptions(picker(), "c-major");
    await user.clear(screen.getByLabelText("Max BPM"));
    await user.type(screen.getByLabelText("Max BPM"), "70");
    await user.click(screen.getByRole("button", { name: "Log scale" }));

    expect(
      screen.getByText("Max BPM must be greater than or equal to clean BPM."),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
});
