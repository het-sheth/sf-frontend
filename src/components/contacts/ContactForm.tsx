"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import Field from "@/components/ui/Field";
import Button, { buttonClasses } from "@/components/ui/Button";
import { CONTACT_FIELD_GROUPS } from "@/lib/contacts/schema";
import {
  EMPTY_FORM_STATE,
  type Contact,
  type ContactInput,
  type FormState,
} from "@/lib/contacts/types";

export type ContactFormAction = (
  state: FormState,
  formData: FormData,
) => Promise<FormState>;

function SubmitButton({
  label,
  photoPending,
}: {
  label: string;
  photoPending: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || photoPending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Create/edit form. The field list comes from `CONTACT_FIELD_GROUPS`, and the
 * action is a bound server action — so a submit is a plain POST that works
 * before hydration and reports errors through `useActionState`.
 */
export default function ContactForm({
  action,
  contact,
  submitLabel,
  cancelHref,
}: {
  action: ContactFormAction;
  contact?: Contact;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [replacementPhoto, setReplacementPhoto] = useState<string>();
  const [photoErrorOverride, setPhotoErrorOverride] = useState<{
    state: FormState;
    message?: string;
  }>();
  const [photoPending, setPhotoPending] = useState(false);
  const photoReader = useRef<FileReader | null>(null);
  const photo = replacementPhoto ?? state.values?.photo ?? contact?.photo ?? "";
  const displayedPhotoError =
    photoErrorOverride?.state === state
      ? photoErrorOverride.message
      : state.fieldErrors?.photo;

  function valueFor(name: keyof ContactInput): string {
    return state.values?.[name] ?? contact?.[name] ?? "";
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setReplacementPhoto(undefined);
      setPhotoErrorOverride({
        state,
        message: "Choose a JPEG, PNG, or WebP image",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setReplacementPhoto(undefined);
      setPhotoErrorOverride({
        state,
        message: "Photo must be 2 MiB or smaller",
      });
      return;
    }

    photoReader.current?.abort();
    setPhotoErrorOverride({ state });
    setPhotoPending(true);
    const reader = new FileReader();
    photoReader.current = reader;
    reader.onload = () => {
      if (photoReader.current !== reader) return;
      if (typeof reader.result === "string") {
        setReplacementPhoto(reader.result);
      } else {
        setPhotoErrorOverride({
          state,
          message: "The photo could not be read",
        });
      }
    };
    reader.onerror = () => {
      if (photoReader.current === reader) {
        setPhotoErrorOverride({
          state,
          message: "The photo could not be read",
        });
      }
    };
    reader.onloadend = () => {
      if (photoReader.current === reader) {
        photoReader.current = null;
        setPhotoPending(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <form action={formAction} noValidate className="space-y-8">
      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{state.message}</span>
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="sr-only">Photo</legend>

        <div className="border-b border-hairline pb-2">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Photo
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Optional JPEG, PNG, or WebP image up to 2 MiB.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ContactAvatar
            contact={{
              first_name: contact?.first_name ?? "",
              last_name: contact?.last_name ?? "",
              email: contact?.email ?? "",
              photo: photo || null,
            }}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <label
              htmlFor="contact-photo"
              className="mb-1.5 block text-[13px] font-medium text-foreground"
            >
              Choose photo
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                optional
              </span>
            </label>
            <input
              id="contact-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={photoPending}
              onChange={selectPhoto}
              aria-invalid={displayedPhotoError ? true : undefined}
              aria-describedby={displayedPhotoError ? "contact-photo-error" : undefined}
              className="block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground"
            />
            {displayedPhotoError ? (
              <p
                id="contact-photo-error"
                role="alert"
                className="mt-1.5 text-[13px] text-destructive"
              >
                {displayedPhotoError}
              </p>
            ) : null}
          </div>
        </div>
        <input type="hidden" name="photo" value={photo} />
      </fieldset>

      {CONTACT_FIELD_GROUPS.map((group) => (
        <fieldset key={group.title} className="space-y-4">
          <legend className="sr-only">{group.title}</legend>

          <div className="border-b border-hairline pb-2">
            <h2 className="font-display text-sm font-semibold text-foreground">
              {group.title}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {group.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                defaultValue={valueFor(field.name)}
                error={state.fieldErrors?.[field.name]}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-2 border-t border-hairline pt-4">
        <SubmitButton label={submitLabel} photoPending={photoPending} />
        <Link href={cancelHref} className={buttonClasses("secondary")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
