'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  BarChart,
  Clock,
  FileSpreadsheet,
  Filter,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string | null;
  createdAt: string;
  template: {
    name: string;
    slug: string;
    icon: string;
  } | null;
  client: {
    name: string;
    image: string | null;
  };
  _count: {
    proposals: number;
    files: number;
  };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  BarChart,
  Sparkles,
  FileSpreadsheet,
};

const skillTags = [
  'Excel',
  'Python',
  'SQL',
  'Power BI',
  'Tableau',
  'Data Cleaning',
  'Forecasting',
  'Dashboard',
];

export default function BrowsePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects?status=OPEN');
        const data = await res.json();
        if (data.success) {
          setProjects(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const filteredProjects = projects.filter((project) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !project.title.toLowerCase().includes(query) &&
        !project.description.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    // Add more filters here
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Cari Proyek</h1>
        <p className="text-muted-foreground">
          Temukan proyek yang sesuai dengan keahlian Anda
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan judul atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2 self-center">Filter skill:</span>
          {skillTags.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                selectedSkills.includes(skill)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-primary/50'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Budget Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <span className="text-sm text-muted-foreground mr-2 self-center">Budget:</span>
          <Button
            variant={budgetRange === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBudgetRange(null)}
          >
            Semua
          </Button>
          <Button
            variant={budgetRange === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBudgetRange('low')}
          >
            {'< Rp 3 jt'}
          </Button>
          <Button
            variant={budgetRange === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBudgetRange('medium')}
          >
            Rp 3-10 jt
          </Button>
          <Button
            variant={budgetRange === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBudgetRange('high')}
          >
            {'> Rp 10 jt'}
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredProjects.length} proyek ditemukan
        </p>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Tidak ada proyek ditemukan</h3>
            <p className="text-muted-foreground text-center">
              Coba ubah filter pencarian Anda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map((project) => {
            const Icon = project.template?.icon
              ? iconMap[project.template.icon] || FileSpreadsheet
              : FileSpreadsheet;

            return (
              <Card key={project.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {project.template && (
                          <Badge variant="outline" className="text-xs">
                            {project.template.name}
                          </Badge>
                        )}
                      </div>
                      <Link href={`/browse/${project.id}`}>
                        <CardTitle className="text-lg hover:text-primary transition-colors line-clamp-1">
                          {project.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Client info */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground">{project.client.name}</span>
                    </div>

                    {/* Budget and deadline */}
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-primary">
                        {formatCurrency(project.budgetMin)} - {formatCurrency(project.budgetMax)}
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(project.deadline).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {project._count.proposals} proposal
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(project.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
