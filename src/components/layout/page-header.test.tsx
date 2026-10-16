import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/layout/page-header";

describe("PageHeader", () => {
  it("renders the title as a level-1 heading and the description", () => {
    render(<PageHeader title="Scales" description="Track every scale." />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Scales" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Track every scale.")).toBeInTheDocument();
  });
});
