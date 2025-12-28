"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  /** Selected date */
  date?: Date;
  /** Callback when date changes */
  onDateChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Custom date format string (default: "PPP") */
  dateFormat?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Allow clearing the date */
  clearable?: boolean;
  /** Custom className for the trigger button */
  className?: string;
  /** Minimum selectable date */
  fromDate?: Date;
  /** Maximum selectable date */
  toDate?: Date;
  /** ID for form association */
  id?: string;
  /** Name for form association */
  name?: string;
}

/**
 * DatePicker - A date selection component using Calendar and Popover
 * 
 * @example
 * // Basic usage
 * <DatePicker
 *   date={selectedDate}
 *   onDateChange={setSelectedDate}
 *   placeholder="Pick a date"
 * />
 * 
 * @example
 * // With constraints
 * <DatePicker
 *   date={followUpDate}
 *   onDateChange={setFollowUpDate}
 *   fromDate={new Date()}
 *   clearable
 * />
 */
export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  disabled = false,
  clearable = false,
  className,
  fromDate,
  toDate,
  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange?.(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, dateFormat) : <span>{placeholder}</span>}
          {clearable && date && (
            <X
              className="ml-auto h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          fromDate={fromDate}
          toDate={toDate}
        />
      </PopoverContent>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={date ? date.toISOString() : ""}
        />
      )}
    </Popover>
  );
}

export interface DateRangePickerProps {
  /** Selected date range */
  dateRange?: { from: Date | undefined; to: Date | undefined };
  /** Callback when date range changes */
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Custom date format string (default: "LLL dd, y") */
  dateFormat?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Custom className for the trigger button */
  className?: string;
  /** Number of months to display */
  numberOfMonths?: number;
}

/**
 * DateRangePicker - A date range selection component
 * 
 * @example
 * <DateRangePicker
 *   dateRange={range}
 *   onDateRangeChange={setRange}
 *   placeholder="Select date range"
 * />
 */
export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Select date range",
  dateFormat = "LLL dd, y",
  disabled = false,
  className,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, dateFormat)} - {format(dateRange.to, dateFormat)}
              </>
            ) : (
              format(dateRange.from, dateFormat)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={(range) => {
            onDateRangeChange?.(range as { from: Date | undefined; to: Date | undefined });
            if (range?.from && range?.to) {
              setOpen(false);
            }
          }}
          numberOfMonths={numberOfMonths}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
