"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  trackScaleRequest,
  updateUserScaleRequest,
} from "@/features/scales/api";
import { type CatalogScale, scaleName } from "@/features/scales/catalog";
import {
  changedFields,
  DEFAULT_SETUP,
  describeSetup,
  type ScaleSetup,
  type SetupFormValues,
} from "@/features/scales/configuration";
import {
  ScaleSetupForm,
  type SetupFailure,
} from "@/features/scales/scale-setup-form";
import { toFormFailure } from "@/features/settings/api";

type ScaleSetupDialogProps = {
  scale: CatalogScale;
  /** The setup to edit. Without it, the dialog adds a new setup. */
  setup?: ScaleSetup;
  /** Every setup (active and archived) of this scale. */
  setups: readonly ScaleSetup[];
  onClose: () => void;
  /** The change was saved. The parent closes the dialog and refreshes the data. */
  onSaved: () => void;
};

export function ScaleSetupDialog({
  scale,
  setup,
  setups,
  onClose,
  onSaved,
}: Readonly<ScaleSetupDialogProps>) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<SetupFailure | undefined>();
  const name = scaleName(scale);

  async function save(values: SetupFormValues) {
    setFailure(undefined);
    setPending(true);

    try {
      if (setup) {
        const patch = changedFields(setup, values);

        if (Object.keys(patch).length === 0) {
          onClose();
          return;
        }

        await updateUserScaleRequest(setup.id, patch);
        toast.success(`${name} setup updated.`);
      } else {
        await trackScaleRequest({ scaleId: scale.id, ...values });
        toast.success(`${name} is now tracked (${describeSetup(values)}).`);
      }

      onSaved();
    } catch (error) {
      setFailure(toFormFailure(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {setup ? `Edit ${name} setup` : `Track ${name}`}
          </DialogTitle>
          <DialogDescription>
            Choose how you practice this scale. Each combination of octaves and
            hands is tracked on its own.
          </DialogDescription>
        </DialogHeader>
        <ScaleSetupForm
          scaleName={name}
          initial={setup ?? DEFAULT_SETUP}
          setups={setups}
          editingId={setup?.id}
          submitLabel={setup ? "Save changes" : "Track scale"}
          pending={pending}
          failure={failure}
          onSubmit={(values) => void save(values)}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
