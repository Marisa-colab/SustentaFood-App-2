import React, { useState } from 'react';
import {
  TrendingDown,
  EuroSign,
  Cloud,
  Target,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  PlusCircle,
  PiggyBank,
  ChevronRight,
  Boxes,
  HeartHandshake,
  ShieldCheck,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { WasteLog, SummaryMetrics, AlertItem } from '../types';
import { topWastedProducts, sectorLossBreakdown, monthlyWasteTrend } from '../mockData';

interface DashboardViewProps {
  wasteLogs: WasteLog[];
  metrics: SummaryMetrics;
  alerts: AlertItem[];
  highlightPrediction: string;
  onOpenNewWasteModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  wasteLogs,
  metrics,
  alerts,
  highlightPrediction,
  onOpenNewWasteModal,
  setActiveTab
}) => {
  // Target reduction slider state for loss vs savings calculator
  const [savingsTargetPercent, setSavingsTargetPercent] = useState<number>(50);

  // Calculated values for loss vs savings module
  const currentMonthlyLoss = metrics.totalCostLostMonth;
  const potentialMonthlySavings = (currentMonthlyLoss * (savingsTargetPercent / 100));
  const potentialAnnualSavings = potentialMonthlySavings * 12;

  // Category colors for chart
  const categoryColors: Record<string, string> = {
    'Peixe': '#0284c7', // sky-600
    'Carne': '#e11d48', // rose-600
    'Refeições Confecionadas': '#d97706', // amber-600
    'Padaria': '#b45309', // amber-700
    'Legumes': '#16a34a', // green-600
    'Frutas': '#84cc16', // lime-500
    'Lacticínios': '#0284c7', // light blue
    'Outros': '#64748b' // slate-500
  };

  const unreadAlerts = alerts.filter(a => !a.read);

  return (
    <div className="space-[#121212] space-y-6 pb-12">
      {/* AI Highlight Banner (Requirement #11 & #12) */}
      <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-emerald-950/90 border border-indigo-500/30 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 mt-0.5">
              <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
                  Previsão Preditiva de Desperdício (Gemini IA)
                </span>
                <span className="text-xs text-slate-400">Atualizado hoje</span>
              </div>
              <p className="text-base sm:text-lg font-medium text-slate-100 mt-1">
                "{highlightPrediction}"
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ai_forecast')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md whitespace-nowrap transition-all"
          >
            <span>Ver Análise da IA</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Requirement #12 & #4) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Resíduos Hoje */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Resíduos Hoje</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalWasteKgToday.toFixed(1)}</span>
            <span className="text-xs font-medium text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">-12%</span> vs. média diária
          </p>
        </div>

        {/* Resíduos Este Mês */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Resíduos Este Mês</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalWasteKgMonth.toFixed(0)}</span>
            <span className="text-xs font-medium text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Média: <strong className="text-slate-700">{metrics.kgPerDayAvg.toFixed(1)} kg/dia</strong>
          </p>
        </div>

        {/* Valor Económico Perdido */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm hover:shadow-md transition-shadow bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Valor Perdido</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-700">{metrics.totalCostLostMonth.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs font-medium text-rose-600">€</span>
          </div>
          <p className="text-[11px] text-rose-600/80 mt-2">
            Perda acumulada no mês atual
          </p>
        </div>

        {/* Emissões CO2e */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Emissões CO₂e</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Cloud className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{metrics.totalCo2eKgMonth.toFixed(0)}</span>
            <span className="text-xs font-medium text-slate-500">kg CO₂e</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Fator médio: ~2.8 kg CO₂/kg
          </p>
        </div>

        {/* Meta de Redução */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Meta de Redução</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{metrics.currentReductionPercent}%</span>
            <span className="text-xs text-slate-500">alcançado</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.currentReductionPercent / metrics.reductionGoalPercent) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* SPECIAL MODULE (Requirement #12): "Quanto dinheiro se perdeu e quanto poderia ser poupado" */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <PiggyBank className="w-5 h-5" />
              <span>Simulador Económico de Recuperação de Poupanças</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Análise Económica: O Impacto Real no Seu Orçamento
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Atualmente foram perdidos <strong className="text-rose-400">{currentMonthlyLoss.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €</strong> este mês em resíduos alimentares.
              Ajuste a meta de otimização para calcular a poupança anual projetada.
            </p>

            {/* Slider control */}
            <div className="pt-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
                <span>Meta de Redução do Desperdício:</span>
                <span className="text-emerald-400 font-bold text-sm">{savingsTargetPercent}% de redução</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={savingsTargetPercent}
                onChange={(e) => setSavingsTargetPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>10% (Modesta)</span>
                <span>30% (Recomendada)</span>
                <span>50% (SustentaFood Standard)</span>
                <span>80% (Zero Waste Max)</span>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="w-full lg:w-auto bg-slate-950/80 rounded-xl p-5 border border-emerald-500/40 space-y-4 min-w-[280px]">
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase block">Poupança Estimada / Mês</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-0.5">
                + {potentialMonthlySavings.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 font-medium uppercase block">Impacto Acumulado em 12 Meses</span>
              <div className="text-2xl font-bold text-white mt-0.5">
                + {potentialAnnualSavings.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} € / ano
              </div>
              <p className="text-[11px] text-emerald-300/80 mt-1">
                Equivalente a reutilizar ~{(metrics.totalWasteKgMonth * (savingsTargetPercent / 100) * 12).toFixed(0)} kg de comida!
              </p>
            </div>

            <button
              onClick={() => setActiveTab('economic')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ver Detalhes do Plano Económico</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Monthly Trend & Top 10 Wasted Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend Chart (Requirement #12 & #9) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Evolução Mensal do Desperdício</h3>
              <p className="text-xs text-slate-500">Comparativo de total em kg vs. Meta de Redução</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Realizado (kg)
              </span>
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <span className="w-3 h-0.5 bg-slate-400 inline-block" /> Meta (kg)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyWasteTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${value} kg`,
                    name === 'kg' ? 'Desperdício Total' : 'Meta'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#wasteGradient)" />
                <Area type="monotone" dataKey="targetKg" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Wasted Products Bar Chart (Requirement #12) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top 10 Alimentos Desperdiçados</h3>
                <p className="text-xs text-slate-500">Ranking por volume (kg) e custo associado</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-200">
                Ação Prioritária
              </span>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1 text-xs">
              {topWastedProducts.slice(0, 7).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <span className="text-[10px] text-slate-500">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 block">{item.kg} kg</span>
                    <span className="text-[10px] text-rose-600 font-medium">{item.cost.toFixed(2)} €</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('waste_logs')}
            className="w-full mt-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1"
          >
            <span>Ver Todos os Registos de Resíduos</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sector Breakdown & Quick System Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Per sector loss breakdown */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Perdas Económicas por Setor de Produção</h3>
          <p className="text-xs text-slate-500 mb-4">Onde ocorrem as maiores perdas financeiras na operação</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {sectorLossBreakdown.map((sector, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{sector.sector}</span>
                  <span className="font-bold text-rose-600">{sector.lossCost.toFixed(2)} € ({sector.percent}%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${sector.percent * 2}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Causa: {sector.mainReason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col justify-between shadow-md">
          <div>
            <h3 className="text-base font-bold text-slate-100 mb-1">Ações Operacionais Rápidas</h3>
            <p className="text-xs text-slate-400 mb-4">Atalhos diretos para gerir o ciclo de vida dos alimentos</p>

            <div className="space-y-2.5">
              <button
                onClick={onOpenNewWasteModal}
                className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-emerald-200" />
                  <span>Novo Registo de Resíduo</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('stock_fefo')}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-between transition-all border border-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-4 h-4 text-sky-400" />
                  <span>Consultar Rotação FEFO & Validades</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('donations')}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-between transition-all border border-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-rose-400" />
                  <span>Doar Excedente Alimentar Seguro</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('haccp')}
                className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-between transition-all border border-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Registo de Rejeições HACCP</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {unreadAlerts.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-rose-400">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4" /> {unreadAlerts.length} alerta(s) de ação pendente
              </span>
              <button onClick={() => setActiveTab('alerts')} className="underline text-slate-300 hover:text-white">
                Ver Alertas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
