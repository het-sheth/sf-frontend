import React from "react";
import { render, screen } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact } from "../mocks/handlers";

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("ContactAvatar", () => {
  it("renders a circular object-cover image when a photo exists", () => {
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo: PNG_DATA_URL })} />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", PNG_DATA_URL);
    expect(image).toHaveClass("object-cover");
    expect(image?.closest("span")).toHaveClass("rounded-full");
  });

  it("retains the initials fallback when photo is null", () => {
    render(<ContactAvatar contact={makeContact({ photo: null })} />);

    expect(screen.getByText("AL")).toBeInTheDocument();
  });
});
