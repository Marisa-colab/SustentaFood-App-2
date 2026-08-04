import React, { useState } from 'react';
import {
  Truck,
  PlusCircle,
  Building2,
  FileText,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Camera,
  Upload,
  Sparkles,
  Euro,
  Calendar,
  Filter,
  User,
  ExternalLink,
  ShieldCheck,
  Tag,
  Boxes
} from 'lucide-react';
import { Supplier, InvoicePurchase, WasteCategory, PurchaseItem } from '../types';
import { InvoiceUploadModal } from './InvoiceUploadModal';

interface SuppliersInvoicesViewProps {
  suppliers: Supplier[];
  invoices: InvoicePurchase[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onAddPurchaseAndStock: (
    purchaseData: {
      supplierName: string;
      nif: string;
      invoiceNumber: string;
      date: string;
      totalAmount: number;
      fileName?: string;
      items: PurchaseItem[];
    }
  ) => void;
}

export const SuppliersInvoicesView: React.FC<SuppliersInvoicesViewProps> = ({
  suppliers,
  invoices,
  onAddSupplier,
  onAddPurchaseAndStock
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'suppliers' | 'invoices'>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);

  // New Supplier Form State
  const [newSupName, setNewSupName] = useState('');
  const [newSupNif, setNewSupNif] = useState('');
  const [newSupCategory, setNewSupCategory] = useState<WasteCategory>('Carne');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter((sup) => {
    const matchesSearch =
      sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.nif.includes(searchQuery) ||
      sup.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || sup.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items.some((it) => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Submit New Supplier
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    onAddSupplier({
      name: newSupName.trim(),
      nif: newSupNif.trim() || '500000000',
      category: newSupCategory,
      contactPerson: newSupContact.trim() || 'Não especificado',
      phone: newSupPhone.trim() || '+351 900 000 000',
      email: newSupEmail.trim() || 'fornecedor@email.pt',
      address: newSupAddress.trim() || 'Portugal',
      status: 'Ativo',
      rating: 5.0
    });

    setNewSupName('');
    setNewSupNif('');
    setNewSupContact('');
    setNewSupPhone('');
    setNewSupEmail('');
    setNewSupAddress('');
    setIsNewSupplierModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Gestão de Fornecedores, Compras & Faturas (OCR)
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Registe fornecedores e faturas com extração automática via OCR (PDF e Fotos).
              As compras registadas criam lotes e validades automaticamente na <strong>Gestão de Stocks & Rotação FEFO</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewSupplierModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Novo Fornecedor
            </button>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30 hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              Tirar Foto / Carregar Fatura (OCR)
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'suppliers'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Fornecedores Cadastrados ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'invoices'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Histórico de Compras & Faturas ({invoices.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'suppliers'
                ? 'Pesquisar fornecedor, NIF ou contacto...'
                : 'Pesquisar por fornecedor, n.º de fatura ou produto...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {activeSubTab === 'suppliers' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Carne">Carne</option>
              <option value="Peixe">Peixe</option>
              <option value="Frutas">Frutas</option>
              <option value="Legumes">Legumes</option>
              <option value="Lacticínios">Lacticínios</option>
              <option value="Padaria">Padaria</option>
              <option value="Água">Água</option>
              <option value="Água">Água</option>
              <option value="Sumos">Sumos</option>
              <option value="Bebidas Brancas">Bebidas Brancas</option>
              <option value="Cerveja">Cerveja</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        )}
      </div>

      {/* SUB TAB 1: SUPPLIERS GRID */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {sup.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{sup.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">NIF: {sup.nif}</p>
                  </div>

                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {sup.status}
                  </span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contacto: <strong>{sup.contactPerson}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  {sup.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Classificação: <strong className="text-amber-400">★ {sup.rating || 4.8}</strong>
                </span>
                <button
                  onClick={() => {
                    setSearchQuery(sup.name);
                    setActiveSubTab('invoices');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                >
                  Ver Faturas <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {filteredSuppliers.length === 0 && (
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-semibold">Nenhum fornecedor encontrado.</p>
              <button
                onClick={() => setIsNewSupplierModalOpen(true)}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Registar Novo Fornecedor
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: INVOICES & PURCHASES HISTORY */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{inv.supplierName}</h3>
                      {inv.ocrExtracted && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" /> OCR Gemini
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {inv.invoiceNumber} • NIF: {inv.nif || 'N/A'} • Processado por {inv.responsible}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xs text-slate-400 block">Total Fatura:</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {inv.totalAmount.toFixed(2)} €
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    {inv.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                  Produtos Integrados no Stock FEFO:
                </h4>
                <div className="divide-y divide-slate-800/60">
                  {inv.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="py-2 flex flex-wrap items-center justify-between text-xs gap-2"
                    >
                      <div>
                        <span className="font-semibold text-white">{it.productName}</span>
                        <span className="text-slate-400 ml-2 font-mono text-[11px]">
                          ({it.category}) • {it.batchNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-300">
                        <span>
                          Qtd: <strong>{it.quantity} {it.unit}</strong> @ {it.pricePerUnit.toFixed(2)} €/{it.unit}
                        </span>
                        <span className="text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50 text-[11px] font-semibold">
                          Validade FEFO: {it.expiryDate}
                        </span>
                        <span className="font-bold text-emerald-400">
                          {it.totalCost.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredInvoices.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-semibold">Nenhuma fatura ou compra registada.</p>
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Carregar Fatura / Tirar Foto
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NEW SUPPLIER */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Cadastrar Novo Fornecedor
              </h3>
              <button
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Fornecedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frutas do Caster"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">NIF</label>
                  <input
                    type="text"
                    placeholder="Ex: 509876543"
                    value={newSupNif}
                    onChange={(e) => setNewSupNif(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria Principal
                  </label>
                  <select
                    value={newSupCategory}
                    onChange={(e) => setNewSupCategory(e.target.value as WasteCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Carne">Carne</option>
                    <option value="Peixe">Peixe</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Legumes">Legumes</option>
                    <option value="Lacticínios">Lacticínios</option>
                    <option value="Padaria">Padaria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pessoa de Contacto
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Mendes"
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="+351 912 345 678"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contacto@fornecedor.pt"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Morada</label>
                <input
                  type="text"
                  placeholder="Ex: Zona Industrial, Lote 4"
                  value={newSupAddress}
                  onChange={(e) => setNewSupAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  Guardar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE UPLOAD & PURCHASE OCR MODAL */}
      <InvoiceUploadModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        suppliers={suppliers}
        onAddPurchaseAndStock={onAddPurchaseAndStock}
        onAddNewSupplier={onAddSupplier}
      />
    </div>
  );
};
