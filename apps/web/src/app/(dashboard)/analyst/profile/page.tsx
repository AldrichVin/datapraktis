'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import {
  Briefcase,
  CreditCard,
  ExternalLink,
  Linkedin,
  Loader2,
  Plus,
  Save,
  Star,
  X,
} from 'lucide-react';

const availableSkills = [
  'Excel',
  'Google Sheets',
  'Python',
  'R',
  'SQL',
  'Power BI',
  'Tableau',
  'Looker Studio',
  'Data Cleaning',
  'Data Visualization',
  'Statistical Analysis',
  'Forecasting',
  'Machine Learning',
  'Dashboard Design',
  'Report Writing',
];

interface AnalystProfile {
  bio: string;
  headline: string;
  skills: string[];
  hourlyRate: number | null;
  portfolioUrl: string;
  linkedinUrl: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  rating: number;
  totalReviews: number;
  completedProjects: number;
  vetted: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  profile: AnalystProfile | null;
}

export default function AnalystProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Form state
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Redirect if not analyst
  useEffect(() => {
    if (session?.user?.role !== 'ANALYST') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/analyst/profile');
        const data = await res.json();

        if (data.success) {
          setProfileData(data.data);
          const profile = data.data.profile;
          if (profile) {
            setHeadline(profile.headline || '');
            setBio(profile.bio || '');
            setSkills(profile.skills || []);
            setHourlyRate(profile.hourlyRate || 0);
            setPortfolioUrl(profile.portfolioUrl || '');
            setLinkedinUrl(profile.linkedinUrl || '');
            setBankName(profile.bankName || '');
            setBankAccountNumber(profile.bankAccountNumber || '');
            setBankAccountName(profile.bankAccountName || '');
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat profil',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/analyst/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          bio,
          skills,
          hourlyRate: hourlyRate || null,
          portfolioUrl,
          linkedinUrl,
          bankName,
          bankAccountNumber,
          bankAccountName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      toast({
        title: 'Profil disimpan!',
        description: 'Perubahan berhasil disimpan',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menyimpan profil',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill) && skills.length < 10) {
      setSkills([...skills, skill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const completionPercentage = () => {
    let completed = 0;
    let total = 8;
    if (headline) completed++;
    if (bio && bio.length >= 50) completed++;
    if (skills.length >= 3) completed++;
    if (hourlyRate) completed++;
    if (portfolioUrl || linkedinUrl) completed++;
    if (bankName && bankAccountNumber && bankAccountName) completed += 3;
    return Math.round((completed / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Profil Analyst</h1>
          <p className="text-muted-foreground">
            Lengkapi profil Anda untuk menarik lebih banyak klien
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Perubahan
        </Button>
      </div>

      {/* Profile Completion */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Kelengkapan Profil</span>
            <span className="font-semibold text-primary">{completionPercentage()}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${completionPercentage()}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Profil lengkap meningkatkan peluang Anda dihire hingga 3x lipat
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {profileData?.profile?.completedProjects || 0}
                </p>
                <p className="text-sm text-muted-foreground">Proyek selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {profileData?.profile?.rating?.toFixed(1) || '0.0'}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({profileData?.profile?.totalReviews || 0})
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Badge
                  variant={profileData?.profile?.vetted ? 'success' : 'secondary'}
                  className="text-xs"
                >
                  {profileData?.profile?.vetted ? 'Terverifikasi' : 'Pending'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Status Verifikasi</p>
                <p className="text-xs text-muted-foreground">
                  {profileData?.profile?.vetted
                    ? 'Profil Anda sudah diverifikasi'
                    : 'Menunggu review tim'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
          <CardDescription>
            Informasi yang akan dilihat klien di profil Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData?.image || ''} />
              <AvatarFallback className="text-2xl">
                {profileData?.name?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{profileData?.name}</p>
              <p className="text-muted-foreground">{profileData?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="Contoh: Data Analyst dengan 5 tahun pengalaman di E-commerce"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{headline.length}/100</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Ceritakan tentang pengalaman, keahlian, dan hasil kerja Anda..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/1000</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">
                <ExternalLink className="inline h-4 w-4 mr-1" />
                Portfolio URL
              </Label>
              <Input
                id="portfolioUrl"
                type="url"
                placeholder="https://yourportfolio.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">
                <Linkedin className="inline h-4 w-4 mr-1" />
                LinkedIn URL
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Keahlian</CardTitle>
          <CardDescription>
            Pilih skill yang Anda kuasai (maksimal 10)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-sm py-1 pl-3 pr-1">
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {availableSkills
              .filter((s) => !skills.includes(s))
              .map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="rounded-full border px-3 py-1 text-sm hover:border-primary hover:bg-primary/5 transition-colors"
                  disabled={skills.length >= 10}
                >
                  <Plus className="inline h-3 w-3 mr-1" />
                  {skill}
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Tarif</CardTitle>
          <CardDescription>
            Rate per jam untuk referensi (opsional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="hourlyRate">Rate per Jam (IDR)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min={0}
              step={50000}
              value={hourlyRate || ''}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              placeholder="150000"
            />
            {hourlyRate > 0 && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(hourlyRate)} / jam
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle>
            <CreditCard className="inline h-5 w-5 mr-2" />
            Rekening Bank
          </CardTitle>
          <CardDescription>
            Untuk menerima pembayaran dari proyek yang selesai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input
                id="bankName"
                placeholder="BCA, Mandiri, BNI, dll"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Nomor Rekening</Label>
              <Input
                id="bankAccountNumber"
                placeholder="1234567890"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Nama Pemilik Rekening</Label>
              <Input
                id="bankAccountName"
                placeholder="Sesuai buku tabungan"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pastikan informasi rekening sesuai agar pembayaran tidak terhambat
          </p>
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Semua Perubahan
        </Button>
      </div>
    </div>
  );
}
