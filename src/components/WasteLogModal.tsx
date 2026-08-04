import React, { useState } from 'react';
import { X, Plus, Calculator, Info, Sparkles } from 'lucide-react';
import { WasteLog, WasteCategory, WasteType, ProductionLocation } from '../types';
import { CO2_FACTORS } from '../mockData';

interface WasteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWasteLog: (log: Omit<WasteLog, 'id'>) => void;
}

const CATEGORIES: WasteCategory[] = [
  'Carne',
  'Peixe',
  'Frutas',
  'Legumes',
  'Lacticínios',
  'Padaria',
  'Refeições Confecionadas',
  'Outros'
];

const WASTE_TYPES: WasteType[] = [
  'Sobras de refeições',
  'Produtos fora de prazo',
  'Restos de preparação',
  'Alimentos devolvidos',
  'Avaria / Falha de frio',
  'Outro'
];

const LOCATIONS: ProductionLocation[] = [
  'Cozinha Central',
  'Empratamento / Buffet',
  'Armazém / Câmara Fria',
  'Sala de Refeições',
  'Bar / Cafetaria',
  'Pastelaria'
];

export const WasteLogModal: React.FC<WasteLogModalProps> = ({
  isOpen,
  onClose,
  onAddWasteLog
}) => {
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5);

  const [item, setItem] = useState('');
  const [category, setCategory] = useState<WasteCategory>('Refeições Confecionadas');
  const [type, setType] = useState<WasteType>('Sobras de refeições');
  const [quantity, setQuantity] = useState<number>(5);
  const [unit, setUnit] = useState<'kg' | 'L'>('kg');
  const [costPerUnit, setCostPerUnit] = useState<number>(4.50);
  const [location, setLocation] = useState<ProductionLocation>('Empratamento / Buffet');
  const [responsible, setResponsible] = useState('João Silva (Chef)');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  if (!isOpen) return null;

  // Real-time calculations
  const totalCost = Number((quantity * costPerUnit).toFixed(2));
  const co2eFactor = CO2_FACTORS[category] || 2.0;
  const co2eKg = Number((quantity * co2eFactor).toFixed(2));

  // Quick preset helper
  const handleApplyPreset = (
    presetName: string,
    presetCat: WasteCategory,
    presetType: WasteType,
    presetCost: number,
    presetLoc: ProductionLocation
  ) => {
    setItem(presetName);
    setCategory(presetCat);
    setType(presetType);
    setCostPerUnit(presetCost);
    setLocation(presetLoc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim() || quantity <= 0) return;

    onAddWasteLog({
      item: item.trim(),
      category,
      type,
      quantity,
      unit,
      costPerUnit,
      totalCost,
      date,
      time,
      location,
      responsible: responsible.trim() || 'Operador de Serviço',
      notes: notes.trim(),
      co2eKg
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/40 text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registo de Resíduo Alimentar</h2>
              <p className="text-xs text-slate-400">Introduza os dados para registo, controlo financeiro e pegada de CO₂</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs">
          <span className="font-semibold text-slate-600 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets Rápidos de Frequência:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('Sobras de Sopa do Almoço', 'Refeições Confecionadas', 'Sobras de refeições', 2.10, 'Empratamento / Buffet')}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              🍲 Sobras de Sopa
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Pão de Fatiar do Almoço', 'Padaria', 'Sobras de refeições', 2.00, 'Bar / Cafetaria')}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              🥖 Pão Fatiado
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Aparas de Peixe / Salmão', 'Peixe', 'Restos de preparação', 12.50, 'Cozinha Central')}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              🐟 Aparas de Peixe
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Cascas de Legumes e Batatas', 'Legumes', 'Restos de preparação', 1.20, 'Cozinha Central')}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
            >
              🥕 Cascas de Legumes
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Item Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nome do Alimento / Produto Desperdiçado *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Sobras de Arroz de Pato, Lombo de Robalo, Pão Fatiado..."
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Categoria de Alimento *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WasteCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Waste Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipo / Origem do Desperdício *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WasteType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              >
                {WASTE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantities & Unit Costs */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantidade *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unidade</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'kg' | 'L')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="kg">Quilogramas (kg)</option>
                <option value="L">Litros (L)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custo Médio (€/{unit})</label>
              <input
                type="number"
                step="0.05"
                min="0"
                required
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Impacto Calculado Automaticamente:</span>
            </div>
            <div className="flex items-center gap-4 font-bold text-sm">
              <span>Custo Total: <strong className="text-rose-600">{totalCost.toFixed(2)} €</strong></span>
              <span>Emissão: <strong className="text-emerald-700">{co2eKg} kg CO₂e</strong></span>
            </div>
          </div>

          {/* Location & Responsible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Local de Produção *</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as ProductionLocation)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Responsável pelo Registo *</label>
              <input
                type="text"
                required
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hora *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observações / Motivo do Desperdício</label>
            <textarea
              rows={2}
              placeholder="Descreva a razão específica (ex: sobreprodução no serviço de almoço, erro de confeção, prazo ultrapassado...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Gravar Registo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
