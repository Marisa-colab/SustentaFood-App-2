import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  User,
  Scale,
  DollarSign,
  Cloud,
  Download
} from 'lucide-react';
import { WasteLog, WasteCategory, WasteType, ProductionLocation } from '../types';

interface WasteLogViewProps {
  logs: WasteLog[];
  onOpenNewModal: () => void;
  onDeleteLog: (id: string) => void;
}

export const WasteLogView: React.FC<WasteLogViewProps> = ({
  logs,
  onOpenNewModal,
  onDeleteLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchesType = typeFilter === 'ALL' || log.type === typeFilter;
    const matchesLocation = locationFilter === 'ALL' || log.location === locationFilter;

    return matchesSearch && matchesCategory && matchesType && matchesLocation;
  });

  // Calculate totals for filtered view
  const totalKg = filteredLogs.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCost = filteredLogs.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalCo2 = filteredLogs.reduce((acc, curr) => acc + curr.co2eKg, 0);

  // Helper function for category color badges
  const getCategoryBadgeClass = (category: WasteCategory) => {
    switch (category) {
      case 'Carne': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Peixe': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Frutas': return 'bg-lime-100 text-lime-800 border-lime-200';
      case 'Legumes': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Lacticínios': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Padaria': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Refeições Confecionadas': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Alimento', 'Categoria', 'Tipo', 'Quantidade', 'Unidade', 'Custo/Unid (€)', 'Custo Total (€)', 'CO2e (kg)', 'Local', 'Responsavel', 'Notas'];
    const rows = filteredLogs.map(l => [
      l.id,
      `${l.date} ${l.time}`,
      `"${l.item.replace(/"/g, '""')}"`,
      l.category,
      l.type,
      l.quantity,
      l.unit,
      l.costPerUnit,
      l.totalCost,
      l.co2eKg,
      `"${l.location}"`,
      `"${l.responsible.replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SustentaFood_Residuos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner & Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registo de Resíduos Alimentares</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico e classificação minuciosa de perdas por categoria e setor de produção
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar CSV / Excel</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registo</span>
          </button>
        </div>
      </div>

      {/* Filtered View Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Volume Total Registado</span>
            <div className="text-2xl font-bold mt-0.5">{totalKg.toFixed(1)} kg / L</div>
          </div>
          <div className="p-2.5 bg-slate-800 rounded-xl text-emerald-400 border border-slate-700">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Impacto Financeiro Pérdida</span>
            <div className="text-2xl font-bold text-rose-400 mt-0.5">{totalCost.toFixed(2)} €</div>
          </div>
          <div className="p-2.5 bg-slate-800 rounded-xl text-rose-400 border border-slate-700">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Pegada CO₂e Estimada</span>
            <div className="text-2xl font-bold text-sky-400 mt-0.5">{totalCo2.toFixed(1)} kg CO₂e</div>
          </div>
          <div className="p-2.5 bg-slate-800 rounded-xl text-sky-400 border border-slate-700">
            <Cloud className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Pesquisar alimento, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="Carne">Carne</option>
              <option value="Peixe">Peixe</option>
              <option value="Frutas">Frutas</option>
              <option value="Legumes">Legumes</option>
              <option value="Lacticínios">Lacticínios</option>
              <option value="Padaria">Padaria</option>
              <option value="Refeições Confecionadas">Refeições Confecionadas</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="ALL">Todos os Tipos de Desperdício</option>
              <option value="Sobras de refeições">Sobras de refeições</option>
              <option value="Produtos fora de prazo">Produtos fora de prazo</option>
              <option value="Restos de preparação">Restos de preparação</option>
              <option value="Alimentos devolvidos">Alimentos devolvidos</option>
              <option value="Avaria / Falha de frio">Avaria / Falha de frio</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="ALL">Todos os Locais de Produção</option>
              <option value="Cozinha Central">Cozinha Central</option>
              <option value="Empratamento / Buffet">Empratamento / Buffet</option>
              <option value="Armazém / Câmara Fria">Armazém / Câmara Fria</option>
              <option value="Sala de Refeições">Sala de Refeições</option>
              <option value="Bar / Cafetaria">Bar / Cafetaria</option>
              <option value="Pastelaria">Pastelaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">ID / Data</th>
                <th className="px-4 py-3.5">Alimento & Categoria</th>
                <th className="px-4 py-3.5">Origem / Tipo</th>
                <th className="px-4 py-3.5 text-right">Quantidade</th>
                <th className="px-4 py-3.5 text-right">Custo Total (€)</th>
                <th className="px-4 py-3.5 text-right">CO₂e (kg)</th>
                <th className="px-4 py-3.5">Local & Responsável</th>
                <th className="px-4 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Nenhum registo de resíduos encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date & ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{log.id}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {log.date} {log.time}
                      </span>
                    </td>

                    {/* Item Name & Category */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <span className="font-bold text-slate-900 block text-sm">{log.item}</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${getCategoryBadgeClass(log.category)}`}>
                        {log.category}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                        {log.type}
                      </span>
                      {log.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1" title={log.notes}>
                          "{log.notes}"
                        </p>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-sm whitespace-nowrap">
                      {log.quantity} {log.unit}
                      <span className="text-[10px] font-normal text-slate-500 block">
                        ({log.costPerUnit.toFixed(2)} €/{log.unit})
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3.5 text-right font-bold text-rose-600 text-sm whitespace-nowrap">
                      {log.totalCost.toFixed(2)} €
                    </td>

                    {/* CO2e */}
                    <td className="px-4 py-3.5 text-right font-medium text-emerald-700 whitespace-nowrap">
                      {log.co2eKg} kg
                    </td>

                    {/* Location & Responsible */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-400" /> {log.location}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" /> {log.responsible}
                      </span>
                    </td>

                    {/* Delete action */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar registo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
