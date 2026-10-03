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
import { computeTopWastedProducts, computeSectorLossBreakdown, computeMonthTotals, percentChange } from '../wasteStats';

interface ReportsViewProps {
  metrics: SummaryMetrics;
  wasteLogs: WasteLog[];
  orgName?: string;
  orgNif?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  wasteLogs: allWasteLogs,
  orgName = '',
  orgNif = ''
}) => {

    const monthOptions = React.useMemo(() => {
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const options: string[] = [];
    const hoje = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      options.push(`${nomesMeses[d.getMonth()]} ${d.getFullYear()}`);
    }
    return options;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  // Dados do mês escolhido e do mês anterior (para comparação)
  const selIndex = Math.max(0, monthOptions.indexOf(selectedMonth));
  const hojeRef = new Date();
  const selDate = new Date(hojeRef.getFullYear(), hojeRef.getMonth() - selIndex, 1);
  const prevDate = new Date(selDate.getFullYear(), selDate.getMonth() - 1, 1);
  const mesSel = computeMonthTotals(allWasteLogs, selDate.getFullYear(), selDate.getMonth());
  const mesAnt = computeMonthTotals(allWasteLogs, prevDate.getFullYear(), prevDate.getMonth());
  const wasteLogs = mesSel.logs;
  const variacaoKg = percentChange(mesSel.kg, mesAnt.kg);
  const diasNoPeriodo =
    selIndex === 0
      ? hojeRef.getDate()
      : new Date(selDate.getFullYear(), selDate.getMonth() + 1, 0).getDate();
  const topWastedProducts = computeTopWastedProducts(wasteLogs, 5);
  const sectorLossBreakdown = computeSectorLossBreakdown(wasteLogs);
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
           {monthOptions.map((mes) => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
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
            <span className="font-bold block text-slate-800">Estabelecimento: {orgName || '—'}</span>
            <span className="text-slate-500">NIF: {orgNif || 'não indicado'}</span>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Volume Total de Resíduos</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{mesSel.kg.toFixed(1)} kg</div>
            <span className={`text-[10px] font-semibold ${variacaoKg === null ? 'text-slate-500' : variacaoKg <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {variacaoKg === null ? 'Sem dados do mês anterior' : `${variacaoKg > 0 ? '+' : ''}${variacaoKg}% vs. mês anterior`}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Perda Económica Total</span>
            <div className="text-xl font-extrabold text-rose-600 mt-0.5">{mesSel.cost.toFixed(2)} €</div>
            <span className="text-[10px] text-slate-500">Média: {(mesSel.cost / diasNoPeriodo).toFixed(2)} €/dia</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Emissões CO₂e Geradas</span>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{mesSel.co2.toFixed(0)} kg CO₂e</div>
            <span className="text-[10px] text-slate-500">Fator de emissão médio</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block uppercase text-[10px]">Desperdício / Refeição</span>
            <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
              {metrics.mealsServedMonth > 0 ? `${(metrics.kgPerMeal * 1000).toFixed(0)} g` : '—'}
            </div>
            <span className="text-[10px] text-slate-500">
              {metrics.mealsServedMonth > 0 ? `${metrics.mealsServedMonth} refeições servidas` : 'Refeições servidas não registadas'}
            </span>
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
              {topWastedProducts.length === 0 && (
                <tr><td colSpan={4} className="p-3 text-center text-slate-400">Sem registos de desperdício.</td></tr>
              )}
              {topWastedProducts.map((p, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 font-medium">{p.name}</td>
                  <td className="p-2.5">{p.category}</td>
                  <td className="p-2.5 text-right font-bold">{p.kg.toFixed(1)} kg</td>
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
            {sectorLossBreakdown.length === 0 && (
              <p className="col-span-2 text-center text-slate-400 py-3">Sem perdas registadas.</p>
            )}
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
          <span className="font-bold text-emerald-900 block">Resumo do Período</span>
          <p className="leading-relaxed">
            {wasteLogs.length === 0
              ? 'Não há registos de desperdício neste período.'
              : `Neste período ${wasteLogs.length === 1 ? 'foi registado 1 registo' : `foram registados ${wasteLogs.length} registos`} de desperdício, num total de ${mesSel.kg.toFixed(1)} kg e ${mesSel.cost.toFixed(2)} € de perda. ${
                  variacaoKg === null
                    ? 'Ainda não há dados do mês anterior para comparação.'
                    : variacaoKg <= 0
                    ? `O volume desceu ${Math.abs(variacaoKg)}% face ao mês anterior.`
                    : `O volume subiu ${variacaoKg}% face ao mês anterior.`
                } Valores calculados a partir dos registos introduzidos pelo estabelecimento.`}
          </p>
        </div>
      </div>
    </div>
  );
};
