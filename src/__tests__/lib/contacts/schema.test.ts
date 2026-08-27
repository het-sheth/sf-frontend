import {
  CONTACT_FIELDS,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function values(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    notes: "",
    photo: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
    expect(parsed.photo).toBeNull();
  });

  it("accepts a valid photo data URL", () => {
    expect(contactInputSchema.parse(values({ photo: PNG_DATA_URL })).photo).toBe(
      PNG_DATA_URL,
    );
  });

  it("defaults an omitted photo to null", () => {
    const withoutPhoto = values();
    delete withoutPhoto.photo;

    expect(contactInputSchema.parse(withoutPhoto).photo).toBeNull();
  });

  it("rejects an unsupported photo MIME type", () => {
    const result = contactInputSchema.safeParse(
      values({ photo: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" }),
    );

    expect(zodFieldErrors(result.error!).photo).toBe(
      "Choose a JPEG, PNG, or WebP image",
    );
  });

  it("rejects an oversized photo payload", () => {
    const result = contactInputSchema.safeParse(
      values({
        photo: `data:image/png;base64,${"A".repeat(2_796_204)}`,
      }),
    );

    expect(zodFieldErrors(result.error!).photo).toBe(
      "Photo must be 2 MiB or smaller",
    );
  });

  it("trims what the user typed", () => {    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: "a".repeat(101), postal_code: "9".repeat(21) }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      postal_code: "Postal code must be 20 characters or fewer",
    });
  });
});

describe("formDataToValues", () => {
  it("pulls every known field out, defaulting to an empty string", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set("ignored", "nope");

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    expect(extracted.photo).toBe("");
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "photo"].sort(),
    );
  });
});
