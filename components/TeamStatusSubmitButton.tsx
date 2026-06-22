"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/Button";

export function TeamStatusSubmitButton({
  text,
  variant
}: {
  text: string;
  variant: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit" variant={variant}>
      {pending ? "Mise a jour..." : text}
    </Button>
  );
}
