import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, LogOut, ShoppingCart, FileWarning } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Logo from './Logo';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const navigation = [
        { name: 'Painel', href: '/', icon: LayoutDashboard },
        { name: 'Jogadores', href: '/players', icon: Users },
        { name: 'Economia', href: '/economy', icon: DollarSign },
        { name: 'Multas', href: '/fines', icon: FileWarning },
        { name: 'Recursos', href: '/resources', icon: ShoppingCart },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border shadow-lg">
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-border">
                        <Logo />
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-semibold">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-border bg-accent/5">
                        <div className="flex items-center justify-between gap-3 px-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{user?.username || 'Administrador'}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{user?.role || 'ADMIN'}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                title="Sair"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pl-64">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
