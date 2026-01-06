"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

type CommonProps = {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  controlClassName?: string;
  error?: string;
};

type InputProps = CommonProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
    multiline?: false;
    type?: string;
  };

type TextareaProps = CommonProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
    multiline: true;
  };

export type TextFieldProps = InputProps | TextareaProps;

export function TextField(props: TextFieldProps) {
  const {
    label,
    icon,
    rightIcon,
    containerClassName,
    className,
    controlClassName,
    error,
    // Extract custom and control props so they don't end up on the DOM element
    multiline,
    ...rest
  } = props as any;

  const isMultiline = Boolean(multiline);

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-foreground">
          {label}
        </label>
      )}
      <div className={`relative ${error ? 'field-error' : ''} ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        {isMultiline ? (
          <textarea
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            className={`w-full p-3 rounded-lg border border-border/60 bg-background placeholder:text-muted-foreground/70 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors text-foreground shadow-none ${controlClassName ?? ""}`.trim()}
          />
        ) : (
          <input
            {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            className={`w-full p-3 rounded-lg border border-border/60 bg-background placeholder:text-muted-foreground/70 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors text-foreground shadow-none ${controlClassName ?? ""}`.trim()}
          />
        )}
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

type SelectFieldProps = CommonProps &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">;

export function SelectField({ label, icon, rightIcon, containerClassName, className, controlClassName, error, children, ...props }: SelectFieldProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-foreground">
          {label}
        </label>
      )}
      <div className={`relative ${error ? 'field-error' : ''} ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        <select
          {...props}
          className={`w-full p-3 rounded-lg border border-border/60 bg-background focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors appearance-none pr-10 text-foreground shadow-none ${controlClassName ?? ""}`.trim()}
        >
          {children}
        </select>
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
