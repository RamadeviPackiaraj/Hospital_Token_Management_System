"use client";

import { PhoneCall } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";

export function StartCallButton(props: Omit<ButtonProps, "variant" | "leftIcon">) {
  return <Button variant="success" leftIcon={<PhoneCall className="size-4" />} {...props} />;
}
