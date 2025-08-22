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
        <label className="block text-sm font-medium mb-2 text-[#112D4E]" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>
          {label}
        </label>
      )}
      <div className={`relative ${error ? 'field-error' : ''} ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        {isMultiline ? (
          <textarea {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={`w-full p-3 rounded-lg border border-[#DBE2EF] bg-[#F9F7F7] text-[#112D4E] placeholder:text-[#3F72AF] focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all ${controlClassName ?? ""}`.trim()} style={{ fontFamily: 'Inter, Open Sans, sans-serif' }} />
        ) : (
          <input {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} className={`w-full p-3 rounded-lg border border-[#DBE2EF] bg-[#F9F7F7] text-[#112D4E] placeholder:text-[#3F72AF] focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all ${controlClassName ?? ""}`.trim()} style={{ fontFamily: 'Inter, Open Sans, sans-serif' }} />
        )}
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-[#112D4E]" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>
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
        <label className="block text-sm font-medium mb-2 text-[#112D4E]">
          {label}
        </label>
      )}
      <div className={`relative ${error ? 'field-error' : ''} ${className ?? ""}`.trim()}>
        {icon && <span className="field-addon">{icon}</span>}
        <select {...props} className={`w-full p-3 rounded-lg border border-[#DBE2EF] bg-[#F9F7F7] text-[#112D4E] focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20 transition-all appearance-none pr-10 ${controlClassName ?? ""}`.trim()}>{children}</select>
        {rightIcon && <span className="field-addon-right">{rightIcon}</span>}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-[#112D4E]">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
