'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Briefcase,
  FolderOpen,
  Home,
  MessageSquare,
  Search,
  Settings,
  User,
  Plus,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('CLIENT' | 'ANALYST' | 'ADMIN')[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Proyek Saya',
    href: '/projects',
    icon: FolderOpen,
    roles: ['CLIENT'],
  },
  {
    title: 'Cari Proyek',
    href: '/browse',
    icon: Search,
    roles: ['ANALYST'],
  },
  {
    title: 'Proyek Aktif',
    href: '/projects',
    icon: Briefcase,
    roles: ['ANALYST'],
  },
  {
    title: 'Pesan',
    href: '/messages',
    icon: MessageSquare,
  },
  {
    title: 'Pendapatan',
    href: '/analyst/earnings',
    icon: Wallet,
    roles: ['ANALYST'],
  },
  {
    title: 'Profil',
    href: '/analyst/profile',
    icon: User,
    roles: ['ANALYST'],
  },
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user?.role as 'CLIENT' | 'ANALYST' | 'ADMIN') || 'CLIENT';

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">DataPraktis</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {userRole === 'CLIENT' && (
          <Link href="/projects/new" className="block mb-4">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Posting Proyek
            </Button>
          </Link>
        )}

        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {userRole === 'ANALYST' ? 'Analyst' : 'Bisnis'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
