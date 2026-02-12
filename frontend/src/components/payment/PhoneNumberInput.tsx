'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function PhoneNumberInput({
  value,
  onChange,
  error,
  disabled = false,
}: PhoneNumberInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d+]/g, ''); // Remove everything except digits and +

    // Remove + if it's not at the beginning
    if (input.indexOf('+') > 0) {
      input = input.replace(/\+/g, '');
    }

    // If user enters number starting with 0, convert to +254
    if (input.startsWith('0')) {
      input = '+254' + input.substring(1);
    }
    // If user enters number starting with 7, add +254 prefix
    else if (input.startsWith('7') && input.length <= 9) {
      input = '+254' + input;
    }
    // If user enters just digits without +254, add it
    else if (!input.startsWith('+254') && !input.startsWith('+') && input.length > 0 && input.length <= 9) {
      input = '+254' + input;
    }
    // If user enters 254 without +, add the +
    else if (input.startsWith('254') && !input.startsWith('+254')) {
      input = '+' + input;
    }

    // Limit to 13 characters (+254XXXXXXXXX)
    if (input.length > 13) {
      input = input.substring(0, 13);
    }

    setDisplayValue(input);
    onChange(input);
  };

  const formatDisplay = (phoneNumber: string) => {
    if (!phoneNumber) return '';

    // Format as +254 722 334 455
    if (phoneNumber.startsWith('+254') && phoneNumber.length >= 4) {
      const countryCode = phoneNumber.substring(0, 4); // +254
      const rest = phoneNumber.substring(4);

      if (rest.length <= 3) {
        return `${countryCode} ${rest}`;
      } else if (rest.length <= 6) {
        return `${countryCode} ${rest.substring(0, 3)} ${rest.substring(3)}`;
      } else {
        return `${countryCode} ${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6)}`;
      }
    }

    return phoneNumber;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone-number" className="flex items-center gap-2">
        <Phone className="w-4 h-4" />
        M-Pesa Phone Number
      </Label>
      <div className="relative">
        <Input
          id="phone-number"
          type="tel"
          value={formatDisplay(displayValue)}
          onChange={handleChange}
          placeholder="+254 722 334 455"
          disabled={disabled}
          className={error ? 'border-red-500' : ''}
          maxLength={17} // Accounting for spaces in formatted display
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">
        Enter your M-Pesa registered phone number (format: +254XXXXXXXXX)
      </p>
    </div>
  );
}
