'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validations/auth';
import { authAPI } from '@/lib/api/endpoints/auth';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

export default function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    try {
      await authAPI.forgotPassword(data.email);
      setIsSuccess(true);
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to send reset email. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We've sent password reset instructions to{' '}
            <span className="font-medium text-foreground">{form.getValues('email')}</span>
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Return to login</Link>
        </Button>
      </div>
    );
  }

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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Sending...' : 'Send reset instructions'}
        </Button>

        <div className="text-center text-sm">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}
