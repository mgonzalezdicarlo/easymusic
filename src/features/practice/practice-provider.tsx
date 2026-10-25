"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useTransition,
} from "react";
import { toast } from "sonner";

import { GENERIC_ERROR } from "@/features/auth/messages";
import {
  createSessionRequest,
  deleteSessionRequest,
  type UpdateSessionBody,
  updateSessionRequest,
} from "@/features/practice/api";
import type { DialogState, SessionSummary } from "@/features/practice/model";
import {
  PENDING_ID_PREFIX,
  type PendingChange,
} from "@/features/practice/pending";
import { toFormFailure } from "@/features/settings/api";
import type { SessionFormValues } from "@/lib/practice-session";

type State = { dialog: DialogState; changes: PendingChange[] };

type Action =
  | { type: "dialog"; dialog: DialogState }
  | { type: "add"; change: PendingChange; dropSettled: boolean }
  | { type: "settle"; key: string }
  | { type: "drop"; key: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "dialog":
      return { ...state, dialog: action.dialog };
    case "add": {
      const kept = action.dropSettled
        ? state.changes.filter((change) => !change.settled)
        : state.changes;

      return { ...state, changes: [...kept, action.change] };
    }
    case "settle":
      return {
        ...state,
        changes: state.changes.map((change) =>
          change.key === action.key ? { ...change, settled: true } : change,
        ),
      };
    case "drop":
      return {
        ...state,
        changes: state.changes.filter((change) => change.key !== action.key),
      };
  }
}

type PracticeContextValue = {
  dialog: DialogState;
  /** Changes to show on top of the server data. */
  pending: readonly PendingChange[];
  openCreate: () => void;
  openEdit: (session: SessionSummary) => void;
  openDelete: (session: SessionSummary) => void;
  closeDialog: () => void;
  /** Creates a session (`target` is null) or edits `target`. Optimistic. */
  saveSession: (
    target: SessionSummary | null,
    values: SessionFormValues,
  ) => Promise<void>;
  deleteSession: (session: SessionSummary) => Promise<void>;
};

const PracticeContext = createContext<PracticeContextValue | null>(null);

export function usePractice(): PracticeContextValue {
  const value = useContext(PracticeContext);

  if (!value) {
    throw new Error("usePractice must be used inside <PracticeProvider>.");
  }

  return value;
}

export function PracticeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    dialog: { type: "closed" },
    changes: [],
  });
  const [refreshing, startRefresh] = useTransition();
  const nextKey = useRef(0);

  // A saved change stays visible while the page refetches, and is hidden in the same render
  // that delivers the fresh server data, so a session is never shown twice.
  const pending = useMemo(
    () => state.changes.filter((change) => !change.settled || refreshing),
    [state.changes, refreshing],
  );

  const commit = useCallback(
    (key: string, message: string) => {
      // Start the refresh first: a settled change is only hidden while no refresh is running.
      startRefresh(() => router.refresh());
      dispatch({ type: "settle", key });
      toast.success(message);
    },
    [router],
  );

  const saveSession = useCallback(
    async (target: SessionSummary | null, values: SessionFormValues) => {
      const key = String(++nextKey.current);
      const notes = values.notes === "" ? null : values.notes;
      const draft = {
        date: values.date,
        duration: String(values.durationMinutes),
        notes: values.notes,
      };

      if (target === null) {
        const session: SessionSummary = {
          id: `${PENDING_ID_PREFIX}${key}`,
          date: values.date,
          durationMinutes: values.durationMinutes,
          notes,
          entryCount: 0,
        };

        dispatch({
          type: "add",
          change: { key, kind: "create", session, settled: false },
          dropSettled: !refreshing,
        });
        dispatch({ type: "dialog", dialog: { type: "closed" } });

        try {
          await createSessionRequest({
            date: values.date,
            durationMinutes: values.durationMinutes,
            notes,
          });
          commit(key, "Practice logged.");
        } catch (error) {
          dispatch({ type: "drop", key });
          dispatch({
            type: "dialog",
            dialog: { type: "create", draft, failure: toFormFailure(error) },
          });
        }

        return;
      }

      // Send only what changed. With entries, the API calculates the duration.
      const patch: UpdateSessionBody = {};

      if (values.date !== target.date) patch.date = values.date;
      if (
        target.entryCount === 0 &&
        values.durationMinutes !== target.durationMinutes
      ) {
        patch.durationMinutes = values.durationMinutes;
      }
      if (notes !== target.notes) patch.notes = notes;

      if (Object.keys(patch).length === 0) {
        dispatch({ type: "dialog", dialog: { type: "closed" } });
        return;
      }

      dispatch({
        type: "add",
        change: {
          key,
          kind: "update",
          session: { ...target, ...patch },
          settled: false,
        },
        dropSettled: !refreshing,
      });
      dispatch({ type: "dialog", dialog: { type: "closed" } });

      try {
        await updateSessionRequest(target.id, patch);
        commit(key, "Practice session updated.");
      } catch (error) {
        dispatch({ type: "drop", key });
        dispatch({
          type: "dialog",
          dialog: {
            type: "edit",
            session: target,
            draft,
            failure: toFormFailure(error),
          },
        });
      }
    },
    [commit, refreshing],
  );

  const deleteSession = useCallback(
    async (session: SessionSummary) => {
      const key = String(++nextKey.current);

      dispatch({
        type: "add",
        change: { key, kind: "delete", session, settled: false },
        dropSettled: !refreshing,
      });
      dispatch({ type: "dialog", dialog: { type: "closed" } });

      try {
        await deleteSessionRequest(session.id);
        commit(key, "Practice session deleted.");
      } catch (error) {
        dispatch({ type: "drop", key });
        toast.error(toFormFailure(error).formError ?? GENERIC_ERROR);
      }
    },
    [commit, refreshing],
  );

  const value = useMemo<PracticeContextValue>(
    () => ({
      dialog: state.dialog,
      pending,
      openCreate: () =>
        dispatch({ type: "dialog", dialog: { type: "create" } }),
      openEdit: (session) =>
        dispatch({ type: "dialog", dialog: { type: "edit", session } }),
      openDelete: (session) =>
        dispatch({ type: "dialog", dialog: { type: "delete", session } }),
      closeDialog: () =>
        dispatch({ type: "dialog", dialog: { type: "closed" } }),
      saveSession,
      deleteSession,
    }),
    [state.dialog, pending, saveSession, deleteSession],
  );

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
}
