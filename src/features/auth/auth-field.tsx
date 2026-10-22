import { Input } from "@/components/ui/input";

type AuthFieldProps = {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  error?: string;
  hint?: string;
};

export function AuthField({
  id,
  label,
  error,
  hint,
  ...input
}: AuthFieldProps) {
  const messageId = `${id}-message`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        {...input}
      />
      {error ? (
        <p id={messageId} className="text-destructive text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-muted-foreground text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
