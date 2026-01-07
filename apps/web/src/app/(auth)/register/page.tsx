'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getProviders } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Briefcase, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'ANALYST'>(
    (searchParams.get('role')?.toUpperCase() as 'CLIENT' | 'ANALYST') || 'CLIENT'
  );

  useEffect(() => {
    getProviders().then((providers) => {
      setHasGoogleProvider(!!providers?.google);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mendaftar');
      }

      toast({
        title: 'Pendaftaran berhasil!',
        description: 'Silakan login dengan akun baru Anda',
      });

      // Auto login after registration
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: selectedRole === 'ANALYST' ? '/onboarding/analyst' : '/dashboard',
      });
    } catch (error) {
      toast({
        title: 'Pendaftaran gagal',
        description: error instanceof Error ? error.message : 'Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', {
        callbackUrl: selectedRole === 'ANALYST' ? '/onboarding/analyst' : '/dashboard',
      });
    } catch (error) {
      toast({
        title: 'Terjadi kesalahan',
        description: 'Gagal daftar dengan Google',
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Daftar</CardTitle>
        <CardDescription className="text-center">
          Buat akun DataPraktis Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Selection */}
        <div className="space-y-2">
          <Label>Saya ingin mendaftar sebagai</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedRole('CLIENT')}
              className={cn(
                'flex flex-col items-center p-4 rounded-lg border-2 transition-colors',
                selectedRole === 'CLIENT'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Briefcase className={cn(
                'h-8 w-8 mb-2',
                selectedRole === 'CLIENT' ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="font-medium">Bisnis</span>
              <span className="text-xs text-muted-foreground text-center">
                Cari analyst untuk proyek
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ANALYST')}
              className={cn(
                'flex flex-col items-center p-4 rounded-lg border-2 transition-colors',
                selectedRole === 'ANALYST'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <BarChart2 className={cn(
                'h-8 w-8 mb-2',
                selectedRole === 'ANALYST' ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="font-medium">Analyst</span>
              <span className="text-xs text-muted-foreground text-center">
                Kerjakan proyek data
              </span>
            </button>
          </div>
        </div>

        {/* Google Sign Up - only show if Google provider is configured */}
        {hasGoogleProvider && (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Lanjutkan dengan Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Atau dengan email
                </span>
              </div>
            </div>
          </>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@perusahaan.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Daftar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Dengan mendaftar, Anda menyetujui{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Syarat & Ketentuan
          </Link>{' '}
          dan{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Kebijakan Privasi
          </Link>{' '}
          kami.
        </p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
