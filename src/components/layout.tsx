"use client";

import {
    BarChart3,
    LayoutDashboard,
    LogOut,
    Settings,
    ShieldAlert,
    Table as TableIcon,
    User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/icons';


const AppSidebar = () => {
    const { open } = useSidebar();
    const pathname = usePathname();

    const menuItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/reports', label: 'Reports', icon: TableIcon },
        { href: '/alerts', label: 'Alerts', icon: ShieldAlert },
    ];

    return (
      <Sidebar>
        <SidebarHeader>
            <div className={`flex items-center gap-2 ${open ? 'w-full' : 'w-0'}`}>
                <Logo className="size-7 text-primary" />
                <span className="font-semibold text-lg whitespace-nowrap">CostPilotAI</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
                 <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                            <item.icon />
                            {item.label}
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    );
  };
  
const Header = () => {
    const pathname = usePathname();
    const getPageTitle = () => {
        switch (pathname) {
            case '/dashboard':
                return 'Dashboard';
            case '/analytics':
                return 'Analytics';
            case '/reports':
                return 'Reports';
            case '/alerts':
                return 'Alerts';
            default:
                return 'Dashboard';
        }
    }

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
        <SidebarTrigger className="md:hidden" />
        <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:text-2xl">{getPageTitle()}</h1>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" />
                <AvatarFallback>U</AvatarFallback>
                </Avatar>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
                </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </header>
    );
};

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
