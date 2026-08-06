import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import { verificarLicenca, LicencaStatus } from './services/licensingService';
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
  
  useEffect(() => {
    // 1. Obter sessão atual do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) validarLicencaEOrg(session.user.id);
      else setLoading(false);
    });
    
    // 2. Escutar alterações de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) validarLicencaEOrg(session.user.id);
      else {
        setLicencaValida(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function validarLicencaEOrg(userId: string) {
    setLoading(true);
    try {
      // Procura a organização do utilizador na tabela profiles ou utilizadores
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('organizacao_id, organizacoes(status_licença, valida_ate, nome)')
        .eq('id', userId)
        .single();

      if (error || !profile || !profile.organizacoes) {
        setLicencaValida(false);
        setLoading(false);
        return;
      }

      const org = profile.organizacoes;
      const dataValidade = new Date(org.valida_ate);
      const hoje = new Date();

      // Valida se o status é 'ativa' e se a data de validade não passou
      if (org.status_licença === 'ativa' && dataValidade >= hoje) {
        setLicencaValida(true);
        setOrganizacao({ id: profile.organizacao_id, nome: org.nome });
      } else {
        setLicencaValida(false);
      }
    } catch (err) {
      setLicencaValida(false);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        A carregar sistema...
      </div>
    );
  }

  // Se não há utilizador autenticado
  if (!session) {
    return <Login />;
  }

  // Se a licença expirou ou está inativa
  if (licencaValida === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="max-w-md bg-slate-800 p-8 rounded-xl border border-red-500/50 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Licença Inativa ou Expirada</h2>
          <p className="text-slate-300 text-sm mb-6">
            A licença de utilização desta organização encontra-se inativa ou expirada.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
          >
            Sair / Mudar de Conta
          </button>
        </div>
      </div>
    );
  }

  // Utilizador Autenticado e Licença Válida
  return (
    <div>
      {/* Botão de Terminar Sessão no Topo */}
      <div className="bg-slate-950 px-6 py-2 flex justify-between items-center text-xs text-slate-400 border-b border-slate-800">
        <span>Organização: <strong className="text-white">{organizacao?.nome}</strong></span>
        <button onClick={handleLogout} className="hover:text-white underline">
          Terminar Sessão
        </button>
      </div>

      <MainDashboard organizacaoId={organizacao?.id} />
    </div>
  );
}
  // Core Application Data State
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(initialWasteLogs);
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [invoices, setInvoices] = useState<InvoicePurchase[]>(initialInvoices);
  const [donations, setDonations] = useState<DonationLog[]>(initialDonations);
  const [valorizationLogs, setValorizationLogs] = useState<ValorizationLog[]>(initialValorizationLogs);
  const [haccpLogs, setHaccpLogs] = useState<HaccpLog[]>(initialHaccpLogs);
  const [temperatureLogs, setTemperatureLogs] = useState(initialTemperatureLogs);
  const [cleaningLogs, setCleaningLogs] = useState(initialCleaningLogs);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);

  const [highlightPrediction, setHighlightPrediction] = useState<string>(
    'Para amanhã prevê-se um excedente de 25 kg de sopa devido à baixa procura das últimas 4 semanas.'
  );

  // Modals & Prefills
  const [isNewWasteModalOpen, setIsNewWasteModalOpen] = useState(false);
  const [isGlobalInvoiceModalOpen, setIsGlobalInvoiceModalOpen] = useState(false);
  const [prefillDonationItem, setPrefillDonationItem] = useState<{ name: string; category: WasteCategory; quantity: number } | null>(null);

  // Today Date
  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic Metrics Calculation
  const totalWasteKgToday = wasteLogs
    .filter((l) => l.date === todayStr || l.date === '2026-08-01')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const totalWasteKgMonth = wasteLogs.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCostLostMonth = wasteLogs.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalCo2eKgMonth = wasteLogs.reduce((acc, curr) => acc + curr.co2eKg, 0);
  const mealsServedMonth = 4720;
  const kgPerMeal = totalWasteKgMonth / mealsServedMonth;
  const kgPerDayAvg = totalWasteKgMonth / 30;

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
    currentReductionPercent: 18.5
  };

  // Handlers for Adding & Deleting Data
  const handleAddWasteLog = (newLogData: Omit<WasteLog, 'id'>) => {
    const newId = `LOG-${1000 + wasteLogs.length + 1}`;
    const newLog: WasteLog = { id: newId, ...newLogData };
    setWasteLogs([newLog, ...wasteLogs]);
  };

  const handleDeleteWasteLog = (id: string) => {
    setWasteLogs(wasteLogs.filter((l) => l.id !== id));
  };

  const handleAddStockMovement = (movData: Omit<StockMovement, 'id'>) => {
    const newId = `MOV-${500 + stockMovements.length + 1}`;
    const newMov: StockMovement = { id: newId, ...movData };
    setStockMovements([newMov, ...stockMovements]);

    // Update stock quantity
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
    // 1. Create Invoice Record
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

    // 2. Automatically register new supplier if not already present
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

    // 3. Automatically add new batch items into FEFO Stock
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

  const handleAddHaccpLog = (haccpData: Omit<HaccpLog, 'id'>) => {
    const newId = `HACCP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newHaccp: HaccpLog = { id: newId, ...haccpData };
    setHaccpLogs([newHaccp, ...haccpLogs]);
  };

  const handleAddTemperatureLog = (tempData: Omit<TemperatureLog, 'id'>) => {
    const newId = `TEMP-${Math.floor(100 + Math.random() * 900)}`;
    const newTemp: TemperatureLog = { id: newId, ...tempData };
    setTemperatureLogs([newTemp, ...temperatureLogs]);
  };

  const handleAddCleaningLog = (cleanData: Omit<CleaningLog, 'id'>) => {
    const newId = `CLN-${Math.floor(100 + Math.random() * 900)}`;
    const newClean: CleaningLog = { id: newId, ...cleanData };
    setCleaningLogs([newClean, ...cleaningLogs]);
  };

  const handleMarkAlertAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleClearAllAlerts = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const unreadAlertCount = alerts.filter((a) => !a.read).length;

  // --- RENDERING: ECRÃ DE CARREGAMENTO DE LICENÇA ---
  if (isCheckingLicence) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">A verificar licença da subscrição...</p>
        </div>
      </div>
    );
  }

  // --- RENDERING: ECRÃ DE LICENÇA EXPIRADA OU SUSPENSA ---
  if (user && licenceState && !licenceState.acessoPermitido) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-2xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">Acesso Restrito</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{licenceState.motivo}</p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            Para renovar a sua subscrição ou esclarecer dúvidas sobre a licença do <strong>SustentaFood</strong>, entre em contacto com o suporte comercial.
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Terminar Sessão
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERING: APLICAÇÃO PRINCIPAL (SE LICENÇA OK OU EM DESENVOLVIMENTO) ---
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
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

      O trecho no final deve ficar estruturado da seguinte forma:

TypeScript
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

export default App;
