import React from 'react';
import {
  Leaf,
  LayoutDashboard,
  ClipboardList,
  TrendingDown,
  Boxes,
  HeartHandshake,
  Recycle,
  ShieldAlert,
  FileSpreadsheet,
  Bell,
  Sparkles,
  PlusCircle,
  Truck
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadAlertCount: number;
  onOpenNewWasteModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadAlertCount,
  onOpenNewWasteModal
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'waste_logs', label: 'Desperdício', icon: ClipboardList },
    { id: 'economic', label: 'Economia & KPIs', icon: TrendingDown },
    { id: 'stock_fefo', label: 'Stocks FEFO', icon: Boxes },
    { id: 'suppliers', label: 'Fornecedores e Faturas', icon: Truck },
    { id: 'donations', label: 'Doações', icon: HeartHandshake },
    { id: 'valorization', label: 'Compostagem', icon: Recycle },
    { id: 'haccp', label: 'HACCP', icon: ShieldAlert },
    { id: 'ai_forecast', label: 'Previsões IA', icon: Sparkles },
    { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
                Sustenta<span className="text-emerald-400">Food</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero Desperdício
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Gestão, Prevenção do Desperdício Alimentar & HACCP
            </p>
          </div>
        </div>

        {/* Right Actions & Badges */}
        <div className="flex items-center gap-3">
          {/* AI Status Badge */}
          <button
            onClick={() => setActiveTab('ai_forecast')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-200 text-xs hover:bg-indigo-900/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Gemini 3.6 IA Ativa</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative p-2 rounded-lg border transition-colors ${
              activeTab === 'alerts'
                ? 'bg-slate-800 border-emerald-500 text-emerald-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Alertas do Sistema"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Quick Register Button */}
          <button
            onClick={onOpenNewWasteModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Registar Resíduo</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg font-medium whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border-emerald-400 shadow-sm'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
