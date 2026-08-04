import React, { useState } from 'react';
import {
  HeartHandshake,
  Plus,
  FileText,
  Building,
  CheckCircle2,
  Printer,
  X,
  QrCode,
  ShieldCheck,
  Calendar,
  Download
} from 'lucide-react';
import { DonationLog, DonationItem, WasteCategory } from '../types';

interface DonationViewProps {
  donations: DonationLog[];
  onAddDonation: (donation: Omit<DonationLog, 'id'>) => void;
  prefillItem?: { name: string; category: WasteCategory; quantity: number } | null;
}

export const DonationView: React.FC<DonationViewProps> = ({
  donations,
  onAddDonation,
  prefillItem
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<DonationLog | null>(null);

  // Form State
  const [institutionName, setInstitutionName] = useState('Refood - Núcleo Local');
  const [nif, setNif] = useState('509123456');
  const [contactPerson, setContactPerson] = useState('Paula Guimarães');
  const [responsible, setResponsible] = useState('Maria Santos (Resp. Buffet)');
  const [notes, setNotes] = useState('Alimentos mantidos sob controlo térmico conforme normas de segurança alimentar.');

  // Items in donation form
  const [items, setItems] = useState<DonationItem[]>([
    {
      name: prefillItem ? prefillItem.name : 'Sopa de Legumes Fresca (excedente seguro)',
      category: prefillItem ? prefillItem.category : 'Refeições Confecionadas',
      quantity: prefillItem ? prefillItem.quantity : 15,
      unit: 'kg',
      estimatedValue: 35.00
    }
  ]);

  const totalKg = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalValue = items.reduce((acc, i) => acc + i.estimatedValue, 0);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { name: 'Pão fatiado não consumido', category: 'Padaria', quantity: 10, unit: 'kg', estimatedValue: 18.00 }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim() || items.length === 0) return;

    const certCode = `CERT-DOA-${Date.now().toString().slice(-6)}`;

    onAddDonation({
      institutionName: institutionName.trim(),
      nif: nif.trim(),
      contactPerson: contactPerson.trim(),
      date: new Date().toISOString().split('T')[0],
      items,
      totalKg,
      totalValue,
      responsible: responsible.trim(),
      status: 'Concluída',
      certificateCode: certCode,
      receiptNotes: notes
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Doação de Excedentes Alimentares</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Solidariedade & Economia Circular
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Redirecionamento seguro de refeições não servidas e secos para Bancos Alimentares e Instituições Sociais com emissão de comprovativos
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registar Doação de Alimentos</span>
        </button>
      </div>

      {/* Partner Institutions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Refood Portugal</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-slate-500">Recolha diária de refeições confecionadas a quente/frio.</p>
          <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t">
            Parceiro Ativo | Protocolo HACCP
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Banco Alimentar</span>
            <Building className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-slate-500">Recolha de produtos secos, enlatados e de longa duração.</p>
          <div className="text-[11px] text-sky-700 font-semibold pt-1 border-t">
            Parceiro Ativo | NIF 502987654
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Cáritas Diocesana</span>
            <Building className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-slate-500">Apoio a famílias carenciadas e cantinas sociais locais.</p>
          <div className="text-[11px] text-rose-700 font-semibold pt-1 border-t">
            Parceiro Ativo | Apoio Local
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
          <span>Histórico de Guias e Doações Efetuadas</span>
          <span className="text-xs text-slate-400 font-normal">Total doado: {donations.reduce((a, c) => a + c.totalKg, 0)} kg</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Código Guia</th>
                <th className="px-4 py-3">Instituição Beneficiária</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Alimentos Doados</th>
                <th className="px-4 py-3 text-right">Peso Total</th>
                <th className="px-4 py-3 text-right">Valor Estimado (€)</th>
                <th className="px-4 py-3 text-center">Comprovativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma doação registada até ao momento.
                  </td>
                </tr>
              ) : (
                donations.map((don) => (
                  <tr key={don.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{don.certificateCode}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block">{don.institutionName}</span>
                      <span className="text-[10px] text-slate-500">NIF: {don.nif} | Contacto: {don.contactPerson}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{don.date}</td>
                    <td className="px-4 py-3.5">
                      <ul className="list-disc list-inside text-[11px] space-y-0.5">
                        {don.items.map((it, idx) => (
                          <li key={idx}>
                            <strong>{it.name}</strong> ({it.quantity} {it.unit})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{don.totalKg} kg</td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700">{don.totalValue.toFixed(2)} €</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedCertificate(don)}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-[11px] font-semibold flex items-center gap-1 mx-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> Emitir Guia
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Donation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registar Nova Doação de Excedentes</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instituição Beneficiária *</label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIF da Entidade</label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pessoa de Contacto / Recipiente</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                />
              </div>

              {/* Items Table */}
              <div className="bg-slate-50 p-3 rounded-xl border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Alimentos a Doar:</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] text-emerald-700 font-bold hover:underline"
                  >
                    + Adicionar Outro Item
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border">
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].name = e.target.value;
                        setItems(newItems);
                      }}
                      className="col-span-6 px-2 py-1 border rounded text-xs"
                      placeholder="Nome do alimento"
                    />
                    <input
                      type="number"
                      step="1"
                      value={it.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].quantity = Number(e.target.value);
                        setItems(newItems);
                      }}
                      className="col-span-3 px-2 py-1 border rounded text-xs font-bold"
                      placeholder="Qtd (kg)"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={it.estimatedValue}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].estimatedValue = Number(e.target.value);
                        setItems(newItems);
                      }}
                      className="col-span-2 px-2 py-1 border rounded text-xs"
                      placeholder="Valor €"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="col-span-1 text-rose-500 font-bold text-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responsável pela Entrega</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow"
                >
                  Confirmar e Emitir Guia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Modal (Requirement #7) */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 space-y-6 my-8 text-slate-900 printable-area">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-emerald-800 tracking-tight">SustentaFood — Guia Oficial de Doação</h2>
                <p className="text-xs text-slate-500 font-medium">Comprovativo de Encaminhamento de Excedentes Alimentares</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm bg-slate-100 px-3 py-1 rounded border">
                  {selectedCertificate.certificateCode}
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">Data: {selectedCertificate.date}</span>
              </div>
            </div>

            {/* Entities info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Dador / Estabelecimento</span>
                <p className="font-bold text-slate-900 text-sm">SustentaFood Central</p>
                <p className="text-slate-600">NIF: 501234567 | Licença HACCP Nº 8821</p>
                <p className="text-slate-600">Responsável: {selectedCertificate.responsible}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Entidade Beneficiária</span>
                <p className="font-bold text-slate-900 text-sm">{selectedCertificate.institutionName}</p>
                <p className="text-slate-600">NIF: {selectedCertificate.nif}</p>
                <p className="text-slate-600">Recebedor: {selectedCertificate.contactPerson}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 text-sm block">Discriminação do Excedente Alimentar Doado:</span>
              <table className="w-full text-left border rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5">Categoria</th>
                    <th className="p-2.5 text-right">Quantidade</th>
                    <th className="p-2.5 text-right">Valor Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800">
                  {selectedCertificate.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium">{it.name}</td>
                      <td className="p-2.5">{it.category}</td>
                      <td className="p-2.5 text-right font-bold">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{it.estimatedValue.toFixed(2)} €</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t">
                    <td colSpan={2} className="p-2.5 text-right">Total Acumulado:</td>
                    <td className="p-2.5 text-right text-emerald-800">{selectedCertificate.totalKg} kg</td>
                    <td className="p-2.5 text-right text-emerald-800">{selectedCertificate.totalValue.toFixed(2)} €</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* HACCP Compliance Declaration */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" /> Declaração de Conformidade Sanitária & Higiene Alimentar
              </span>
              <p>
                Atesta-se que os alimentos doados foram preparados e mantidos sob rigoroso controlo de temperatura e higiene conforme as normas HACCP aplicáveis.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t text-xs text-center">
              <div>
                <div className="h-12 border-b border-slate-300 mb-1"></div>
                <span className="font-semibold text-slate-700">Assinatura do Responsável Dador</span>
              </div>
              <div>
                <div className="h-12 border-b border-slate-300 mb-1"></div>
                <span className="font-semibold text-slate-700">Assinatura / Carimbo do Beneficiário</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2 non-printable">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 border rounded-xl font-semibold text-slate-700 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
