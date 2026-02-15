import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Players', href: '/players', icon: Users },
        { name: 'Economy', href: '/economy', icon: DollarSign },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-border">
                        <h1 className="text-2xl font-bold text-primary">MTA Analytics</h1>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{user?.username || 'Admin'}</p>
                                <p className="text-xs text-muted-foreground">{user?.role || 'ADMIN'}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 rounded-lg hover:bg-accent transition-colors"
                                title="Logout"
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
