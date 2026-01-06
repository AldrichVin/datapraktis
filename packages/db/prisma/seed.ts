import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Analisis & Forecasting Penjualan',
    slug: 'sales-analysis',
    description:
      'Analisis data penjualan historis untuk memahami tren, pola musiman, dan membuat proyeksi penjualan ke depan.',
    category: 'analytics',
    icon: 'TrendingUp',
    questions: [
      {
        id: 'goal',
        type: 'select',
        label: 'Apa tujuan utama analisis ini?',
        required: true,
        options: [
          { value: 'understand_decline', label: 'Memahami penurunan penjualan' },
          { value: 'forecast', label: 'Proyeksi penjualan ke depan' },
          { value: 'find_patterns', label: 'Menemukan pola dan tren' },
          { value: 'compare_products', label: 'Membandingkan performa produk' },
        ],
      },
      {
        id: 'data_period',
        type: 'select',
        label: 'Berapa lama periode data yang Anda miliki?',
        required: true,
        options: [
          { value: '3_months', label: '3 bulan' },
          { value: '6_months', label: '6 bulan' },
          { value: '1_year', label: '1 tahun' },
          { value: '2_years_plus', label: '2 tahun atau lebih' },
        ],
      },
      {
        id: 'metrics',
        type: 'multiselect',
        label: 'Metrik apa saja yang ingin dianalisis?',
        required: true,
        options: [
          { value: 'revenue', label: 'Revenue/Omzet' },
          { value: 'units', label: 'Jumlah unit terjual' },
          { value: 'profit', label: 'Profit margin' },
          { value: 'customers', label: 'Jumlah pelanggan' },
          { value: 'aov', label: 'Average Order Value' },
        ],
      },
      {
        id: 'context',
        type: 'textarea',
        label: 'Ceritakan konteks bisnis Anda (opsional)',
        placeholder: 'Contoh: Kami adalah toko online fashion yang mengalami penurunan 20% di Q4...',
        required: false,
      },
    ],
    suggestedBudgetMin: 3000000,
    suggestedBudgetMax: 10000000,
    defaultMilestones: [
      {
        title: 'Data Cleaning & Validasi',
        description: 'Membersihkan dan memvalidasi data, memastikan format konsisten',
        percentageOfBudget: 25,
      },
      {
        title: 'Analisis & Insight',
        description: 'Analisis mendalam, identifikasi tren dan pola penting',
        percentageOfBudget: 40,
      },
      {
        title: 'Laporan & Rekomendasi',
        description: 'Laporan lengkap dengan visualisasi dan rekomendasi actionable',
        percentageOfBudget: 35,
      },
    ],
    exampleDeliverables: [
      {
        title: 'Dataset yang sudah dibersihkan',
        description: 'File Excel/CSV dengan data yang sudah divalidasi dan konsisten',
      },
      {
        title: 'Dashboard interaktif',
        description: 'Dashboard di Google Data Studio atau Power BI untuk monitoring',
      },
      {
        title: 'Laporan insight',
        description: 'PDF 5-10 halaman dengan temuan utama, visualisasi, dan rekomendasi',
      },
      {
        title: 'Model forecasting',
        description: 'Proyeksi 3-6 bulan ke depan dengan confidence interval',
      },
    ],
  },
  {
    name: 'Dashboard Marketing & ROI',
    slug: 'marketing-dashboard',
    description:
      'Buat dashboard untuk melacak performa campaign marketing, mengukur ROI, dan mengidentifikasi channel terbaik.',
    category: 'dashboard',
    icon: 'BarChart',
    questions: [
      {
        id: 'channels',
        type: 'multiselect',
        label: 'Channel marketing apa saja yang Anda gunakan?',
        required: true,
        options: [
          { value: 'google_ads', label: 'Google Ads' },
          { value: 'meta_ads', label: 'Facebook/Instagram Ads' },
          { value: 'tiktok', label: 'TikTok Ads' },
          { value: 'email', label: 'Email Marketing' },
          { value: 'seo', label: 'SEO/Organic' },
          { value: 'influencer', label: 'Influencer Marketing' },
          { value: 'offline', label: 'Offline/Event' },
        ],
      },
      {
        id: 'goals',
        type: 'multiselect',
        label: 'Metrik apa yang paling penting untuk dilacak?',
        required: true,
        options: [
          { value: 'roas', label: 'ROAS (Return on Ad Spend)' },
          { value: 'cac', label: 'CAC (Customer Acquisition Cost)' },
          { value: 'conversions', label: 'Conversion Rate' },
          { value: 'traffic', label: 'Traffic & Engagement' },
          { value: 'leads', label: 'Lead Generation' },
        ],
      },
      {
        id: 'tool',
        type: 'select',
        label: 'Preferensi tool untuk dashboard?',
        required: true,
        options: [
          { value: 'looker', label: 'Google Looker Studio (gratis)' },
          { value: 'powerbi', label: 'Power BI' },
          { value: 'tableau', label: 'Tableau' },
          { value: 'sheets', label: 'Google Sheets (sederhana)' },
          { value: 'flexible', label: 'Fleksibel, sesuai rekomendasi analyst' },
        ],
      },
      {
        id: 'update_frequency',
        type: 'select',
        label: 'Seberapa sering data perlu diupdate?',
        required: true,
        options: [
          { value: 'realtime', label: 'Real-time / otomatis' },
          { value: 'daily', label: 'Harian' },
          { value: 'weekly', label: 'Mingguan' },
          { value: 'manual', label: 'Manual (saya update sendiri)' },
        ],
      },
    ],
    suggestedBudgetMin: 5000000,
    suggestedBudgetMax: 15000000,
    defaultMilestones: [
      {
        title: 'Requirement & Data Mapping',
        description: 'Diskusi kebutuhan, akses data source, dan desain dashboard',
        percentageOfBudget: 20,
      },
      {
        title: 'Dashboard Development',
        description: 'Pembuatan dashboard dengan semua visualisasi dan KPI',
        percentageOfBudget: 50,
      },
      {
        title: 'Testing & Handover',
        description: 'Testing, dokumentasi, dan training penggunaan dashboard',
        percentageOfBudget: 30,
      },
    ],
    exampleDeliverables: [
      {
        title: 'Dashboard interaktif',
        description: 'Dashboard lengkap dengan filter, drill-down, dan auto-refresh',
      },
      {
        title: 'Dokumentasi',
        description: 'Panduan penggunaan dan cara update data',
      },
      {
        title: 'Video walkthrough',
        description: 'Video 10-15 menit menjelaskan cara baca dan gunakan dashboard',
      },
    ],
  },
  {
    name: 'Data Cleaning & Segmentasi',
    slug: 'data-cleaning',
    description:
      'Bersihkan data dari duplikat, format tidak konsisten, dan missing values. Segmentasi pelanggan untuk targeting lebih baik.',
    category: 'cleaning',
    icon: 'Sparkles',
    questions: [
      {
        id: 'data_type',
        type: 'select',
        label: 'Jenis data apa yang perlu dibersihkan?',
        required: true,
        options: [
          { value: 'customer', label: 'Data pelanggan (nama, kontak, alamat)' },
          { value: 'transaction', label: 'Data transaksi/penjualan' },
          { value: 'product', label: 'Data produk/inventory' },
          { value: 'mixed', label: 'Campuran beberapa jenis' },
        ],
      },
      {
        id: 'data_size',
        type: 'select',
        label: 'Perkiraan jumlah baris data?',
        required: true,
        options: [
          { value: 'small', label: 'Kurang dari 1.000 baris' },
          { value: 'medium', label: '1.000 - 10.000 baris' },
          { value: 'large', label: '10.000 - 100.000 baris' },
          { value: 'xlarge', label: 'Lebih dari 100.000 baris' },
        ],
      },
      {
        id: 'issues',
        type: 'multiselect',
        label: 'Masalah apa saja yang Anda temui?',
        required: true,
        options: [
          { value: 'duplicates', label: 'Data duplikat' },
          { value: 'format', label: 'Format tidak konsisten' },
          { value: 'missing', label: 'Data kosong/missing' },
          { value: 'typos', label: 'Typo dan kesalahan ketik' },
          { value: 'merge', label: 'Perlu digabung dari banyak sumber' },
        ],
      },
      {
        id: 'segmentation',
        type: 'select',
        label: 'Apakah perlu segmentasi pelanggan?',
        required: true,
        options: [
          { value: 'yes', label: 'Ya, saya ingin segmentasi pelanggan' },
          { value: 'no', label: 'Tidak, hanya cleaning saja' },
          { value: 'maybe', label: 'Mungkin, tergantung rekomendasi analyst' },
        ],
      },
    ],
    suggestedBudgetMin: 1500000,
    suggestedBudgetMax: 6000000,
    defaultMilestones: [
      {
        title: 'Audit & Planning',
        description: 'Review data, identifikasi masalah, dan rencana pembersihan',
        percentageOfBudget: 20,
      },
      {
        title: 'Data Cleaning',
        description: 'Proses pembersihan, deduplikasi, dan standardisasi',
        percentageOfBudget: 50,
      },
      {
        title: 'Validasi & Delivery',
        description: 'Validasi hasil, dokumentasi perubahan, dan handover',
        percentageOfBudget: 30,
      },
    ],
    exampleDeliverables: [
      {
        title: 'Dataset bersih',
        description: 'File Excel/CSV dengan data yang sudah dibersihkan dan distandarisasi',
      },
      {
        title: 'Laporan cleaning',
        description: 'Dokumentasi: berapa baris dihapus, diubah, atau digabung',
      },
      {
        title: 'Segmentasi pelanggan',
        description: 'Jika diminta: file dengan label segmen untuk setiap pelanggan',
      },
    ],
  },
];

async function main() {
  console.log('Seeding templates...');

  for (const template of templates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: template,
      create: template,
    });
    console.log(`  Created/updated template: ${template.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
