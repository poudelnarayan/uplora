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
        <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'Inter, Open Sans, sans-serif', color: 'hsl(210, 40%, 25%)' }}>
          {label}
        </label>
      )}
      <div className={`relative ${error ? 'field-error' : ''} ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        {isMultiline ? (
          <textarea {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={`w-full p-3 rounded-lg border border-slate-200 bg-slate-50/50 placeholder:opacity-60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/50 transition-all ${controlClassName ?? ""}`.trim()} style={{ fontFamily: 'Inter, Open Sans, sans-serif', color: 'hsl(176, 20%, 16%)', '::placeholder': { color: 'hsl(176, 20%, 16%)' } }} />
        ) : (
          <input {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} className={`w-full p-3 rounded-lg border border-slate-200 bg-slate-50/50 placeholder:opacity-60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/50 transition-all ${controlClassName ?? ""}`.trim()} style={{ fontFamily: 'Inter, Open Sans, sans-serif', color: 'hsl(176, 20%, 16%)', '::placeholder': { color: 'hsl(176, 20%, 16%)' } }} />
        )}
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm" style={{ fontFamily: 'Inter, Open Sans, sans-serif', color: 'hsl(0, 65%, 45%)' }}>
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
        <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(210, 40%, 25%)' }}>
          {label}
        </label>
      )}
      <div className={`relative ${error ? 'field-error' : ''} ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        <select {...props} className={`w-full p-3 rounded-lg border border-slate-200 bg-slate-50/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/50 transition-all appearance-none pr-10 ${controlClassName ?? ""}`.trim()} style={{ color: 'hsl(176, 20%, 16%)' }}>{children}</select>
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm" style={{ color: 'hsl(0, 65%, 45%)' }}>
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
