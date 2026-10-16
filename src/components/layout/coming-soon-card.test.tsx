import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComingSoonCard } from "@/components/layout/coming-soon-card";

describe("ComingSoonCard", () => {
  it("shows the planned epic and every item", () => {
    render(<ComingSoonCard epic="Epic 3" items={["Streaks", "Heat map"]} />);

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText("Planned for Epic 3.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Heat map")).toBeInTheDocument();
  });
});
