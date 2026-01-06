'use client';

import { useEffect } from 'react';
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
  X,
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

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user?.role as 'CLIENT' | 'ANALYST' | 'ADMIN') || 'CLIENT';

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r lg:hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">DataPraktis</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
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
      </aside>
    </>
  );
}
