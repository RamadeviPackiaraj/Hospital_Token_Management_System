"use client";

import * as React from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";

export interface FormWrapperProps<TFieldValues extends FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  methods: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  title?: string;
  description?: string;
}

export function FormWrapper<TFieldValues extends FieldValues>({
  methods,
  onSubmit,
  title,
  description,
  children,
  className,
  ...props
}: FormWrapperProps<TFieldValues>) {
  return (
    <FormProvider {...methods}>
      <form
        className={cn("space-y-5", className)}
        onSubmit={methods.handleSubmit(onSubmit)}
        noValidate
        {...props}
      >
        {title || description ? (
          <div className="space-y-2">
            {title ? <h2 className="ui-page-title">{title}</h2> : null}
            {description ? <p className="ui-body-secondary">{description}</p> : null}
          </div>
        ) : null}
        {children}
      </form>
    </FormProvider>
  );
}
