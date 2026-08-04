import React, { useState } from 'react';
import {
  TrendingDown,
  DollarSign,
  Scale,
  Cloud,
  PieChart as PieIcon,
  Calculator,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { SummaryMetrics, WasteLog } from '../types';
import { sectorLossBreakdown } from '../mockData';

interface EconomicAnalysisViewProps {
  metrics: SummaryMetrics;
  wasteLogs: WasteLog[];
}

export const EconomicAnalysisView: React.FC<EconomicAnalysisViewProps> = ({
  metrics,
  wasteLogs
}) => {
  // Sample Example calculation state (User can try custom numbers in live calculator)
  const [calcKg, setCalcKg] = useState<number>(120);
  const [calcCostPerKg, setCalcCostPerKg] = useState<number>(12.00);
  const [calcFoodType, setCalcFoodType] = useState<string>('Peixe / Bacalhau');

  const customLossMonthly = calcKg * calcCostPerKg;
  const customLossAnnual = customLossMonthly * 12;

  // Category Cost Aggregation
  const categoryCostMap: Record<string, { totalCost: number; totalKg: number }> = {};
  wasteLogs.forEach((log) => {
    if (!categoryCostMap[log.category]) {
      categoryCostMap[log.category] = { totalCost: 0, totalKg: 0 };
    }
    categoryCostMap[log.category].totalCost += log.totalCost;
    categoryCostMap[log.category].totalKg += log.quantity;
  });

  const categoryChartData = Object.keys(categoryCostMap).map((cat) => ({
    name: cat,
    cost: Number(categoryCostMap[cat].totalCost.toFixed(2)),
    kg: Number(categoryCostMap[cat].totalKg.toFixed(1))
  }));

  const COLORS = ['#0284c7', '#e11d48', '#16a34a', '#d97706', '#b45309', '#84cc16', '#6366f1', '#64748b'];

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Análise Económica & Indicadores de Desempenho (KPIs)</h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitorização rigorosa do custo do desperdício, custo/refeição, projeções anuais e emissões de carbono
        </p>
      </div>

      {/* Main KPI Cards Row (Requirement #4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kg Resíduos / Dia */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Média Diária</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {metrics.kgPerDayAvg.toFixed(1)} <span className="text-sm font-semibold text-slate-400">kg/dia</span>
          </div>
          <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> -8.4% em relação ao mês anterior
          </p>
        </div>

        {/* Kg Resíduos / Refeição Servida */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Desperdício / Refeição</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {(metrics.kgPerMeal * 1000).toFixed(0)} <span className="text-sm font-semibold text-slate-400">g/refeição</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Base: {metrics.mealsServedMonth.toLocaleString()} refeições servidas
          </p>
        </div>

        {/* Custo Mensal Perdido */}
        <div className="bg-rose-950/80 text-white rounded-2xl p-5 shadow-sm border border-rose-800/60">
          <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">Custo Perdido (Mês)</span>
          <div className="text-3xl font-extrabold text-rose-300 mt-1">
            {metrics.totalCostLostMonth.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
          </div>
          <p className="text-xs text-rose-200 mt-2">
            Projeção Anual: <strong className="text-white font-bold">{(metrics.totalCostLostMonth * 12).toLocaleString('pt-PT')} €/ano</strong>
          </p>
        </div>

        {/* Emissões CO2e */}
        <div className="bg-emerald-950/80 text-white rounded-2xl p-5 shadow-sm border border-emerald-800/60">
          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">Impacto Ambiental</span>
          <div className="text-3xl font-extrabold text-emerald-300 mt-1">
            {metrics.totalCo2eKgMonth.toFixed(0)} <span className="text-sm font-semibold text-emerald-200">kg CO₂e</span>
          </div>
          <p className="text-xs text-emerald-200 mt-2">
            Equivalente a <strong className="text-white">{(metrics.totalCo2eKgMonth / 120).toFixed(1)} árvores</strong> plantadas
          </p>
        </div>
      </div>

      {/* Example Calculation Module (User Explicit Requirement #3) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <span>Exemplo de Análise Económica & Calculadora de Perdas</span>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
            Fórmula: Perda Mensal = Quantidade (kg) × Custo Médio (€/kg)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Produto / Matéria-Prima</label>
              <input
                type="text"
                value={calcFoodType}
                onChange={(e) => setCalcFoodType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Volume Desperdiçado (kg)</label>
                <input
                  type="number"
                  value={calcKg}
                  onChange={(e) => setCalcKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custo Médio (€/kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={calcCostPerKg}
                  onChange={(e) => setCalcCostPerKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Formula Display */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-wider block">Cálculo de Exemplo em Tempo Real</span>
            <p className="text-sm font-medium text-slate-200">
              Resíduos de <strong className="text-white">{calcFoodType}</strong>: {calcKg} kg × {calcCostPerKg.toFixed(2)} €/kg
            </p>
            <div className="text-2xl font-extrabold text-rose-400 pt-1">
              Perda Mensal: {calcKg} × {calcCostPerKg.toFixed(2)} = {customLossMonthly.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-800 pt-2 mt-1">
              Perda Anual Projetada: <strong className="text-white">{customLossAnnual.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} € / ano</strong>
            </div>
          </div>

          {/* Savings Outcome */}
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 text-emerald-950 space-y-2 text-xs">
            <span className="font-bold text-emerald-800 text-sm block">Potencial de Poupança Directa</span>
            <p className="text-slate-700 leading-relaxed">
              Ao aplicar a rotação FEFO e ajuste de porção neste produto, reduziria a perda em 70%:
            </p>
            <div className="text-2xl font-bold text-emerald-700 pt-1">
              + {(customLossMonthly * 0.70).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} € / mês recuperados!
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Charts: Cost by Category & Per Sector Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Category Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Custo do Desperdício por Categoria de Alimentos</h3>
          <p className="text-xs text-slate-500 mb-4">Total acumulado (€) por grupo de alimentos no mês atual</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  formatter={(val: any) => [`${val} €`, 'Custo Perdido']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Loss Analysis */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Análise de Custo e Causa por Setor</h3>
            <p className="text-xs text-slate-500 mb-4">Diagnóstico das origens de quebras de stocks e devoluções</p>

            <div className="space-y-3 text-xs">
              {sectorLossBreakdown.map((sector, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{sector.sector}</span>
                    <span className="text-rose-600">{sector.lossCost.toFixed(2)} €</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <strong>Motivo Principal:</strong> {sector.mainReason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
