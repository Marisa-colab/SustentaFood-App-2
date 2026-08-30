import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { WasteLogView } from './components/WasteLogView';
import { WasteLogModal } from './components/WasteLogModal';
import { EconomicAnalysisView } from './components/EconomicAnalysisView';
import { StockFefoView } from './components/StockFefoView';
import { SuppliersInvoicesView } from './components/SuppliersInvoicesView';
import { InvoiceUploadModal } from './components/InvoiceUploadModal';
import { DonationView } from './components/DonationView';
import { ValorizationView } from './components/ValorizationView';
import { HaccpView } from './components/HaccpView';
import { AIPredictionsView } from './components/AIPredictionsView';
import { ReportsView } from './components/ReportsView';
import { AlertsView } from './components/AlertsView';

import {
  WasteLog,
  StockItem,
  StockMovement,
  DonationLog,
  ValorizationLog,
  HaccpLog,
  TemperatureLog,
  CleaningLog,
  AlertItem,
  SummaryMetrics,
  WasteCategory,
  Supplier,
  InvoicePurchase,
  PurchaseItem
} from './types';

import {
  initialWasteLogs,
  initialStockItems,
  initialStockMovements,
  initialDonations,
  initialValorizationLogs,
  initialHaccpLogs,
  initialTemperatureLogs,
  initialCleaningLogs,
  initialAlerts,
  initialSuppliers,
  initialInvoices
} from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // --- ESTADOS DE AUTENTICAÇÃO E LICENCIAMENTO ---
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [licencaValida, setLicencaValida] = useState<boolean | null>(null);
  const [organizacao, setOrganizacao] = useState<any>(null);

  // --- CORE APPLICATION DATA STATE ---
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<InvoicePurchase[]>([]);
  const [donations, setDonations] = useState<DonationLog[]>([]);
  const [valorizationLogs, setValorizationLogs] = useState<ValorizationLog[]>([]);
  const [haccpLogs, setHaccpLogs] = useState<HaccpLog[]>([]);
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const [highlightPrediction, setHighlightPrediction] = useState<string>('');

  // Modals & Prefills
  const [isNewWasteModalOpen, setIsNewWasteModalOpen] = useState(false);
  const [isGlobalInvoiceModalOpen, setIsGlobalInvoiceModalOpen] = useState(false);
  const [prefillDonationItem, setPrefillDonationItem] = useState<{ name: string; category: WasteCategory; quantity: number } | null>(null);

 useEffect(() => {
  // 1. Obter a sessão atual do Supabase
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);

    if (session) {
      validarLicencaEOrg(session.user.id);
    } else {
      setLicencaValida(null);
      setOrganizacao(null);
      setWasteLogs([]);
      setTemperatureLogs([]);
      setCleaningLogs([]);
      setHaccpLogs([]);
      setLoading(false);
    }
  });

  // 2. Escutar alterações de autenticação
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);

    if (session) {
      validarLicencaEOrg(session.user.id);
    } else {
      setLicencaValida(null);
      setOrganizacao(null);
      setWasteLogs([]);
      setTemperatureLogs([]);
      setCleaningLogs([]);
      setHaccpLogs([]);
      setLoading(false);
    }
  });

  // 3. Cancelar a subscrição quando o componente for fechado
  return () => {
    subscription.unsubscribe();
  };
}, []);
  
async function validarLicencaEOrg(userId: string) {
  setLoading(true);

  try {
    // 1. Carregar o perfil e a organização
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        organizacao_id,
        organizacoes (
          id,
          nome,
          status_licenca,
          inicio_licenca,
          valida_ate
        )
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    // 2. Verificar se é a superadministradora
    const {
      data: isSuperAdmin,
      error: adminError,
    } = await supabase.rpc('is_super_admin');

    if (adminError) {
      throw adminError;
    }

    const org: any = Array.isArray(profile?.organizacoes)
      ? profile.organizacoes[0]
      : profile?.organizacoes;

    // 3. Validar as datas da licença
    const agora = Date.now();

    const inicio = org?.inicio_licenca
      ? new Date(org.inicio_licenca).getTime()
      : NaN;

    const fim = org?.valida_ate
      ? new Date(org.valida_ate).getTime()
      : NaN;

    const licencaAtiva =
      org?.status_licenca === 'activa' &&
      Number.isFinite(inicio) &&
      Number.isFinite(fim) &&
      agora >= inicio &&
      agora < fim;

    const acessoPermitido =
      Boolean(isSuperAdmin) || licencaAtiva;

    setLicencaValida(acessoPermitido);

    setOrganizacao(
      org
        ? {
            id: org.id,
            nome: org.nome ?? 'Organização sem nome',
          }
        : isSuperAdmin
          ? {
              id: null,
              nome: 'Administração SustentaFood',
            }
          : null
    );

    // 4. Não carregar dados se a licença estiver bloqueada
    if (!acessoPermitido) {
      setWasteLogs([]);
      setTemperatureLogs([]);
      setCleaningLogs([]);
      setHaccpLogs([]);
      return;
    }

    // 5. Carregar desperdícios reais do Supabase
 const {
  data: wasteData,
  error: wasteError,
} = await supabase
  .from('waste_logs')
  .select('id, created_at, nome_produto, quantidade, unidade_medida, motivo, custo_estimado, registado_por, organizacao_id, categoria, local_producao, responsavel, observacoes, custo_unitario, co2e_kg')
  .order('created_at', { ascending: false });

if (wasteError) {
  console.error('Erro ao carregar desperdícios:', {
    code: wasteError.code,
    message: wasteError.message,
    details: wasteError.details,
    hint: wasteError.hint,
  });

  throw wasteError;
}

const wasteLogsConvertidos: WasteLog[] = (wasteData ?? []).map(
  (registo) => {
    const criadoEm = new Date(registo.created_at);

    return {
      id: registo.id,
      item: registo.nome_produto ?? '',
      category: (registo.categoria ?? 'Outros') as WasteLog['category'],
      type: (registo.motivo ?? 'Outro') as WasteLog['type'],
      quantity: Number(registo.quantidade ?? 0),
      unit: (registo.unidade_medida ?? 'kg') as WasteLog['unit'],
      costPerUnit: Number(registo.custo_unitario ?? 0),
      totalCost: Number(registo.custo_estimado ?? 0),
      date: criadoEm.toLocaleDateString('en-CA'),
      time: criadoEm.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      location: (registo.local_producao ?? '') as WasteLog['location'],
      responsible: registo.responsavel ?? '',
      notes: registo.observacoes ?? '',
      co2eKg: Number(registo.co2e_kg ?? 0),
    };
  }
);

setWasteLogs(wasteLogsConvertidos);

    // 6. Carregar registos HACCP reais do Supabase (temperaturas, higienização, não conformidades)
    const [
      { data: tempData, error: tempError },
      { data: cleanData, error: cleanError },
      { data: haccpData, error: haccpError },
    ] = await Promise.all([
      supabase
        .from('temperature_logs')
        .select('id, equipamento, localizacao, intervalo_alvo, temperatura_medida, data, hora, turno, estado, acao_corretiva, responsavel')
        .order('data', { ascending: false }),
      supabase
        .from('cleaning_logs')
        .select('id, area_equipamento, frequencia, detergente, data, estado, responsavel')
        .order('data', { ascending: false }),
      supabase
        .from('haccp_logs')
        .select('id, data, hora, produto, lote, fornecedor, quantidade_kg, motivo_rejeicao, temperatura_registada, codigo_nc, acao_corretiva, estado, responsavel')
        .order('data', { ascending: false }),
    ]);

    if (tempError) console.error('Erro ao carregar temperaturas:', tempError);
    if (cleanError) console.error('Erro ao carregar higienizações:', cleanError);
    if (haccpError) console.error('Erro ao carregar não conformidades HACCP:', haccpError);

    setTemperatureLogs(
      (tempData ?? []).map((registo) => ({
        id: registo.id,
        equipmentName: registo.equipamento ?? '',
        location: registo.localizacao ?? '',
        targetTempRange: registo.intervalo_alvo ?? '',
        measuredTemp: Number(registo.temperatura_medida ?? 0),
        date: registo.data ?? '',
        time: (registo.hora ?? '').toString().slice(0, 5),
        shift: (registo.turno ?? 'Manhã') as TemperatureLog['shift'],
        status: (registo.estado ?? 'Conforme') as TemperatureLog['status'],
        correctiveAction: registo.acao_corretiva ?? undefined,
        responsible: registo.responsavel ?? '',
      }))
    );

    setCleaningLogs(
      (cleanData ?? []).map((registo) => ({
        id: registo.id,
        areaOrEquipment: registo.area_equipamento ?? '',
        frequency: (registo.frequencia ?? 'Diária') as CleaningLog['frequency'],
        detergentUsed: registo.detergente ?? '',
        date: registo.data ?? '',
        status: (registo.estado ?? 'Inspecionado') as CleaningLog['status'],
        responsible: registo.responsavel ?? '',
      }))
    );

    setHaccpLogs(
      (haccpData ?? []).map((registo) => ({
        id: registo.id,
        date: registo.data ?? '',
        time: (registo.hora ?? '').toString().slice(0, 5),
        productName: registo.produto ?? '',
        batchNumber: registo.lote ?? '',
        supplier: registo.fornecedor ?? '',
        quantityKg: Number(registo.quantidade_kg ?? 0),
        rejectionReason: (registo.motivo_rejeicao ?? 'Outro') as HaccpLog['rejectionReason'],
        temperatureLogged:
          registo.temperatura_registada !== null && registo.temperatura_registada !== undefined
            ? Number(registo.temperatura_registada)
            : undefined,
        nonConformityCode: registo.codigo_nc ?? '',
        correctiveAction: registo.acao_corretiva ?? '',
        status: (registo.estado ?? 'Aberto') as HaccpLog['status'],
        responsible: registo.responsavel ?? '',
      }))
    );

  } catch (error) {
    console.error('Erro em validarLicencaEOrg:', error);
    setLicencaValida(false);
    setOrganizacao(null);
    setWasteLogs([]);
    setTemperatureLogs([]);
    setCleaningLogs([]);
    setHaccpLogs([]);
  } finally {
    setLoading(false);
  }
}
  
  // --- HANDLERS (definidos ao nível do componente) ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao terminar sessão:', error);
    }
  };
  
  const handleAddStockMovement = (movData: Omit<StockMovement, 'id'>) => {
    const newId = `MOV-${500 + stockMovements.length + 1}`;
    const newMov: StockMovement = { id: newId, ...movData };
    setStockMovements([newMov, ...stockMovements]);

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id === movData.stockItemId) {
          const qtyChange = movData.type === 'Entrada' ? movData.quantity : -movData.quantity;
          const newQty = Math.max(0, item.quantity + qtyChange);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleAddSupplier = (newSupData: Omit<Supplier, 'id'>) => {
    const newId = `SUP-${(suppliers.length + 1).toString().padStart(2, '0')}`;
    const newSup: Supplier = { id: newId, ...newSupData };
    setSuppliers([newSup, ...suppliers]);
  };

  const handleAddPurchaseAndStock = (purchaseData: {
    supplierName: string;
    nif: string;
    invoiceNumber: string;
    date: string;
    totalAmount: number;
    fileName?: string;
    items: PurchaseItem[];
  }) => {
    const newInvoiceId = `INV-2026-${(invoices.length + 1).toString().padStart(3, '0')}`;
    const newInvoice: InvoicePurchase = {
      id: newInvoiceId,
      supplierName: purchaseData.supplierName,
      nif: purchaseData.nif,
      invoiceNumber: purchaseData.invoiceNumber,
      date: purchaseData.date,
      totalAmount: purchaseData.totalAmount,
      fileName: purchaseData.fileName,
      ocrExtracted: true,
      status: 'Processada',
      responsible: 'João Silva (Comprador)',
      items: purchaseData.items
    };
    setInvoices([newInvoice, ...invoices]);

    const existingSup = suppliers.find(
      (s) => s.name.toLowerCase() === purchaseData.supplierName.toLowerCase()
    );
    if (!existingSup) {
      const newSupId = `SUP-${(suppliers.length + 1).toString().padStart(2, '0')}`;
      const firstCat = purchaseData.items[0]?.category || 'Legumes';
      setSuppliers([
        {
          id: newSupId,
          name: purchaseData.supplierName,
          nif: purchaseData.nif || '500000000',
          category: firstCat,
          contactPerson: 'Gestor Comercial',
          phone: '+351 910 000 000',
          email: 'geral@fornecedor.pt',
          status: 'Ativo',
          rating: 5.0
        },
        ...suppliers
      ]);
    }

    const newStockEntries: StockItem[] = [];
    const newMovements: StockMovement[] = [];

    purchaseData.items.forEach((item, index) => {
      const stockId = `STK-IN-${Date.now()}-${index}`;
      const code = `${item.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      const newStockItem: StockItem = {
        id: stockId,
        code,
        name: item.productName,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        batchNumber: item.batchNumber || `LOTE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: item.expiryDate,
        costPerUnit: item.pricePerUnit,
        storageType: item.storageType || 'Refrigerado',
        minStockThreshold: 10,
        fefoPriority: 'Normal',
        supplier: purchaseData.supplierName
      };

      newStockEntries.push(newStockItem);

      newMovements.push({
        id: `MOV-IN-${Date.now()}-${index}`,
        stockItemId: stockId,
        itemName: item.productName,
        type: 'Entrada',
        quantity: item.quantity,
        unit: item.unit,
        date: `${purchaseData.date} 09:00`,
        responsible: 'João Silva (Entrada Fatura OCR)',
        reason: `Compra via ${purchaseData.invoiceNumber} (${purchaseData.supplierName})`
      });
    });

    setStockItems((prev) => [...newStockEntries, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);
  };

  const handleAddDonation = (newDonData: Omit<DonationLog, 'id'>) => {
    const newId = `DON-2026-${(donations.length + 1).toString().padStart(2, '0')}`;
    const newDonation: DonationLog = { id: newId, ...newDonData };
    setDonations([newDonation, ...donations]);
  };

  const handleOpenDonationFromStock = (name: string, category: WasteCategory, quantity: number) => {
    setPrefillDonationItem({ name, category, quantity });
    setActiveTab('donations');
  };

  const handleAddValorizationLog = (valData: Omit<ValorizationLog, 'id'>) => {
    const newId = `VAL-${(valorizationLogs.length + 1).toString().padStart(2, '0')}`;
    const newVal: ValorizationLog = { id: newId, ...valData };
    setValorizationLogs([newVal, ...valorizationLogs]);
  };

  const handleAddHaccpLog = async (haccpData: Omit<HaccpLog, 'id'>) => {
    const { data, error } = await supabase
      .from('haccp_logs')
      .insert({
        data: haccpData.date,
        hora: haccpData.time,
        produto: haccpData.productName,
        lote: haccpData.batchNumber,
        fornecedor: haccpData.supplier,
        quantidade_kg: haccpData.quantityKg,
        motivo_rejeicao: haccpData.rejectionReason,
        temperatura_registada: haccpData.temperatureLogged ?? null,
        codigo_nc: haccpData.nonConformityCode,
        acao_corretiva: haccpData.correctiveAction,
        estado: haccpData.status,
        responsavel: haccpData.responsible,
        organizacao_id: organizacao?.id ?? null,
        registado_por: session?.user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao gravar não conformidade HACCP:', error);
      alert('Não foi possível gravar o registo HACCP. Tenta novamente.');
      return;
    }

    const newHaccp: HaccpLog = { id: data.id, ...haccpData };
    setHaccpLogs([newHaccp, ...haccpLogs]);
  };

  const handleAddTemperatureLog = async (tempData: Omit<TemperatureLog, 'id'>) => {
    const { data, error } = await supabase
      .from('temperature_logs')
      .insert({
        equipamento: tempData.equipmentName,
        localizacao: tempData.location,
        intervalo_alvo: tempData.targetTempRange,
        temperatura_medida: tempData.measuredTemp,
        data: tempData.date,
        hora: tempData.time,
        turno: tempData.shift,
        estado: tempData.status,
        acao_corretiva: tempData.correctiveAction ?? null,
        responsavel: tempData.responsible,
        organizacao_id: organizacao?.id ?? null,
        registado_por: session?.user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao gravar medição de temperatura:', error);
      alert('Não foi possível gravar a medição. Tenta novamente.');
      return;
    }

    const newTemp: TemperatureLog = { id: data.id, ...tempData };
    setTemperatureLogs([newTemp, ...temperatureLogs]);
  };

  const handleAddCleaningLog = async (cleanData: Omit<CleaningLog, 'id'>) => {
    const { data, error } = await supabase
      .from('cleaning_logs')
      .insert({
        area_equipamento: cleanData.areaOrEquipment,
        frequencia: cleanData.frequency,
        detergente: cleanData.detergentUsed,
        data: cleanData.date,
        estado: cleanData.status,
        responsavel: cleanData.responsible,
        organizacao_id: organizacao?.id ?? null,
        registado_por: session?.user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao gravar higienização:', error);
      alert('Não foi possível gravar o registo de higienização. Tenta novamente.');
      return;
    }

    const newClean: CleaningLog = { id: data.id, ...cleanData };
    setCleaningLogs([newClean, ...cleaningLogs]);
  };

  const handleMarkAlertAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleClearAllAlerts = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const unreadAlertCount = alerts.filter((a) => !a.read).length;

    // Cálculo dos indicadores
const hoje = new Date().toLocaleDateString('en-CA');
const mesAtual = hoje.slice(0, 7);

const registosDeHoje = wasteLogs.filter(
  (registo) => registo.date === hoje
);

const registosDoMes = wasteLogs.filter(
  (registo) => registo.date?.startsWith(mesAtual)
);

const totalWasteKgToday = registosDeHoje.reduce(
  (total, registo) =>
    total + Number(registo.quantity ?? 0),
  0
);

const totalWasteKgMonth = registosDoMes.reduce(
  (total, registo) =>
    total + Number(registo.quantity ?? 0),
  0
);

const totalCostLostMonth = registosDoMes.reduce(
  (total, registo) =>
    total + Number(registo.totalCost ?? 0),
  0
);

const totalCo2eKgMonth = registosDoMes.reduce(
  (total, registo) =>
    total + Number(registo.co2eKg ?? 0),
  0
);

// Enquanto não existir uma tabela/campo para refeições servidas,
// o valor começa em zero.
const mealsServedMonth = 0;

const kgPerMeal =
  mealsServedMonth > 0
    ? totalWasteKgMonth / mealsServedMonth
    : 0;

const diasDoMesDecorridos = new Date().getDate();

const kgPerDayAvg =
  diasDoMesDecorridos > 0
    ? totalWasteKgMonth / diasDoMesDecorridos
    : 0;

const summaryMetrics: SummaryMetrics = {
  totalWasteKgToday,
  totalWasteKgMonth,
  totalCostLostMonth,
  totalCo2eKgMonth,
  potentialSavingsMonth: totalCostLostMonth * 0.5,
  mealsServedMonth,
  kgPerMeal,
  kgPerDayAvg,
  reductionGoalPercent: 25,
  currentReductionPercent: 0,
};
    
  // Handlers que estavam em falta no ficheiro original
  const handleDeleteWasteLog = async (id: string) => {
    const previous = wasteLogs;
    setWasteLogs((prev) => prev.filter((w) => w.id !== id));

    const { error } = await supabase.from('waste_logs').delete().eq('id', id);

    if (error) {
      console.error('Erro ao apagar desperdício:', error);
      setWasteLogs(previous);
      alert('Não foi possível apagar o registo. Tenta novamente.');
    }
  };

  const handleAddWasteLog = async (newLog: Omit<WasteLog, 'id'>) => {
    const createdDate = new Date();
    const quantidade = Number(newLog.quantity ?? 0);
    const custoEstimado = Number(
      newLog.totalCost ?? (quantidade * Number(newLog.costPerUnit ?? 0))
    );

    const { data, error } = await supabase
      .from('waste_logs')
      .insert({
        nome_produto: newLog.item || '',
        quantidade,
        unidade_medida: newLog.unit || 'kg',
        motivo: newLog.type || 'Outro',
        custo_estimado: custoEstimado,
        categoria: newLog.category || 'Outros',
        local_producao: newLog.location || null,
        responsavel: newLog.responsible || null,
        observacoes: newLog.notes || null,
        custo_unitario: Number(newLog.costPerUnit ?? 0),
        co2e_kg: Number(newLog.co2eKg ?? 0),
        organizacao_id: organizacao?.id ?? null,
        registado_por: session?.user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao gravar desperdício:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      alert('Não foi possível gravar o registo. Tenta novamente.');
      return;
    }

    const completeLog: WasteLog = {
      id: data.id,
      item: newLog.item || '',
      category: newLog.category || 'Outros',
      type: newLog.type || ('Outro' as WasteLog['type']),
      quantity: quantidade,
      unit: newLog.unit || 'kg',
      costPerUnit: Number(newLog.costPerUnit ?? 0),
      totalCost: custoEstimado,
      date: newLog.date || createdDate.toLocaleDateString('en-CA'),
      time: newLog.time || createdDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      location: newLog.location || '',
      responsible: newLog.responsible || '',
      notes: newLog.notes || '',
      co2eKg: Number(newLog.co2eKg ?? 0),
    };

    setWasteLogs((prev) => [completeLog, ...prev]);
    setIsNewWasteModalOpen(false);
  };

  // --- RENDERING CONDICIONAL DE AUTENTICAÇÃO E LICENÇA ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans">
        A carregar sistema...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (licencaValida === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4 font-sans">
        <div className="max-w-md bg-slate-800 p-8 rounded-xl border border-red-500/50 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Licença Inativa ou Expirada</h2>
          <p className="text-slate-300 text-sm mb-6">
            A licença de utilização desta organização encontra-se inativa ou expirada.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            Sair / Mudar de Conta
          </button>
        </div>
      </div>
    );
  }

  // --- APLICAÇÃO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Botão de Terminar Sessão / Info Org no Topo */}
      <div className="bg-slate-950 px-6 py-2 flex justify-between items-center text-xs text-slate-400 border-b border-slate-800">
        <span>Organização: <strong className="text-white">{organizacao?.nome}</strong></span>
        <button onClick={handleLogout} className="hover:text-white underline transition-colors">
          Terminar Sessão
        </button>
      </div>

      {/* App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadAlertCount={unreadAlertCount}
        onOpenNewWasteModal={() => setIsNewWasteModalOpen(true)}
      />

      {/* View Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            wasteLogs={wasteLogs}
            metrics={summaryMetrics}
            alerts={alerts}
            highlightPrediction={highlightPrediction}
            onOpenNewWasteModal={() => setIsNewWasteModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'waste_logs' && (
          <WasteLogView
            logs={wasteLogs}
            onOpenNewModal={() => setIsNewWasteModalOpen(true)}
            onDeleteLog={handleDeleteWasteLog}
          />
        )}

        {activeTab === 'economic' && (
          <EconomicAnalysisView
            metrics={summaryMetrics}
            wasteLogs={wasteLogs}
          />
        )}

        {activeTab === 'stock_fefo' && (
          <StockFefoView
            stockItems={stockItems}
            stockMovements={stockMovements}
            onAddMovement={handleAddStockMovement}
            onOpenDonationModalWithItem={handleOpenDonationFromStock}
            onOpenInvoiceModal={() => setIsGlobalInvoiceModalOpen(true)}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersInvoicesView
            suppliers={suppliers}
            invoices={invoices}
            onAddSupplier={handleAddSupplier}
            onAddPurchaseAndStock={handleAddPurchaseAndStock}
          />
        )}

        {activeTab === 'donations' && (
          <DonationView
            donations={donations}
            onAddDonation={handleAddDonation}
            prefillItem={prefillDonationItem}
          />
        )}

        {activeTab === 'valorization' && (
          <ValorizationView
            valorizationLogs={valorizationLogs}
            onAddValorizationLog={handleAddValorizationLog}
          />
        )}

        {activeTab === 'haccp' && (
          <HaccpView
            haccpLogs={haccpLogs}
            onAddHaccpLog={handleAddHaccpLog}
            temperatureLogs={temperatureLogs}
            onAddTemperatureLog={handleAddTemperatureLog}
            cleaningLogs={cleaningLogs}
            onAddCleaningLog={handleAddCleaningLog}
          />
        )}

        {activeTab === 'ai_forecast' && (
          <AIPredictionsView
            wasteLogs={wasteLogs}
            stockItems={stockItems}
            highlightPrediction={highlightPrediction}
            setHighlightPrediction={setHighlightPrediction}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            metrics={summaryMetrics}
            wasteLogs={wasteLogs}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            onMarkAsRead={handleMarkAlertAsRead}
            onClearAll={handleClearAllAlerts}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Global New Waste Log Modal */}
      <WasteLogModal
        isOpen={isNewWasteModalOpen}
        onClose={() => setIsNewWasteModalOpen(false)}
        onAddWasteLog={handleAddWasteLog}
      />

      {/* Global Invoice Upload & OCR Modal */}
      <InvoiceUploadModal
        isOpen={isGlobalInvoiceModalOpen}
        onClose={() => setIsGlobalInvoiceModalOpen(false)}
        suppliers={suppliers}
        onAddPurchaseAndStock={handleAddPurchaseAndStock}
        onAddNewSupplier={handleAddSupplier}
      />
    </div>
  );
}
