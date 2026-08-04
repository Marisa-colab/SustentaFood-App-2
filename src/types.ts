export type WasteCategory =
  | 'Carne'
  | 'Peixe'
  | 'Frutas'
  | 'Legumes'
  | 'Lacticínios'
  | 'Padaria'
  | 'Água'
  | 'Sumos'
  | 'Bebidas Brancas'
  | 'Cerveja'
  | 'Refeições Confecionadas'
  | 'Outros';

export type WasteType =
  | 'Sobras de refeições'
  | 'Produtos fora de prazo'
  | 'Restos de preparação'
  | 'Alimentos devolvidos'
  | 'Avaria / Falha de frio'
  | 'Outro';

export type ProductionLocation =
  | 'Cozinha Central'
  | 'Empratamento / Buffet'
  | 'Armazém / Câmara Fria'
  | 'Sala de Refeições'
  | 'Bar / Cafetaria'
  | 'Pastelaria';

export interface WasteLog {
  id: string;
  item: string;
  category: WasteCategory;
  type: WasteType;
  quantity: number;
  unit: 'kg' | 'L';
  costPerUnit: number;
  totalCost: number;
  date: string;
  time: string;
  location: ProductionLocation;
  responsible: string;
  notes?: string;
  co2eKg: number;
}

export interface StockItem {
  id: string;
  code: string;
  name: string;
  category: WasteCategory;
  quantity: number;
  unit: 'kg' | 'L' | 'un';
  batchNumber: string;
  expiryDate: string;
  costPerUnit: number;
  storageType: 'Refrigerado' | 'Congelado' | 'Seco / Ambiente';
  minStockThreshold: number;
  fefoPriority: 'Crítico' | 'Atenção' | 'Normal';
  supplier?: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  itemName: string;
  type: 'Entrada' | 'Saída' | 'Ajuste / Inventário' | 'Quebra / Desperdício';
  quantity: number;
  unit: string;
  date: string;
  responsible: string;
  reason?: string;
}

export interface DonationItem {
  name: string;
  category: WasteCategory;
  quantity: number;
  unit: string;
  estimatedValue: number;
}

export interface DonationLog {
  id: string;
  institutionName: string;
  nif: string;
  contactPerson: string;
  date: string;
  items: DonationItem[];
  totalKg: number;
  totalValue: number;
  responsible: string;
  status: 'Pendente' | 'Concluída' | 'Em Trânsito';
  certificateCode: string;
  receiptNotes?: string;
}

export interface ValorizationLog {
  id: string;
  destination: 'Compostagem' | 'Alimentação Animal' | 'Biogás / Bioenergia' | 'Reciclagem de Óleos (OAU)' | 'Outro';
  quantityKg: number;
  date: string;
  partnerEntity: string;
  co2SavedKg: number;
  responsible: string;
  notes?: string;
}

export interface HaccpLog {
  id: string;
  date: string;
  time: string;
  productName: string;
  batchNumber: string;
  supplier: string;
  quantityKg: number;
  rejectionReason:
    | 'Quebra de Temperatura'
    | 'Prazo Excedido'
    | 'Embalagem Danificada'
    | 'Anomalia Organoléptica'
    | 'Contaminação Cruzada'
    | 'Outro';
  temperatureLogged?: number;
  nonConformityCode: string;
  correctiveAction: string;
  status: 'Aberto' | 'Ação Executada' | 'Encerrado / Auditado';
  responsible: string;
}

export interface TemperatureLog {
  id: string;
  equipmentName: string;
  location: string;
  targetTempRange: string;
  measuredTemp: number;
  date: string;
  time: string;
  shift: 'Manhã' | 'Tarde' | 'Noite';
  status: 'Conforme' | 'Não Conforme';
  correctiveAction?: string;
  responsible: string;
}

export interface CleaningLog {
  id: string;
  areaOrEquipment: string;
  frequency: 'Diária' | 'Semanal' | 'Quinzenal' | 'Mensal';
  detergentUsed: string;
  date: string;
  status: 'Concluído' | 'Inspecionado' | 'Pendente';
  responsible: string;
}

export interface AlertItem {
  id: string;
  type: 'expiring_soon' | 'waste_threshold' | 'excess_purchase' | 'haccp_risk' | 'anomaly';
  severity: 'high' | 'medium' | 'info';
  title: string;
  message: string;
  date: string;
  read: boolean;
  relatedCategory?: WasteCategory;
}

export interface AIInsight {
  id: string;
  date: string;
  title: string;
  summary: string;
  type: 'forecast' | 'procurement' | 'waste_risk' | 'trend';
  metricText?: string;
  recommendation: string;
}

export interface Supplier {
  id: string;
  name: string;
  nif: string;
  category: WasteCategory | 'Mercearia Geral' | 'Bebidas' | 'Multicategoria';
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  status: 'Ativo' | 'Pendente' | 'Inativo';
  rating?: number;
}

export interface PurchaseItem {
  id?: string;
  productName: string;
  category: WasteCategory;
  quantity: number;
  unit: 'kg' | 'L' | 'un';
  pricePerUnit: number;
  totalCost: number;
  expiryDate: string;
  batchNumber: string;
  storageType: 'Refrigerado' | 'Congelado' | 'Seco / Ambiente';
}

export interface InvoicePurchase {
  id: string;
  supplierId?: string;
  supplierName: string;
  nif?: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  items: PurchaseItem[];
  fileUrl?: string;
  fileName?: string;
  ocrExtracted?: boolean;
  status: 'Processada' | 'Pendente' | 'Rascunho';
  responsible: string;
}

export interface SummaryMetrics {
  totalWasteKgToday: number;
  totalWasteKgMonth: number;
  totalCostLostMonth: number;
  totalCo2eKgMonth: number;
  potentialSavingsMonth: number;
  mealsServedMonth: number;
  kgPerMeal: number;
  kgPerDayAvg: number;
  reductionGoalPercent: number;
  currentReductionPercent: number;
}
