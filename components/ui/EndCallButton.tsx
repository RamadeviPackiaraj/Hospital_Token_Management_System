"use client";

import { PhoneOff } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";

export function EndCallButton(props: Omit<ButtonProps, "variant" | "leftIcon">) {
  return <Button variant="danger" leftIcon={<PhoneOff className="size-4" />} {...props} />;
}
