import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  AlertOctagon,
  Thermometer,
  FileCheck,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Flame,
  FileText,
  Filter,
  Info,
  Layers,
  ListChecks,
  RotateCcw,
  Sparkle,
  Truck,
  UserCheck
} from 'lucide-react';
import { HaccpLog, TemperatureLog, CleaningLog } from '../types';

interface HaccpViewProps {
  haccpLogs: HaccpLog[];
  onAddHaccpLog: (log: Omit<HaccpLog, 'id'>) => void;
  temperatureLogs?: TemperatureLog[];
  onAddTemperatureLog?: (log: Omit<TemperatureLog, 'id'>) => void;
  cleaningLogs?: CleaningLog[];
  onAddCleaningLog?: (log: Omit<CleaningLog, 'id'>) => void;
}

export const HaccpView: React.FC<HaccpViewProps> = ({
  haccpLogs,
  onAddHaccpLog,
  temperatureLogs = [],
  onAddTemperatureLog,
  cleaningLogs = [],
  onAddCleaningLog
}) => {
  const [activeTab, setActiveTab] = useState<
    'non_conformities' | 'temperatures' | 'cleaning' | 'portuguese_leg'
  >('non_conformities');

  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isNcModalOpen, setIsNcModalOpen] = useState(false);
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);
  const [isCleanModalOpen, setIsCleanModalOpen] = useState(false);

  // NC Form
  const [productName, setProductName] = useState('Salmão Inteiro Fresco');
  const [batchNumber, setBatchNumber] = useState('LOTE-SAL-2026-081');
  const [supplier, setSupplier] = useState('Lota de Peniche / Mariscos Lda');
  const [quantityKg, setQuantityKg] = useState<number>(10);
  const [rejectionReason, setRejectionReason] = useState<
    | 'Quebra de Temperatura'
    | 'Prazo Excedido'
    | 'Embalagem Danificada'
    | 'Anomalia Organoléptica'
    | 'Contaminação Cruzada'
    | 'Outro'
  >('Quebra de Temperatura');
  const [temperatureLogged, setTemperatureLogged] = useState<number>(8.8);
  const [correctiveAction, setCorrectiveAction] = useState(
    'Produto rejeitado na receção. Devolução ao fornecedor com emissão de guia de não conformidade.'
  );
  const [responsible, setResponsible] = useState(
    'João Silva (Responsável HACCP)'
  );

  // Temp Form
  const [tempEquip, setTempEquip] = useState('Câmara Frigorífica de Peixe (CF-02)');
  const [tempLocation, setTempLocation] = useState('Cozinha Central');
  const [tempTarget, setTempTarget] = useState('0ºC a 2ºC');
  const [tempMeasured, setTempMeasured] = useState<number>(1.8);
  const [tempShift, setTempShift] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');
  const [tempAction, setTempAction] = useState('');

  // Clean Form
  const [cleanArea, setCleanArea] = useState('Bancadas e Equipamentos de Confeção');
  const [cleanFreq, setCleanFreq] = useState<'Diária' | 'Semanal' | 'Quinzenal' | 'Mensal'>('Diária');
  const [cleanDetergent, setCleanDetergent] = useState('Detergente Desinfetante Clorado Biocida TP4');

  // NC Filter
  const filteredNcLogs = haccpLogs.filter(
    (log) =>
      log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.nonConformityCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Temp Filter
  const filteredTempLogs = temperatureLogs.filter(
    (log) =>
      log.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.responsible.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clean Filter
  const filteredCleanLogs = cleaningLogs.filter(
    (log) =>
      log.areaOrEquipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detergentUsed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.responsible.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleNcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || quantityKg <= 0) return;

    const ncCode = `NC-${new Date().getFullYear()}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    onAddHaccpLog({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      productName: productName.trim(),
      batchNumber: batchNumber.trim(),
      supplier: supplier.trim(),
      quantityKg,
      rejectionReason,
      temperatureLogged:
        rejectionReason === 'Quebra de Temperatura' ? temperatureLogged : undefined,
      nonConformityCode: ncCode,
      correctiveAction: correctiveAction.trim(),
      status: 'Ação Executada',
      responsible: responsible.trim()
    });

    setIsNcModalOpen(false);
  };

  const handleTempSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddTemperatureLog) return;

    // Determine status automatically based on temp thresholds if applicable
    const isOk = tempMeasured <= 5;

    onAddTemperatureLog({
      equipmentName: tempEquip,
      location: tempLocation,
      targetTempRange: tempTarget,
      measuredTemp: tempMeasured,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      shift: tempShift,
      status: isOk ? 'Conforme' : 'Não Conforme',
      correctiveAction: !isOk ? tempAction || 'Ajuste de termostato' : undefined,
      responsible
    });

    setIsTempModalOpen(false);
  };

  const handleCleanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCleaningLog) return;

    onAddCleaningLog({
      areaOrEquipment: cleanArea,
      frequency: cleanFreq,
      detergentUsed: cleanDetergent,
      date: new Date().toISOString().split('T')[0],
      status: 'Inspecionado',
      responsible
    });

    setIsCleanModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                HACCP & Segurança Alimentar (Legislação Portuguesa)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Sistema de Autocontrolo baseado nos princípios HACCP em conformidade com o{' '}
              <strong className="text-slate-200">Regulamento (CE) n.º 852/2004</strong>,{' '}
              <strong className="text-slate-200">Decreto-Lei n.º 67/2014</strong> e normativas da{' '}
              <strong className="text-emerald-400">ASAE / DGAV</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsTempModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Thermometer className="w-4 h-4 text-sky-400" />
              Registar Temperatura
            </button>

            <button
              onClick={() => setIsNcModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Registar Não Conformidade
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('non_conformities')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'non_conformities'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            Não Conformidades & Rejeições ({haccpLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('temperatures')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'temperatures'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            Controlo de Temperaturas ({temperatureLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('cleaning')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'cleaning'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Higienização & Limpeza ({cleaningLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('portuguese_leg')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'portuguese_leg'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Legislação Portuguesa & Guia ASAE/DGAV
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Não Conformidades</span>
            <div className="text-2xl font-bold text-white mt-0.5">{haccpLogs.length} Ocorrências</div>
          </div>
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Registos Frio & Calor</span>
            <div className="text-2xl font-bold text-sky-400 mt-0.5">
              {temperatureLogs.filter((t) => t.status === 'Conforme').length} / {temperatureLogs.length} Conformes
            </div>
          </div>
          <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Higienização BPHF</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">100% Inspecionada</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-medium">Conformidade ASAE/DGAV</span>
            <div className="text-2xl font-bold text-amber-300 mt-0.5">Auditável / Aprovado</div>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-300 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      {activeTab !== 'portuguese_leg' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'non_conformities'
                ? 'Pesquisar por produto, n.º de lote, fornecedor ou código NC...'
                : activeTab === 'temperatures'
                ? 'Pesquisar por equipamento, localização ou responsável...'
                : 'Pesquisar por área de limpeza, produto químico ou responsável...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-white text-xs"
          />
        </div>
      )}

      {/* TAB 1: NON CONFORMITIES */}
      {activeTab === 'non_conformities' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Registo Oficial de Não Conformidades, Desvios e Rejeições na Receção
            </h3>
            <span className="text-xs text-slate-400">Rastreabilidade completa de lotes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Código NC / Data</th>
                  <th className="px-4 py-3.5">Produto & Lote</th>
                  <th className="px-4 py-3.5">Fornecedor</th>
                  <th className="px-4 py-3.5">Motivo da Rejeição</th>
                  <th className="px-4 py-3.5 text-right">Qtd Rejeitada</th>
                  <th className="px-4 py-3.5">Ação Corretiva Executada</th>
                  <th className="px-4 py-3.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredNcLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                      {log.nonConformityCode}
                      <span className="block font-sans text-[10px] text-slate-400 font-normal">
                        {log.date} {log.time}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-white block text-sm">{log.productName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Lote: {log.batchNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-200">{log.supplier}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30 inline-block">
                        {log.rejectionReason}
                      </span>
                      {log.temperatureLogged !== undefined && (
                        <span className="text-[10px] font-bold text-rose-400 block mt-1 flex items-center gap-0.5">
                          <Thermometer className="w-3 h-3" /> Registo: {log.temperatureLogged}ºC
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-rose-400 text-sm">
                      {log.quantityKg} kg
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 max-w-xs">{log.correctiveAction}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px] flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {log.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredNcLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma não conformidade encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPERATURE CONTROL */}
      {activeTab === 'temperatures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-sky-400" />
              Registo Diário de Temperaturas de Equipamentos de Frio e Calor
            </h3>
            <button
              onClick={() => setIsTempModalOpen(true)}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Medição
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTempLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {log.location} • Turno {log.shift}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{log.equipmentName}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      log.status === 'Conforme'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Temperatura Medida</span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        log.status === 'Conforme' ? 'text-sky-300' : 'text-rose-400'
                      }`}
                    >
                      {log.measuredTemp > 0 ? `+${log.measuredTemp}` : log.measuredTemp}ºC
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Intervalo Recomendado</span>
                    <span className="text-xs font-semibold text-slate-200">{log.targetTempRange}</span>
                  </div>
                </div>

                {log.correctiveAction && (
                  <div className="p-2.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-200 mb-2">
                    <strong>Ação Corretiva:</strong> {log.correctiveAction}
                  </div>
                )}

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Data: {log.date} ({log.time})</span>
                  <span>Verificado: {log.responsible}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLEANING & SANITATION */}
      {activeTab === 'cleaning' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Plano de Higienização, Limpeza e Desinfeção de Instalações (BPHF)
            </h3>
            <button
              onClick={() => setIsCleanModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Registar Higienização
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Área / Equipamento</th>
                    <th className="px-4 py-3.5">Frequência</th>
                    <th className="px-4 py-3.5">Detergente / Desinfetante Biocida</th>
                    <th className="px-4 py-3.5">Data da Execução</th>
                    <th className="px-4 py-3.5">Responsável</th>
                    <th className="px-4 py-3.5">Estado Inspecionado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredCleanLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">{log.areaOrEquipment}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold text-[11px]">
                          {log.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 max-w-xs">{log.detergentUsed}</td>
                      <td className="px-4 py-3.5 font-mono">{log.date}</td>
                      <td className="px-4 py-3.5 font-medium">{log.responsible}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px] flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PORTUGUESE LEGISLATION & ASAE/DGAV GUIDELINES */}
      {activeTab === 'portuguese_leg' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Reg CE 852/2004 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Regulamento (CE) N.º 852/2004</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Estabelece as regras gerais de higiene dos géneros alimentícios aplicáveis a todos os operadores do setor alimentar na União Europeia. Obriga à implementação de procedimentos permanentes baseados nos 7 Princípios do Sistema HACCP.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Princípios de Autocontrolo Obrigatórios
              </div>
            </div>

            {/* Card 2: Decreto-Lei 67/2014 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Decreto-Lei n.º 67/2014</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Legislação nacional portuguesa que assegura a execução e aplicação das normas comunitárias relativas à higiene dos géneros alimentícios, estabelecendo o regime sancionatório e competências de fiscalização da ASAE e DGAV.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-sky-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Fiscalização ASAE e DGAV Portugal
              </div>
            </div>

            {/* Card 3: Portaria 215/2011 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Portaria n.º 215/2011</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Define os requisitos higienossanitários específicos para a instalação, funcionamento e infraestruturas dos estabelecimentos de restauração ou de bebidas em território nacional.
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Restauração & Bebidas
              </div>
            </div>
          </div>

          {/* ASAE Audit Checklist Requirements */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Checklist de Requisitos Obrigatórios em Auditoria ASAE / DGAV
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-white block text-sm">1. Rastreabilidade de Lotes & Compras</span>
                <p>
                  Registo contínuo do fornecedor, número de lote, data de receção e faturas correspondentes para responder a alertas de recolha sanitária imediata.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-white block text-sm">2. Controlo da Cadeia de Frio & Calor</span>
                <p>
                  Registos diários de temperaturas em câmaras de refrigeração (0 a 4ºC), congelação (≤-18ºC) e zonas de serviço quente (≥63ºC).
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-white block text-sm">3. Plano de Higienização (BPHF)</span>
                <p>
                  Fichas técnicas e de segurança dos produtos químicos biocidas TP4 e registo impresso/digital das ações de limpeza efetuadas.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-white block text-sm">4. Gestão de Resíduos & Alergénios</span>
                <p>
                  Acondicionamento estanque de resíduos alimentares e informação acessível a clientes sobre os 14 alergénios principais (Regulamento UE 1169/2011).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: NON CONFORMITY */}
      {isNcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                Registar Não Conformidade HACCP
              </h3>
              <button onClick={() => setIsNcModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNcSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Produto Rejeitado *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">N.º do Lote *</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fornecedor *</label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Motivo da Rejeição *</label>
                  <select
                    value={rejectionReason}
                    onChange={(e: any) => setRejectionReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-2 py-1.5 rounded font-medium"
                  >
                    <option value="Quebra de Temperatura">Quebra de Temperatura</option>
                    <option value="Prazo Excedido">Prazo Excedido</option>
                    <option value="Embalagem Danificada">Embalagem Danificada</option>
                    <option value="Anomalia Organoléptica">Anomalia Organoléptica</option>
                    <option value="Contaminação Cruzada">Contaminação Cruzada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Qtd Rejeitada (kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-2 py-1.5 rounded font-bold"
                  />
                </div>
              </div>

              {rejectionReason === 'Quebra de Temperatura' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Temperatura Registada (ºC)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperatureLogged}
                    onChange={(e) => setTemperatureLogged(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-rose-500/50 text-rose-300 px-3 py-2 rounded-xl font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ação Corretiva Executada *</label>
                <textarea
                  rows={2}
                  required
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Responsável HACCP</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNcModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold shadow-lg"
                >
                  Confirmar e Registar NC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TEMPERATURE CONTROL */}
      {isTempModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-sky-400" />
                Registar Medição de Temperatura
              </h3>
              <button onClick={() => setIsTempModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTempSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Equipamento de Frio / Calor *</label>
                <input
                  type="text"
                  required
                  value={tempEquip}
                  onChange={(e) => setTempEquip(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Localização</label>
                  <input
                    type="text"
                    value={tempLocation}
                    onChange={(e) => setTempLocation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Turno</label>
                  <select
                    value={tempShift}
                    onChange={(e: any) => setTempShift(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Intervalo Alvo</label>
                  <input
                    type="text"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-2 py-1.5 rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Temperatura (ºC) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tempMeasured}
                    onChange={(e) => setTempMeasured(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-sky-500 text-sky-300 font-bold px-2 py-1.5 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Responsável pela Medição</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTempModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-lg"
                >
                  Guardar Medição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CLEANING */}
      {isCleanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Registar Ação de Higienização BPHF
              </h3>
              <button onClick={() => setIsCleanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCleanSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Área ou Equipamento *</label>
                <input
                  type="text"
                  required
                  value={cleanArea}
                  onChange={(e) => setCleanArea(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Frequência</label>
                <select
                  value={cleanFreq}
                  onChange={(e: any) => setCleanFreq(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                >
                  <option value="Diária">Diária</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Quinzenal">Quinzenal</option>
                  <option value="Mensal">Mensal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Detergente / Biocida TP4 Utilizado</label>
                <input
                  type="text"
                  value={cleanDetergent}
                  onChange={(e) => setCleanDetergent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Operador / Responsável</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCleanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow-lg"
                >
                  Registar Higienização
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
