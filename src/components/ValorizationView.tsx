import React, { useState } from 'react';
import {
  Recycle,
  Plus,
  Leaf,
  Flame,
  Droplet,
  CheckCircle2,
  Calendar,
  Cloud
} from 'lucide-react';
import { ValorizationLog } from '../types';

interface ValorizationViewProps {
  valorizationLogs: ValorizationLog[];
  onAddValorizationLog: (log: Omit<ValorizationLog, 'id'>) => void;
}

export const ValorizationView: React.FC<ValorizationViewProps> = ({
  valorizationLogs,
  onAddValorizationLog
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [destination, setDestination] = useState<
    'Compostagem' | 'Alimentação Animal' | 'Biogás / Bioenergia' | 'Reciclagem de Óleos (OAU)' | 'Outro'
  >('Compostagem');
  const [quantityKg, setQuantityKg] = useState<number>(50);
  const [partnerEntity, setPartnerEntity] = useState('Horta Comunitária Urbana');
  const [responsible, setResponsible] = useState('António Costa (Sous-Chef)');
  const [notes, setNotes] = useState('Borras de café e cascas de fruta enviadas para compostagem orgânica.');

  const totalKg = valorizationLogs.reduce((acc, curr) => acc + curr.quantityKg, 0);
  const totalCo2Saved = valorizationLogs.reduce((acc, curr) => acc + curr.co2SavedKg, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityKg <= 0) return;

    // CO2 saved factor (e.g., 1.1 kg CO2 avoided per kg composted)
    const co2Factor = destination === 'Reciclagem de Óleos (OAU)' ? 3.0 : 1.1;

    onAddValorizationLog({
      destination,
      quantityKg,
      date: new Date().toISOString().split('T')[0],
      partnerEntity: partnerEntity.trim() || 'Entidade Parceira',
      co2SavedKg: Number((quantityKg * co2Factor).toFixed(1)),
      responsible: responsible.trim(),
      notes: notes.trim()
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Compostagem, Valorização & Economia Circular</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Desvio de Aterro Sanitário
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Encaminhamento de resíduos orgânicos para compostagem, produção de biogás, alimentação animal e reciclagem de óleos
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registar Envio para Valorização</span>
        </button>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-950 text-white rounded-2xl p-4 border border-emerald-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Total Desviado de Aterro</span>
          <div className="text-3xl font-extrabold text-white mt-1">{totalKg} kg</div>
          <p className="text-xs text-emerald-300/80 mt-1">100% transformado em recurso útil</p>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">CO₂ Evitado</span>
          <div className="text-3xl font-extrabold text-sky-400 mt-1">{totalCo2Saved.toFixed(0)} kg CO₂</div>
          <p className="text-xs text-slate-400 mt-1">Créditos de carbono locais</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <Leaf className="w-4 h-4" /> <span>Fertilizante Orgânico</span>
          </div>
          <p className="text-slate-600">Projeção: ~{(totalKg * 0.45).toFixed(0)} kg de composto fértil para hortas.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-1">
          <div className="flex items-center gap-2 text-amber-700 font-bold">
            <Flame className="w-4 h-4" /> <span>Bioenergia & OAU</span>
          </div>
          <p className="text-slate-600">Óleos reciclados transformados em biodiesel limpo.</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
          <span>Registo Histórico de Encaminhamentos Ecológicos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Destino Ecológico</th>
                <th className="px-4 py-3">Entidade Recetora</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
                <th className="px-4 py-3 text-right">CO₂ Evitado</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {valorizationLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{log.date}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {log.destination}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{log.partnerEntity}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{log.quantityKg} kg</td>
                  <td className="px-4 py-3 text-right font-bold text-sky-700">{log.co2SavedKg} kg CO₂</td>
                  <td className="px-4 py-3 text-slate-600">{log.responsible}</td>
                  <td className="px-4 py-3 text-slate-500 italic max-w-xs">{log.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registar Valorização / Compostagem</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destino Sustentável *</label>
                <select
                  value={destination}
                  onChange={(e: any) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border font-medium"
                >
                  <option value="Compostagem">Compostagem Orgânica</option>
                  <option value="Alimentação Animal">Alimentação Animal / Ração</option>
                  <option value="Biogás / Bioenergia">Produção de Biogás / Bioenergia</option>
                  <option value="Reciclagem de Óleos (OAU)">Reciclagem de Óleos Usados (OAU)</option>
                  <option value="Outro">Outro Processo de Reciclagem</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantidade Enviada (kg / L) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entidade / Parceiro Recetor *</label>
                <input
                  type="text"
                  value={partnerEntity}
                  onChange={(e) => setPartnerEntity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responsável</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow"
                >
                  Gravar Registo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
