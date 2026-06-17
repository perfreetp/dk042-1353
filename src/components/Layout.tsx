import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface Props {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: Props) {
  return (
    <div className="min-h-screen bg-deep-blue-900 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-tech-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-alert-orange-500/5 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="ml-60 min-h-screen relative z-10">
        <div className="px-8 py-6">
          <header className="mb-6 animate-fade-in-up">
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
