import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Scale
} from 'lucide-react';
import { WasteLog, SummaryMetrics } from '../types';
import { monthlyWasteTrend, topWastedProducts, sectorLossBreakdown } from '../mockData';

interface ReportsViewProps {
  metrics: SummaryMetrics;
  wasteLogs: WasteLog[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  wasteLogs
}) => {
  const [selectedMonth, setSelectedMonth] = useState('Julho 2026');

  // Export CSV
  const handleExportExcel = () => {
    const headers = ['ID', 'Data', 'Hora', 'Alimento', 'Categoria', 'Tipo', 'Quantidade', 'Unidade', 'Custo Total (€)', 'CO2e (kg)', 'Local', 'Responsavel'];
    const rows = wasteLogs.map(l => [
      l.id,
      l.date,
      l.time,
      `"${l.item.replace(/"/g, '""')}"`,
      l.category,
      l.type,
      l.quantity,
      l.unit,
      l.totalCost,
      l.co2eKg,
      `"${l.location}"`,
      `"${l.responsible.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SustentaFood_Relatorio_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Relatórios Automáticos & Executivos</h2>
          <p className="text-xs text-slate-500 mt-1">
            Geração de relatórios mensais de sustentabilidade, auditoria e exportação de dados para Excel / PDF
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="Julho 2026">Julho 2026</option>
            <option value="Junho 2026">Junho 2026</option>
            <option value="Maio 2026">Maio 2026</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir PDF Executivo</span>
          </button>
        </div>
      </div>

      {/* Printable Report Layout */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg space-y-6 printable-area text-slate-900">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-sans">
                Sustenta<span className="text-emerald-600">Food</span>
              </span>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
                Relatório Executivo Mensal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Período de Análise: {selectedMonth} | Emissor: Sistema Automático SustentaFood</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold block text-slate-800">Estabelecimento: Cozinha Central SustentaFood</span>
            <span className="text-slate-500">NIF: 501234567</span>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Volume Total de Resíduos</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{metrics.totalWasteKgMonth} kg</div>
            <span className="text-[10px] text-emerald-600 font-semibold">-9.2% vs. mês anterior</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Perda Económica Total</span>
            <div className="text-xl font-extrabold text-rose-600 mt-0.5">{metrics.totalCostLostMonth.toFixed(2)} €</div>
            <span className="text-[10px] text-slate-500">Média: {(metrics.totalCostLostMonth / 30).toFixed(2)} €/dia</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Emissões CO₂e Geradas</span>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{metrics.totalCo2eKgMonth.toFixed(0)} kg CO₂e</div>
            <span className="text-[10px] text-slate-500">Fator de emissão médio</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Desperdício / Refeição</span>
            <div className="text-xl font-extrabold text-indigo-700 mt-0.5">{(metrics.kgPerMeal * 1000).toFixed(0)} g</div>
            <span className="text-[10px] text-slate-500">{metrics.mealsServedMonth} refeições servidas</span>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Resumo dos Principais Alimentos Desperdiçados</h3>
          <table className="w-full text-left border rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="p-2.5">Alimento</th>
                <th className="p-2.5">Categoria</th>
                <th className="p-2.5 text-right">Peso (kg)</th>
                <th className="p-2.5 text-right">Custo Perdido (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-800">
              {topWastedProducts.slice(0, 5).map((p, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 font-medium">{p.name}</td>
                  <td className="p-2.5">{p.category}</td>
                  <td className="p-2.5 text-right font-bold">{p.kg} kg</td>
                  <td className="p-2.5 text-right font-bold text-rose-600">{p.cost.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sector Loss Breakdown */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Distribuição das Perdas por Setor</h3>
          <div className="grid grid-cols-2 gap-3">
            {sectorLossBreakdown.map((s, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{s.sector}</span>
                  <span className="text-[11px] text-slate-500">{s.mainReason}</span>
                </div>
                <div className="text-right font-bold text-rose-600">
                  {s.lossCost.toFixed(2)} € ({s.percent}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conclusion / Audit Notes */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-1">
          <span className="font-bold text-emerald-900 block">Conclusão e Parecer do Sistema SustentaFood</span>
          <p className="leading-relaxed">
            Relatório gerado em conformidade com as metas de economia circular e redução de pegada ecológica. A implementação do plano FEFO e doações permitiu desviar 100% dos excedentes seguros da via do aterro sanitário.
          </p>
        </div>
      </div>
    </div>
  );
};
