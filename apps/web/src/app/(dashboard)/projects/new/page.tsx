'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  BarChart,
  Check,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  questions: TemplateQuestion[];
  suggestedBudgetMin: number;
  suggestedBudgetMax: number;
  defaultMilestones: { title: string; description: string; percentageOfBudget: number }[];
  exampleDeliverables: { title: string; description: string }[];
}

interface TemplateQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  BarChart,
  Sparkles,
  FileSpreadsheet,
};

const steps = [
  { id: 'template', title: 'Pilih Template' },
  { id: 'details', title: 'Detail Proyek' },
  { id: 'budget', title: 'Budget & Timeline' },
  { id: 'review', title: 'Review' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [budgetMin, setBudgetMin] = useState<number>(0);
  const [budgetMax, setBudgetMax] = useState<number>(0);
  const [deadline, setDeadline] = useState('');

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.success) {
          setTemplates(data.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Gagal memuat template',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, [toast]);

  // Set default budget when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setBudgetMin(selectedTemplate.suggestedBudgetMin);
      setBudgetMax(selectedTemplate.suggestedBudgetMax);
    }
  }, [selectedTemplate]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelectToggle = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [questionId]: current.filter((v) => v !== value) };
      }
      return { ...prev, [questionId]: [...current, value] };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedTemplate !== null;
      case 1:
        if (!title || title.length < 5) return false;
        if (!description || description.length < 20) return false;
        // Check required questions
        if (selectedTemplate) {
          for (const q of selectedTemplate.questions) {
            if (q.required && !answers[q.id]) return false;
            if (q.required && q.type === 'multiselect') {
              const arr = answers[q.id] as string[];
              if (!arr || arr.length === 0) return false;
            }
          }
        }
        return true;
      case 2:
        return budgetMin >= 500000 && budgetMax >= budgetMin;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate?.id,
          title,
          description,
          templateAnswers: answers,
          budgetMin,
          budgetMax,
          deadline: deadline || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      toast({
        title: 'Proyek berhasil dibuat!',
        description: 'Analyst akan segera mengajukan proposal',
      });

      router.push(`/projects/${data.data.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal membuat proyek',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Pilih jenis proyek</h2>
              <p className="text-muted-foreground">
                Template membantu Anda menjelaskan kebutuhan dengan jelas
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                  const Icon = iconMap[template.icon] || FileSpreadsheet;
                  const isSelected = selectedTemplate?.id === template.id;

                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary/50',
                        isSelected && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          {isSelected && (
                            <div className="rounded-full bg-primary p-1">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Budget: {formatCurrency(template.suggestedBudgetMin)} -{' '}
                          {formatCurrency(template.suggestedBudgetMax)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-semibold mb-2">Detail proyek Anda</h2>
              <p className="text-muted-foreground">
                Jawab beberapa pertanyaan untuk membantu analyst memahami kebutuhan Anda
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Proyek *</Label>
                <Input
                  id="title"
                  placeholder="Contoh: Analisis Penjualan Q4 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Singkat *</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan apa yang ingin Anda capai dan konteks bisnis Anda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {selectedTemplate?.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label>
                    {question.label} {question.required && '*'}
                  </Label>

                  {question.type === 'select' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.options?.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleAnswerChange(question.id, option.value)}
                          className={cn(
                            'rounded-lg border p-3 text-left text-sm transition-colors',
                            answers[question.id] === option.value
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.type === 'multiselect' && (
                    <div className="flex flex-wrap gap-2">
                      {question.options?.map((option) => {
                        const selected = ((answers[question.id] as string[]) || []).includes(
                          option.value
                        );
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleMultiSelectToggle(question.id, option.value)}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-sm transition-colors',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'hover:border-primary/50'
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {question.type === 'textarea' && (
                    <Textarea
                      placeholder={question.placeholder}
                      value={(answers[question.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={3}
                    />
                  )}

                  {question.type === 'text' && (
                    <Input
                      placeholder={question.placeholder}
                      value={(answers[question.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-semibold mb-2">Budget & Timeline</h2>
              <p className="text-muted-foreground">
                Tentukan budget dan kapan Anda membutuhkan hasilnya
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Range Budget</CardTitle>
                <CardDescription>
                  Berdasarkan template, budget yang disarankan:{' '}
                  {formatCurrency(selectedTemplate?.suggestedBudgetMin || 0)} -{' '}
                  {formatCurrency(selectedTemplate?.suggestedBudgetMax || 0)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Budget Minimum (IDR)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      min={500000}
                      step={500000}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(budgetMin)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget Maximum (IDR)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min={budgetMin}
                      step={500000}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(budgetMax)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deadline (Opsional)</CardTitle>
                <CardDescription>
                  Kapan Anda membutuhkan hasil proyek ini?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload File (Opsional)</CardTitle>
                <CardDescription>
                  Upload data Anda untuk membantu analyst memberikan proposal lebih akurat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-2">
                    File dapat diupload setelah proyek dibuat
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Setelah proyek dipublikasikan, Anda dapat mengupload file data (Excel, CSV, PDF, dll.)
                    dari halaman detail proyek.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-semibold mb-2">Review Proyek Anda</h2>
              <p className="text-muted-foreground">
                Periksa kembali sebelum mempublikasikan
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>{selectedTemplate?.name}</Badge>
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Budget</h4>
                  <p className="text-lg">
                    {formatCurrency(budgetMin)} - {formatCurrency(budgetMax)}
                  </p>
                </div>

                {deadline && (
                  <div>
                    <h4 className="font-medium mb-2">Deadline</h4>
                    <p>{new Date(deadline).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Yang akan Anda dapatkan</h4>
                  <ul className="space-y-2">
                    {selectedTemplate?.exampleDeliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                        <div>
                          <span className="font-medium">{d.title}</span>
                          <span className="text-muted-foreground"> - {d.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
              <Check className="h-5 w-5 text-green-500" />
              <p className="text-sm">
                Dengan mempublikasikan, Anda menyetujui{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Syarat & Ketentuan
                </Link>{' '}
                DataPraktis
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Posting Proyek Baru</h1>
          <p className="text-muted-foreground">
            Langkah {currentStep + 1} dari {steps.length}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap',
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStep
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="w-4 text-center">{index + 1}</span>
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Sebelumnya
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={!canProceed()}
          >
            Selanjutnya
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publikasikan Proyek
          </Button>
        )}
      </div>
    </div>
  );
}
