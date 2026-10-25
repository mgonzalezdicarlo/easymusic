import type { FieldErrors } from "@/features/auth/schemas";

/** Sessions shown in the dashboard's recent practice list. */
export const RECENT_SESSIONS_LIMIT = 10;

/** What the UI needs to know about a practice session. `date` is YYYY-MM-DD. */
export type SessionSummary = {
  id: string;
  date: string;
  durationMinutes: number;
  notes: string | null;
  /** Scale and exercise entries. With entries, the duration is calculated by the API. */
  entryCount: number;
};

/** Raw form values, kept so a failed save can reopen the dialog with the user's input. */
export type SessionDraft = { date: string; duration: string; notes: string };

export type FormFailure = {
  formError: string | null;
  fieldErrors: FieldErrors;
};

export type DialogState =
  | { type: "closed" }
  | { type: "create"; draft?: SessionDraft; failure?: FormFailure }
  | {
      type: "edit";
      session: SessionSummary;
      draft?: SessionDraft;
      failure?: FormFailure;
    }
  | { type: "delete"; session: SessionSummary };
