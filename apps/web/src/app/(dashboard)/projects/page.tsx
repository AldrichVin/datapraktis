'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  Clock,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  Search,
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
  _count: {
    proposals: number;
    files: number;
  };
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Mencari Analyst',
  IN_PROGRESS: 'Dikerjakan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'warning'> = {
  DRAFT: 'secondary',
  OPEN: 'warning',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const isClient = session?.user?.role === 'CLIENT';

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
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
    if (statusFilter && project.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isClient ? 'Proyek Saya' : 'Proyek Aktif'}
          </h1>
          <p className="text-muted-foreground">
            {isClient
              ? 'Kelola semua proyek data analytics Anda'
              : 'Proyek yang sedang Anda kerjakan'}
          </p>
        </div>
        {isClient && (
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Proyek Baru
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={statusFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            Semua
          </Button>
          {Object.entries(statusLabels).map(([status, label]) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum ada proyek</h3>
            <p className="text-muted-foreground text-center mb-4">
              {isClient
                ? 'Mulai dengan membuat proyek baru'
                : 'Belum ada proyek yang sedang Anda kerjakan'}
            </p>
            {isClient && (
              <Link href="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Proyek Pertama
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {project.template && (
                        <Badge variant="outline">{project.template.name}</Badge>
                      )}
                      <Badge variant={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                      <CardTitle className="text-lg hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                    </Link>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-primary">
                      {formatCurrency(project.budgetMin)} - {formatCurrency(project.budgetMax)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatRelativeTime(project.createdAt)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {project._count.proposals} proposal
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {project._count.files} file
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Deadline:{' '}
                      {new Date(project.deadline).toLocaleDateString('id-ID', {
                        dateStyle: 'medium',
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
