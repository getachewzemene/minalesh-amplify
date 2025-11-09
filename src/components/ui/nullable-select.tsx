"use client";

import { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL, NONE, Sentinel, toSentinel, fromSentinel } from "@/lib/select";

export interface NullableSelectProps {
  value: string; // underlying value ('' means none/cleared)
  onValueChange: (value: string) => void; // receives '' when sentinel selected
  placeholder?: string;
  sentinel?: Sentinel; // default sentinel to use when value is ''
  sentinelLabel: string; // label for the sentinel row (e.g., "All Categories" or "No Category")
  children: ReactNode; // additional <SelectItem value="..."> entries
  disabled?: boolean;
}

/**
 * NullableSelect wraps shadcn/Radix Select to support nullable selections.
 * - When underlying value is '' it renders the provided sentinel value ("all" or "none").
 * - When sentinel is selected, onValueChange('') is emitted for the consumer state.
 */
export function NullableSelect({
  value,
  onValueChange,
  placeholder,
  sentinel = ALL,
  sentinelLabel,
  children,
  disabled,
}: NullableSelectProps) {
  return (
    <Select
      value={toSentinel(value, sentinel)}
      onValueChange={(v) => onValueChange(fromSentinel(v))}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={sentinel}>{sentinelLabel}</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}

export { ALL, NONE };
