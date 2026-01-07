'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Loader2, CheckCircle2, User, Briefcase, DollarSign, X } from 'lucide-react';

const onboardingSchema = z.object({
  headline: z.string().min(10, 'Headline minimal 10 karakter').max(100, 'Headline maksimal 100 karakter'),
  bio: z.string().min(50, 'Bio minimal 50 karakter').max(1000, 'Bio maksimal 1000 karakter'),
  hourlyRate: z.number().min(50000, 'Rate minimal Rp 50.000'),
  skills: z.array(z.string()).min(1, 'Pilih minimal 1 skill'),
  portfolioUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
  linkedinUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const AVAILABLE_SKILLS = [
  'Data Analysis',
  'Data Visualization',
  'Excel/Spreadsheet',
  'Python',
  'R',
  'SQL',
  'Power BI',
  'Tableau',
  'Google Data Studio',
  'Statistical Analysis',
  'Machine Learning',
  'Business Intelligence',
  'Financial Analysis',
  'Market Research',
  'Data Cleaning',
];

export default function AnalystOnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      headline: '',
      bio: '',
      hourlyRate: 100000,
      skills: [],
      portfolioUrl: '',
      linkedinUrl: '',
    },
  });

  const hourlyRate = watch('hourlyRate');

  // Check if profile is already complete
  useEffect(() => {
    async function checkProfile() {
      if (status === 'loading') return;

      if (!session?.user?.id) {
        router.push('/login');
        return;
      }

      if (session.user.role !== 'ANALYST') {
        router.push('/dashboard');
        return;
      }

      try {
        const res = await fetch('/api/analyst/profile');
        const data = await res.json();

        if (data.success && data.data.profile) {
          const profile = data.data.profile;
          // Check if profile is reasonably complete
          if (profile.headline && profile.bio && profile.skills?.length > 0) {
            router.push('/dashboard');
            return;
          }
          // Pre-fill existing data
          if (profile.headline) setValue('headline', profile.headline);
          if (profile.bio) setValue('bio', profile.bio);
          if (profile.hourlyRate) setValue('hourlyRate', profile.hourlyRate);
          if (profile.skills?.length) {
            setSelectedSkills(profile.skills);
            setValue('skills', profile.skills);
          }
          if (profile.portfolioUrl) setValue('portfolioUrl', profile.portfolioUrl);
          if (profile.linkedinUrl) setValue('linkedinUrl', profile.linkedinUrl);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setIsCheckingProfile(false);
      }
    }

    checkProfile();
  }, [session, status, router, setValue]);

  const toggleSkill = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(newSkills);
    setValue('skills', newSkills);
  };

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyst/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan profil');
      }

      toast({
        title: 'Profil berhasil disimpan!',
        description: 'Selamat datang di DataPraktis. Mulai cari proyek sekarang!',
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Gagal menyimpan profil',
        description: error instanceof Error ? error.message : 'Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingProfile || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Profil', icon: User },
    { number: 2, title: 'Keahlian', icon: Briefcase },
    { number: 3, title: 'Tarif', icon: DollarSign },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Lengkapi Profil Analyst</h1>
        <p className="text-muted-foreground">
          Buat profil menarik agar klien tertarik dengan jasa Anda
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= step.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Profile Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Ceritakan tentang diri Anda kepada calon klien
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline Profesional *</Label>
                <Input
                  id="headline"
                  placeholder="Contoh: Data Analyst dengan 5 tahun pengalaman di industri retail"
                  {...register('headline')}
                />
                {errors.headline && (
                  <p className="text-sm text-destructive">{errors.headline.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Headline singkat yang menjelaskan keahlian Anda
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  rows={5}
                  placeholder="Ceritakan pengalaman, keahlian, dan pencapaian Anda..."
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimal 50 karakter. Jelaskan pengalaman dan keahlian Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolioUrl">Portfolio URL (Opsional)</Label>
                  <Input
                    id="portfolioUrl"
                    type="url"
                    placeholder="https://portfolio.com/anda"
                    {...register('portfolioUrl')}
                  />
                  {errors.portfolioUrl && (
                    <p className="text-sm text-destructive">{errors.portfolioUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL (Opsional)</Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    {...register('linkedinUrl')}
                  />
                  {errors.linkedinUrl && (
                    <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setCurrentStep(2)}>
                  Lanjut
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Skills */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Keahlian</CardTitle>
              <CardDescription>
                Pilih skill yang Anda kuasai (minimal 1)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Skill *</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/80 transition-colors"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                      {selectedSkills.includes(skill) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                {errors.skills && (
                  <p className="text-sm text-destructive">{errors.skills.message}</p>
                )}
              </div>

              {selectedSkills.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Skill terpilih:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSkills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  Kembali
                </Button>
                <Button type="button" onClick={() => setCurrentStep(3)}>
                  Lanjut
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Rate */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Tarif per Jam</CardTitle>
              <CardDescription>
                Tentukan tarif Anda (bisa diubah nanti)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Tarif per Jam (IDR) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min={50000}
                  step={10000}
                  {...register('hourlyRate', { valueAsNumber: true })}
                />
                {errors.hourlyRate && (
                  <p className="text-sm text-destructive">{errors.hourlyRate.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Tarif Anda: <strong>{formatCurrency(hourlyRate || 0)}/jam</strong>
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">Tips menentukan tarif:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Pertimbangkan pengalaman dan keahlian Anda</li>
                  <li>Riset tarif analyst di pasar Indonesia</li>
                  <li>Mulai kompetitif, naikkan seiring reputasi</li>
                  <li>Platform mengambil 10% komisi dari setiap proyek</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                  Kembali
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan & Mulai
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
