'use client';

import * as React from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';
import type { E164Number } from 'react-phone-number-input';

export interface PhoneInputProps {
  value?: E164Number | string;
  onChange?: (value: E164Number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
}

const PhoneInputComponent = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, value, onChange, ...props }, _ref) => {
    const handleChange = (newValue: E164Number | undefined) => {
      if (!onChange) return;

      // Handle leading zero for Kenyan numbers
      // If user types 0722334455, convert to +254722334455 (remove the leading 0)
      if (newValue && newValue.startsWith('+2540')) {
        // Remove the 0 after +254
        const correctedValue = newValue.replace('+2540', '+254') as E164Number;
        onChange(correctedValue);
      } else {
        onChange(newValue);
      }
    };

    return (
      <PhoneInputWithCountry
        {...props}
        value={value as E164Number}
        onChange={handleChange}
        defaultCountry="KE"
        international={false}
        countryCallingCodeEditable={false}
        limitMaxLength={true}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-within:ring-destructive',
          className
        )}
        numberInputProps={{
          className: 'flex-1 bg-transparent outline-none placeholder:text-muted-foreground ml-2',
        }}
      />
    );
  }
);

PhoneInputComponent.displayName = 'PhoneInput';

export { PhoneInputComponent as PhoneInput };
