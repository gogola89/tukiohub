'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { registerSchema, RegisterInput } from '@/lib/validations/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatPhoneForBackend } from '@/lib/utils/phone';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function RegisterForm() {
  const { register, isRegistering } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      password2: '',
      phone_number: '',
      company_name: '',
      role: 'ORGANIZER',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    // Format phone number for backend (remove + prefix)
    const formattedData = {
      ...data,
      phone_number: formatPhoneForBackend(data.phone_number),
    };
    register(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="712 345 678"
                  error={!!form.formState.errors.phone_number}
                />
              </FormControl>
              <FormDescription>
                Kenya phone number (country code +254 is added automatically)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="EventPro Kenya"
                  autoComplete="organization"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Must be 8+ characters with uppercase, lowercase, number and special
                character
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword2 ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword2(!showPassword2)}
                  >
                    {showPassword2 ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isRegistering}>
          {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRegistering ? 'Creating account...' : 'Create account'}
        </Button>

        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}
