import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  FileText,
  MessageSquare,
  Search,
  Shield,
  Star,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary">
              DataPraktis
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button>Daftar</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Cara Kerja DataPraktis
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Platform marketplace yang menghubungkan bisnis dengan data analyst profesional Indonesia
          </p>
        </div>
      </section>

      {/* For Business */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Briefcase className="h-5 w-5" />
              <span className="font-medium">Untuk Bisnis</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Dapatkan Insight dari Data Anda</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Mudah dan aman mendapatkan bantuan analisis data dari profesional terverifikasi
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <CardHeader className="pt-8">
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Buat Proyek</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pilih template proyek dan jelaskan kebutuhan analisis data Anda
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <CardHeader className="pt-8">
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Terima Proposal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Review proposal dari analyst terverifikasi dan pilih yang terbaik
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <CardHeader className="pt-8">
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Kolaborasi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Komunikasi langsung dengan analyst dan pantau progress proyek
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <CardHeader className="pt-8">
                <CheckCircle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Terima Hasil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Review deliverable dan bayar setelah puas dengan hasilnya
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/register?role=client">
              <Button size="lg">
                Mulai Sebagai Bisnis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Analysts */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Star className="h-5 w-5" />
              <span className="font-medium">Untuk Analyst</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Monetisasi Keahlian Data Anda</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Bergabung dengan komunitas data analyst dan dapatkan proyek dari berbagai industri
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <CardHeader className="pt-8">
                <Upload className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Buat Profil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Lengkapi profil dengan keahlian, portfolio, dan pengalaman Anda
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <CardHeader className="pt-8">
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Cari Proyek</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse proyek yang sesuai dengan keahlian dan minat Anda
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <CardHeader className="pt-8">
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Kirim Proposal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ajukan proposal dengan timeline dan milestone yang jelas
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <CardHeader className="pt-8">
                <Wallet className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Terima Bayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dapatkan pembayaran aman via escrow setelah milestone disetujui
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/register?role=analyst">
              <Button size="lg" variant="outline">
                Daftar Sebagai Analyst
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Keamanan & Kepercayaan</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Kami menjaga keamanan transaksi dan data Anda
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Escrow Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pembayaran ditahan di escrow sampai pekerjaan selesai dan disetujui klien
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Analyst Terverifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Semua analyst melewati proses vetting untuk memastikan kualitas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Star className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Rating & Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sistem rating transparan membantu Anda memilih analyst terbaik
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Memulai?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Bergabung dengan ratusan bisnis dan data analyst di DataPraktis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=client">
              <Button size="lg" variant="secondary">
                Daftar Sebagai Bisnis
              </Button>
            </Link>
            <Link href="/register?role=analyst">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Daftar Sebagai Analyst
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 DataPraktis. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
