import React, { useState } from 'react';
import {
  Boxes,
  AlertCircle,
  Calendar,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  HeartHandshake,
  CheckCircle2,
  Search,
  Filter,
  ShieldAlert,
  Camera,
  Upload,
  Sparkles
} from 'lucide-react';
import { StockItem, StockMovement, WasteCategory } from '../types';

interface StockFefoViewProps {
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  onAddMovement: (mov: Omit<StockMovement, 'id'>) => void;
  onOpenDonationModalWithItem?: (itemName: string, category: WasteCategory, qty: number) => void;
  onOpenInvoiceModal?: () => void;
}

export const StockFefoView: React.FC<StockFefoViewProps> = ({
  stockItems,
  stockMovements,
  onAddMovement,
  onOpenDonationModalWithItem,
  onOpenInvoiceModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fefoFilter, setFefoFilter] = useState<string>('ALL');
  const [storageFilter, setStorageFilter] = useState<string>('ALL');

  // Modal for new movement
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<'Entrada' | 'Saída' | 'Ajuste / Inventário' | 'Quebra / Desperdício'>('Saída');
  const [movementQty, setMovementQty] = useState<number>(5);
  const [movementReason, setMovementReason] = useState('Confeção e serviço do dia');

  // Today's date for FEFO calculation
  const today = new Date().toISOString().split('T')[0];

  // FEFO Priority Calculation helper
  const getDaysUntilExpiry = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    const now = new Date(today);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFefo = fefoFilter === 'ALL' || item.fefoPriority === fefoFilter;
    const matchesStorage = storageFilter === 'ALL' || item.storageType === storageFilter;

    return matchesSearch && matchesFefo && matchesStorage;
  });

  // Sort items by expiration date ascending (FEFO rule: first expire first)
  const sortedFefoItems = [...filteredItems].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const handleOpenMovementModal = (item: StockItem) => {
    setSelectedStockItem(item);
    setMovementQty(1);
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem || movementQty <= 0) return;

    onAddMovement({
      stockItemId: selectedStockItem.id,
      itemName: selectedStockItem.name,
      type: movementType,
      quantity: movementQty,
      unit: selectedStockItem.unit,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      responsible: 'João Silva (Gestor de Armazém)',
      reason: movementReason
    });

    setIsMovementModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Gestão de Stocks & Rotação FEFO</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
              First Expire, First Out
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controlo rigoroso de lotes, datas de validade, entradas/saídas e consumo prioritário para evitar produtos vencidos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenInvoiceModal && (
            <button
              onClick={onOpenInvoiceModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <span>Tirar Foto / Carregar Fatura (OCR)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (stockItems.length > 0) handleOpenMovementModal(stockItems[0]);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Movimento</span>
          </button>
        </div>
      </div>

      {/* FEFO Priority Rule Card */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-amber-900 text-sm block">Regra FEFO Ativa no Armazém</span>
            <p className="text-amber-800/90 leading-relaxed">
              Os produtos com validade mais próxima surgem em destaque no topo da lista. Dê prioridade de requisição na cozinha a estes lotes!
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquisar artigo, lote, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div>
          <select
            value={fefoFilter}
            onChange={(e) => setFefoFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
          >
            <option value="ALL">Todas as Prioridades FEFO</option>
            <option value="Crítico">Crítico (Validade Iminele &lt; 3 dias)</option>
            <option value="Atenção">Atenção (Validade &lt; 7 dias)</option>
            <option value="Normal">Normal</option>
          </select>
        </div>

        <div>
          <select
            value={storageFilter}
            onChange={(e) => setStorageFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
          >
            <option value="ALL">Todos os Ambientes de Armazenamento</option>
            <option value="Refrigerado">Refrigerado (+2ºC a +5ºC)</option>
            <option value="Congelado">Congelado (-18ºC)</option>
            <option value="Seco / Ambiente">Seco / Ambiente</option>
          </select>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Prioridade FEFO</th>
                <th className="px-4 py-3.5">Artigo / Código</th>
                <th className="px-4 py-3.5">Lote / Fornecedor</th>
                <th className="px-4 py-3.5">Data de Validade</th>
                <th className="px-4 py-3.5 text-right">Qtd em Stock</th>
                <th className="px-4 py-3.5">Conservação</th>
                <th className="px-4 py-3.5 text-center">Ações de Rotação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {sortedFefoItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Nenhum artigo encontrado em stock com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                sortedFefoItems.map((item) => {
                  const daysLeft = getDaysUntilExpiry(item.expiryDate);
                  const isCritical = daysLeft <= 2;
                  const isWarning = daysLeft > 2 && daysLeft <= 5;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCritical ? 'bg-rose-50/40' : isWarning ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Priority Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-sm animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" /> USAR PRIMEIRO
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                            <Clock className="w-3.5 h-3.5" /> ATENÇÃO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> NORMAL
                          </span>
                        )}
                      </td>

                      {/* Name & Code */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 block text-sm">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.code} | {item.category}
                        </span>
                      </td>

                      {/* Batch & Supplier */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-800 block text-xs">
                          {item.batchNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.supplier || 'Fornecedor Certificado'}
                        </span>
                      </td>

                      {/* Expiry Countdown */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.expiryDate}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            daysLeft <= 0
                              ? 'text-rose-700'
                              : daysLeft <= 2
                              ? 'text-rose-600'
                              : daysLeft <= 5
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {daysLeft <= 0 ? 'Venceu Hoje!' : `Faltam ${daysLeft} dias`}
                        </span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-sm block">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({item.costPerUnit.toFixed(2)} €/{item.unit})
                        </span>
                      </td>

                      {/* Storage */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium text-[11px]">
                          {item.storageType}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleOpenMovementModal(item)}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-[11px]"
                        >
                          Movimentar
                        </button>
                        {onOpenDonationModalWithItem && isCritical && (
                          <button
                            onClick={() => onOpenDonationModalWithItem(item.name, item.category, item.quantity)}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-500 transition-colors text-[11px]"
                            title="Encaminhar para doação de excedentes antes do prazo"
                          >
                            Doar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements Log Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900">Histórico Recente de Movimentos de Stock</h3>
        <div className="space-y-2 text-xs">
          {stockMovements.map((mov) => (
            <div key={mov.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`p-2 rounded-lg font-bold text-[10px] uppercase ${
                    mov.type === 'Entrada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : mov.type === 'Saída'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {mov.type}
                </span>
                <div>
                  <span className="font-bold text-slate-800 text-sm block">{mov.itemName}</span>
                  <span className="text-slate-500 text-[11px]">
                    Motivo: {mov.reason} | Resp: {mov.responsible} ({mov.date})
                  </span>
                </div>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {mov.type === 'Entrada' ? '+' : '-'}{mov.quantity} {mov.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Movement Modal */}
      {isMovementModalOpen && selectedStockItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registar Movimento de Stock</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border">
                <span className="font-bold text-slate-900 text-sm block">{selectedStockItem.name}</span>
                <span className="text-slate-500">Lote: {selectedStockItem.batchNumber} | Stock atual: {selectedStockItem.quantity} {selectedStockItem.unit}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimento</label>
                <select
                  value={movementType}
                  onChange={(e: any) => setMovementType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border font-medium"
                >
                  <option value="Saída">Saída para Confeção (Cozinha)</option>
                  <option value="Entrada">Entrada de Mercadoria</option>
                  <option value="Ajuste / Inventário">Ajuste de Inventário</option>
                  <option value="Quebra / Desperdício">Quebra / Desperdício Sanitário</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantidade ({selectedStockItem.unit})</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={movementType === 'Saída' ? selectedStockItem.quantity : 1000}
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo / Observações</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
                >
                  Confirmar Movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
