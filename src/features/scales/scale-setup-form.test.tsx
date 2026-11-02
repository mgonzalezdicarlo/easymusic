import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ScaleSetup } from "@/features/scales/configuration";
import { ScaleSetupForm } from "@/features/scales/scale-setup-form";

const existing: ScaleSetup = {
  id: "s1",
  octaves: 2,
  handsMode: "TOGETHER",
  targetBpm: 100,
  status: "ACTIVE",
};

function setup(
  props: Partial<React.ComponentProps<typeof ScaleSetupForm>> = {},
) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  render(
    <ScaleSetupForm
      scaleName="C major"
      initial={{ octaves: 2, handsMode: "TOGETHER", targetBpm: 100 }}
      setups={[]}
      submitLabel="Track scale"
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );

  return { onSubmit, onCancel, user: userEvent.setup() };
}

const bpmField = () => screen.getByLabelText("Target tempo (BPM)");
const submit = () => screen.getByRole("button", { name: "Track scale" });

async function setBpm(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.clear(bpmField());

  if (value) await user.type(bpmField(), value);
}

describe("ScaleSetupForm", () => {
  it("submits the chosen octaves, hands and target tempo", async () => {
    const { onSubmit, user } = setup();

    await user.selectOptions(screen.getByLabelText("Octaves"), "4");
    await user.selectOptions(screen.getByLabelText("Hands"), "SEPARATE");
    await setBpm(user, "80");
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith({
      octaves: 4,
      handsMode: "SEPARATE",
      targetBpm: 80,
    });
  });

  it.each([
    ["10", "Use at least 20 BPM."],
    ["301", "Use at most 300 BPM."],
    ["", "Enter a whole number of BPM."],
    ["90.5", "Enter a whole number of BPM."],
  ])("rejects a target of %j", async (value, message) => {
    const { onSubmit, user } = setup();

    await setBpm(user, value);
    await user.click(submit());

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a configuration that is already tracked, with a helpful message", async () => {
    const { onSubmit, user } = setup({ setups: [existing] });

    await user.click(submit());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You already track C major with 2 octaves, hands together.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("tells the user to restore an archived configuration", async () => {
    const { onSubmit, user } = setup({
      setups: [{ ...existing, status: "ARCHIVED" }],
    });

    await user.click(submit());

    expect(screen.getByRole("alert")).toHaveTextContent(
      /it is archived\. Restore it/,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows the same scale in another configuration", async () => {
    const { onSubmit, user } = setup({ setups: [existing] });

    await user.selectOptions(screen.getByLabelText("Octaves"), "4");
    await user.selectOptions(screen.getByLabelText("Hands"), "SEPARATE");
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith({
      octaves: 4,
      handsMode: "SEPARATE",
      targetBpm: 100,
    });
  });

  it("does not treat the setup being edited as its own duplicate", async () => {
    const { onSubmit, user } = setup({
      setups: [existing],
      editingId: "s1",
      initial: existing,
    });

    await setBpm(user, "120");
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith({
      octaves: 2,
      handsMode: "TOGETHER",
      targetBpm: 120,
    });
  });

  it("shows the errors of a failed save", () => {
    setup({
      failure: {
        formError: "Something went wrong. Please try again.",
        fieldErrors: { targetBpm: "Use at most 300 BPM." },
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByText("Use at most 300 BPM.")).toBeInTheDocument();
  });

  it("disables the form while saving", () => {
    setup({ pending: true });

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("calls onCancel", async () => {
    const { onCancel, user } = setup();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
