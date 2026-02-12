'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function LoginForm() {
  const { unifiedLogin, isUnifiedLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    unifiedLogin(data);
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
                  className="h-11 text-base"
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
                    className="h-11 text-base pr-10"
                    autoComplete="current-password"
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
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isUnifiedLoggingIn}>
          {isUnifiedLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUnifiedLoggingIn ? 'Signing in...' : 'Sign in'}
        </Button>

        <div className="text-center text-sm">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </Form>
  );
}
