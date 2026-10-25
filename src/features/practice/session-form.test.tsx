import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SessionForm } from "@/features/practice/session-form";

const today = "2026-10-24";

function setup(props: Partial<React.ComponentProps<typeof SessionForm>> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  render(
    <SessionForm
      today={today}
      initial={{ date: today, duration: "", notes: "" }}
      submitLabel="Log practice"
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );

  return { onSubmit, onCancel, user: userEvent.setup() };
}

const submit = () => screen.getByRole("button", { name: "Log practice" });
const dateField = () => screen.getByLabelText("Date");

describe("SessionForm", () => {
  it("submits the duration, today's date and trimmed notes", async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText("Duration (minutes)"), "30");
    await user.type(screen.getByLabelText("Notes (optional)"), "Hanon 1 to 5 ");
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith({
      date: today,
      durationMinutes: 30,
      notes: "Hanon 1 to 5",
    });
  });

  it("requires a duration", async () => {
    const { onSubmit, user } = setup();

    await user.click(submit());

    expect(
      screen.getByText("Enter a whole number of minutes."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a duration of zero minutes", async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText("Duration (minutes)"), "0");
    await user.click(submit());

    expect(screen.getByText("Enter at least 1 minute.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a future date", async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText("Duration (minutes)"), "30");
    // fireEvent: user-event cannot reliably type into a date input in jsdom.
    fireEvent.change(dateField(), { target: { value: "2026-10-25" } });
    await user.click(submit());

    expect(
      screen.getByText("Date cannot be in the future."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts a past date to backfill a session", async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText("Duration (minutes)"), "20");
    fireEvent.change(dateField(), { target: { value: "2026-01-15" } });
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith({
      date: "2026-01-15",
      durationMinutes: 20,
      notes: "",
    });
  });

  it("shows the errors of a failed save", () => {
    setup({
      failure: {
        formError: "Something went wrong. Please try again.",
        fieldErrors: { date: "Date cannot be in the future." },
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(
      screen.getByText("Date cannot be in the future."),
    ).toBeInTheDocument();
  });

  it("keeps the calculated duration read-only", async () => {
    const { onSubmit, user } = setup({
      initial: { date: today, duration: "45", notes: "" },
      durationLocked: true,
    });

    expect(screen.getByLabelText("Duration (minutes)")).toBeDisabled();

    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledWith({
      date: today,
      durationMinutes: 45,
      notes: "",
    });
  });

  it("calls onCancel", async () => {
    const { onCancel, user } = setup();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
