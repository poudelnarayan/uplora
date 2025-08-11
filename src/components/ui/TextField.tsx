"use client";

import * as React from "react";

type CommonProps = {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  controlClassName?: string;
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
      <div className={`field ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        {isMultiline ? (
          <textarea {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={`field-control ${controlClassName ?? ""}`.trim()} />
        ) : (
          <input {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} className={`field-control ${controlClassName ?? ""}`.trim()} />
        )}
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
    </div>
  );
}

type SelectFieldProps = CommonProps &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">;

export function SelectField({ label, icon, rightIcon, containerClassName, className, controlClassName, children, ...props }: SelectFieldProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-foreground">
          {label}
        </label>
      )}
      <div className={`field ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        <select {...props} className={`field-control appearance-none pr-10 ${controlClassName ?? ""}`.trim()}>{children}</select>
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
    </div>
  );
}
