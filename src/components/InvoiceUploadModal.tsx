import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Building2,
  X,
  Loader2,
  Boxes,
  Euro,
  Calendar,
  Tag
} from 'lucide-react';
import { Supplier, PurchaseItem, WasteCategory } from '../types';

interface InvoiceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
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
  onAddNewSupplier?: (supplier: Omit<Supplier, 'id'>) => void;
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

export const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onAddPurchaseAndStock,
  onAddNewSupplier
}) => {
  if (!isOpen) return null;

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState<boolean | null>(null);
  const [ocrMessage, setOcrMessage] = useState<string>('');

  // Form State
  const [supplierName, setSupplierName] = useState<string>('');
  const [nif, setNif] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `FT ${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productName: '',
      category: 'Legumes',
      quantity: 10,
      unit: 'kg',
      pricePerUnit: 2.5,
      totalCost: 25.0,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      batchNumber: `LOTE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      storageType: 'Refrigerado'
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Calculate total
  const totalInvoiceAmount = items.reduce(
    (acc, item) => acc + (item.totalCost || 0),
    0
  );

  // Handle Supplier Select Change
  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSupplierName(val);
    const found = suppliers.find(
      (s) => s.name.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      setNif(found.nif);
    }
  };

  // Process File with Backend OCR API
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessingOcr(true);
    setOcrSuccess(null);
    setOcrMessage('A carregar ficheiro e a preparar análise OCR...');

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        setFilePreview(base64String);

        setOcrMessage(
          'Extraindo fornecedor, produtos, validade e valores via Gemini IA...'
        );

        // Send to backend endpoint
        const response = await fetch('/api/ai/parse-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64String,
            fileName: selectedFile.name,
            mimeType: selectedFile.type || 'image/jpeg'
          })
        });

        if (!response.ok) {
          throw new Error('Falha no serviço OCR');
        }

        const data = await response.json();

        // Populate Form
        if (data.supplierName) setSupplierName(data.supplierName);
        if (data.nif) setNif(data.nif);
        if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
        if (data.date) setInvoiceDate(data.date);

        if (Array.isArray(data.items) && data.items.length > 0) {
          const formattedItems: PurchaseItem[] = data.items.map((it: any) => ({
            productName: it.productName || 'Produto Importado',
            category: (CATEGORIES.includes(it.category)
              ? it.category
              : 'Legumes') as WasteCategory,
            quantity: Number(it.quantity) || 10,
            unit: (['kg', 'L', 'un'].includes(it.unit) ? it.unit : 'kg') as
              | 'kg'
              | 'L'
              | 'un',
            pricePerUnit: Number(it.pricePerUnit) || 0,
            totalCost:
              Number(it.totalCost) ||
              (Number(it.quantity) || 1) * (Number(it.pricePerUnit) || 0),
            expiryDate:
              it.expiryDate ||
              new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
            batchNumber:
              it.batchNumber ||
              `LOTE-${new Date().getFullYear()}-${Math.floor(
                100 + Math.random() * 900
              )}`,
            storageType: it.storageType || 'Refrigerado'
          }));
          setItems(formattedItems);
        }

        setOcrSuccess(true);
        setOcrMessage('Dados da fatura e validade dos produtos extraídos com sucesso!');
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      console.error('Erro ao ler fatura:', err);
      setOcrSuccess(false);
      setOcrMessage(
        'Aviso: Leitura automática com limitações. Por favor verifique e complete os campos manualmente.'
      );
    } finally {
      setIsProcessingOcr(false);
    }
  };

  // Item Form Handlers
  const handleItemChange = (
    index: number,
    field: keyof PurchaseItem,
    value: any
  ) => {
    const newItems = [...items];
    const targetItem = { ...newItems[index], [field]: value };

    // Auto calculate total cost if qty or price per unit changes
    if (field === 'quantity' || field === 'pricePerUnit') {
      const q = field === 'quantity' ? Number(value) : targetItem.quantity;
      const p = field === 'pricePerUnit' ? Number(value) : targetItem.pricePerUnit;
      targetItem.totalCost = Number((q * p).toFixed(2));
    }

    newItems[index] = targetItem;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        productName: '',
        category: 'Legumes',
        quantity: 5,
        unit: 'kg',
        pricePerUnit: 2.0,
        totalCost: 10.0,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        batchNumber: `LOTE-${new Date().getFullYear()}-${Math.floor(
          100 + Math.random() * 900
        )}`,
        storageType: 'Refrigerado'
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      alert('Por favor indique o nome do fornecedor.');
      return;
    }

    const validItems = items.filter((it) => it.productName.trim().length > 0);
    if (validItems.length === 0) {
      alert('Por favor inclua pelo menos um produto com nome válido.');
      return;
    }

    // Call callback to insert into purchase logs & stock items
    onAddPurchaseAndStock({
      supplierName: supplierName.trim(),
      nif: nif.trim(),
      invoiceNumber: invoiceNumber.trim() || `FT ${Date.now()}`,
      date: invoiceDate,
      totalAmount: totalInvoiceAmount,
      fileName: file?.name,
      items: validItems
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Entrada de Compras & OCR de Fatura
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Liga diretamente ao FEFO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tire foto ou carregue o PDF/Imagem para preenchimento automático
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Uploader Section */}
          <div className="bg-slate-950/60 border border-dashed border-slate-700 rounded-xl p-5 text-center transition-colors hover:border-emerald-500/60">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {isProcessingOcr ? (
              <div className="py-6 flex flex-col items-center justify-center gap-3 text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-sm font-medium text-slate-200">{ocrMessage}</p>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini 3.6 OCR Multimodal em progresso</span>
                </div>
              </div>
            ) : file ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
                <div className="flex items-center gap-3 text-left">
                  {file.type.startsWith('image/') && filePreview ? (
                    <img
                      src={filePreview}
                      alt="Fatura"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-indigo-950 border border-indigo-800 rounded-lg flex items-center justify-center text-indigo-300">
                      <FileText className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || 'Documento'}
                    </p>
                    {ocrSuccess === true && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OCR Reconhecido com sucesso
                      </span>
                    )}
                    {ocrSuccess === false && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium mt-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Verifique os dados abaixo
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" /> Nova Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" /> Trocar Ficheiro
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <div className="flex justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Carregue a Fatura ou Tire uma Foto com o Telemóvel
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aceita imagens (JPG, PNG) e PDF. O OCR extrai o fornecedor, validade e produtos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-2 transition-transform hover:scale-105"
                  >
                    <Camera className="w-4 h-4" />
                    Tirar Foto (Telemóvel)
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    Upload PDF / Imagem
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Supplier & Invoice Header Info */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Fornecedor
              </label>
              <div className="space-y-1.5">
                <select
                  value={supplierName}
                  onChange={handleSupplierSelect}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Selecionar ou Digitar Fornecedor --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>
                      {sup.name} ({sup.category})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Ou insira novo nome de fornecedor"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                NIF Fornecedor
              </label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                placeholder="Ex: 501234567"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> N.º Fatura / Nota
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ex: FT 2026/1234"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Data da Fatura
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Purchased Items & FEFO Expiration Data */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                Produtos Adquiridos & Validades para FEFO
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Produto
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end"
                >
                  {/* Name */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Produto
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Peito de Frango"
                      value={item.productName}
                      onChange={(e) =>
                        handleItemChange(idx, 'productName', e.target.value)
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Categoria
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) =>
                        handleItemChange(idx, 'category', e.target.value)
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Unit */}
                  <div className="md:col-span-2 flex gap-1">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Qtd.
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', e.target.value)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="w-16">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Un.
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(idx, 'unit', e.target.value)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-1 py-1.5 text-xs text-white"
                      >
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Preço/Un. (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.pricePerUnit}
                      onChange={(e) =>
                        handleItemChange(idx, 'pricePerUnit', e.target.value)
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Expiration Date (Validade) */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-amber-400 mb-1">
                      Validade (FEFO)
                    </label>
                    <input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) =>
                        handleItemChange(idx, 'expiryDate', e.target.value)
                      }
                      className="w-full bg-slate-800 border border-amber-500/40 rounded-lg px-2 py-1.5 text-xs text-amber-200 focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length <= 1}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg disabled:opacity-30"
                      title="Remover linha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Summary & Submit */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-xs text-slate-400">Total da Compra / Fatura:</span>
              <div className="text-xl font-bold text-emerald-400 flex items-center gap-1">
                <Euro className="w-5 h-5" />
                {totalInvoiceAmount.toFixed(2)} €
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submeter & Inserir em Stock FEFO
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
