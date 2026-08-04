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
  AIInsight,
  Supplier,
  InvoicePurchase
} from './types';

// Category CO2e emission factors (kg CO2e per kg food waste)
export const CO2_FACTORS: Record<string, number> = {
  'Carne': 12.5,
  'Peixe': 5.4,
  'Frutas': 1.2,
  'Legumes': 1.1,
  'Lacticínios': 3.2,
  'Padaria': 1.6,
  'Refeições Confecionadas': 2.8,
  'Outros': 2.0
};

// Initial Waste Logs (Recent history)
export const initialWasteLogs: WasteLog[] = [
  {
    id: 'LOG-1001',
    item: 'Lombo de Salmão Fresco',
    category: 'Peixe',
    type: 'Produtos fora de prazo',
    quantity: 12,
    unit: 'kg',
    costPerUnit: 14.50,
    totalCost: 174.00,
    date: '2026-08-01',
    time: '09:15',
    location: 'Armazém / Câmara Fria',
    responsible: 'João Silva (Chef Executivo)',
    notes: 'Excesso de stock da ementa de quinta-feira. Validade ultrapassada.',
    co2eKg: 64.8
  },
  {
    id: 'LOG-1002',
    item: 'Arroz de Marisco Confecionado',
    category: 'Refeições Confecionadas',
    type: 'Sobras de refeições',
    quantity: 18.5,
    unit: 'kg',
    costPerUnit: 6.20,
    totalCost: 114.70,
    date: '2026-08-01',
    time: '14:30',
    location: 'Empratamento / Buffet',
    responsible: 'Maria Santos (Resp. Buffet)',
    notes: 'Sobras do serviço de almoço de sexta-feira.',
    co2eKg: 51.8
  },
  {
    id: 'LOG-1003',
    item: 'Cascas e Aparas de Legumes',
    category: 'Legumes',
    type: 'Restos de preparação',
    quantity: 24,
    unit: 'kg',
    costPerUnit: 1.20,
    totalCost: 28.80,
    date: '2026-08-01',
    time: '11:00',
    location: 'Cozinha Central',
    responsible: 'António Costa (Sous-Chef)',
    notes: 'Preparação do miolo de sopa e acompanhamentos.',
    co2eKg: 26.4
  },
  {
    id: 'LOG-1004',
    item: 'Bifes de Perú Devolvidos',
    category: 'Carne',
    type: 'Alimentos devolvidos',
    quantity: 4.5,
    unit: 'kg',
    costPerUnit: 8.90,
    totalCost: 40.05,
    date: '2026-07-31',
    time: '13:45',
    location: 'Sala de Refeições',
    responsible: 'Ana Ferreira (Chefe de Sala)',
    notes: 'Sobras nos pratos devolvidos por clientes.',
    co2eKg: 56.25
  },
  {
    id: 'LOG-1005',
    item: 'Pão de Mistura Sobrante',
    category: 'Padaria',
    type: 'Sobras de refeições',
    quantity: 15,
    unit: 'kg',
    costPerUnit: 2.10,
    totalCost: 31.50,
    date: '2026-07-31',
    time: '16:00',
    location: 'Bar / Cafetaria',
    responsible: 'Carlos Ramos (Barman)',
    notes: 'Pão fatiado não consumido no almoço.',
    co2eKg: 24.0
  },
  {
    id: 'LOG-1006',
    item: 'Iogurtes Naturais',
    category: 'Lacticínios',
    type: 'Produtos fora de prazo',
    quantity: 8,
    unit: 'kg',
    costPerUnit: 3.50,
    totalCost: 28.00,
    date: '2026-07-30',
    time: '08:30',
    location: 'Armazém / Câmara Fria',
    responsible: 'João Silva (Chef Executivo)',
    notes: 'Caixa de iogurtes esquecida no fundo da câmara de lacticínios.',
    co2eKg: 25.6
  },
  {
    id: 'LOG-1007',
    item: 'Morangos Danificados',
    category: 'Frutas',
    type: 'Restos de preparação',
    quantity: 6.2,
    unit: 'kg',
    costPerUnit: 4.80,
    totalCost: 29.76,
    date: '2026-07-30',
    time: '10:15',
    location: 'Pastelaria',
    responsible: 'Sofia Martins (Pastelaria)',
    notes: 'Fruta com pisadelas e início de bolor na entrega.',
    co2eKg: 7.44
  },
  {
    id: 'LOG-1008',
    item: 'Vitela Assada Sobrante',
    category: 'Carne',
    type: 'Sobras de refeições',
    quantity: 14.0,
    unit: 'kg',
    costPerUnit: 12.00,
    totalCost: 168.00,
    date: '2026-07-29',
    time: '15:10',
    location: 'Empratamento / Buffet',
    responsible: 'Maria Santos (Resp. Buffet)',
    notes: 'Excesso de preparação para evento de grupo.',
    co2eKg: 175.0
  },
  {
    id: 'LOG-1009',
    item: 'Bacalhau Demolhado Rejeitado',
    category: 'Peixe',
    type: 'Avaria / Falha de frio',
    quantity: 22.0,
    unit: 'kg',
    costPerUnit: 13.50,
    totalCost: 297.00,
    date: '2026-07-28',
    time: '07:45',
    location: 'Armazém / Câmara Fria',
    responsible: 'João Silva (Chef Executivo)',
    notes: 'Câmara de congelação nº 2 subiu para +8ºC durante a noite.',
    co2eKg: 118.8
  },
  {
    id: 'LOG-1010',
    item: 'Creme de Legumes Sobrante',
    category: 'Refeições Confecionadas',
    type: 'Sobras de refeições',
    quantity: 25.0,
    unit: 'L',
    costPerUnit: 1.80,
    totalCost: 45.00,
    date: '2026-07-27',
    time: '21:30',
    location: 'Cozinha Central',
    responsible: 'António Costa (Sous-Chef)',
    notes: 'Sopa do jantar não vendida. Capacidade de congelação cheia.',
    co2eKg: 70.0
  }
];

// Initial FEFO Stock Items
export const initialStockItems: StockItem[] = [
  {
    id: 'STK-01',
    code: 'CAR-089',
    name: 'Peito de Frango Biológico',
    category: 'Carne',
    quantity: 45,
    unit: 'kg',
    batchNumber: 'LOTE-2026-0801A',
    expiryDate: '2026-08-03', // 2 days away
    costPerUnit: 7.20,
    storageType: 'Refrigerado',
    minStockThreshold: 15,
    fefoPriority: 'Crítico',
    supplier: 'Avícola do Dão'
  },
  {
    id: 'STK-02',
    code: 'LAC-044',
    name: 'Natas Culinárias 35%',
    category: 'Lacticínios',
    quantity: 28,
    unit: 'L',
    batchNumber: 'LOTE-2026-0722',
    expiryDate: '2026-08-04', // 3 days away
    costPerUnit: 3.10,
    storageType: 'Refrigerado',
    minStockThreshold: 10,
    fefoPriority: 'Atenção',
    supplier: 'Lactogal'
  },
  {
    id: 'STK-03',
    code: 'PEI-012',
    name: 'Filetes de Pescada do Atlântico',
    category: 'Peixe',
    quantity: 60,
    unit: 'kg',
    batchNumber: 'LOTE-2026-0715',
    expiryDate: '2026-08-02', // 1 day away
    costPerUnit: 11.50,
    storageType: 'Refrigerado',
    minStockThreshold: 20,
    fefoPriority: 'Crítico',
    supplier: 'Lota de Peniche'
  },
  {
    id: 'STK-04',
    code: 'LEG-102',
    name: 'Espinafres Frescos Folha',
    category: 'Legumes',
    quantity: 18,
    unit: 'kg',
    batchNumber: 'LOTE-2026-0730',
    expiryDate: '2026-08-03',
    costPerUnit: 3.80,
    storageType: 'Refrigerado',
    minStockThreshold: 8,
    fefoPriority: 'Atenção',
    supplier: 'Horta do Oeste'
  },
  {
    id: 'STK-05',
    code: 'PAD-005',
    name: 'Massa Folhada em Rolo',
    category: 'Padaria',
    quantity: 35,
    unit: 'un',
    batchNumber: 'LOTE-2026-0728',
    expiryDate: '2026-08-10',
    costPerUnit: 1.85,
    storageType: 'Refrigerado',
    minStockThreshold: 10,
    fefoPriority: 'Normal',
    supplier: 'Panificadora Central'
  },
  {
    id: 'STK-06',
    code: 'FRU-050',
    name: 'Maçã Alcobaça IGP',
    category: 'Frutas',
    quantity: 85,
    unit: 'kg',
    batchNumber: 'LOTE-2026-0725',
    expiryDate: '2026-08-15',
    costPerUnit: 1.40,
    storageType: 'Seco / Ambiente',
    minStockThreshold: 25,
    fefoPriority: 'Normal',
    supplier: 'Frutas do Caster'
  }
];

// Initial Stock Movements
export const initialStockMovements: StockMovement[] = [
  {
    id: 'MOV-501',
    stockItemId: 'STK-03',
    itemName: 'Filetes de Pescada do Atlântico',
    type: 'Saída',
    quantity: 20,
    unit: 'kg',
    date: '2026-08-01 10:00',
    responsible: 'António Costa',
    reason: 'Confeção de almoço do dia'
  },
  {
    id: 'MOV-502',
    stockItemId: 'STK-01',
    itemName: 'Peito de Frango Biológico',
    type: 'Entrada',
    quantity: 50,
    unit: 'kg',
    date: '2026-08-01 08:30',
    responsible: 'João Silva',
    reason: 'Guia de remessa nº 8841 - Avícola do Dão'
  },
  {
    id: 'MOV-503',
    stockItemId: 'STK-02',
    itemName: 'Natas Culinárias 35%',
    type: 'Ajuste / Inventário',
    quantity: -2,
    unit: 'L',
    date: '2026-07-31 18:00',
    responsible: 'João Silva',
    reason: 'Ajuste de inventário quinzenal'
  }
];

// Initial Surplus Donations
export const initialDonations: DonationLog[] = [
  {
    id: 'DON-2026-08',
    institutionName: 'Refood - Núcleo de Alvalade',
    nif: '509123456',
    contactPerson: 'Paula Guimarães',
    date: '2026-07-31',
    items: [
      { name: 'Sopa de Peixe Confecionada (excedente seguro)', category: 'Refeições Confecionadas', quantity: 20, unit: 'L', estimatedValue: 50.00 },
      { name: 'Pão de Centeio não fatiado', category: 'Padaria', quantity: 12, unit: 'kg', estimatedValue: 25.20 },
      { name: 'Maçãs IGP em embalagem selada', category: 'Frutas', quantity: 15, unit: 'kg', estimatedValue: 21.00 }
    ],
    totalKg: 47,
    totalValue: 96.20,
    responsible: 'Maria Santos',
    status: 'Concluída',
    certificateCode: 'CERT-RF-2026-0731-09',
    receiptNotes: 'Refeições transportadas em caixas térmicas a 68ºC conforme protocolo HACCP.'
  },
  {
    id: 'DON-2026-07',
    institutionName: 'Banco Alimentar Contra a Fome',
    nif: '502987654',
    contactPerson: 'Dr. Fernando Matos',
    date: '2026-07-25',
    items: [
      { name: 'Arroz Carolino (Sacos 5kg)', category: 'Outros', quantity: 50, unit: 'kg', estimatedValue: 65.00 },
      { name: 'Leite UHT Meio Gordo', category: 'Lacticínios', quantity: 40, unit: 'L', estimatedValue: 36.00 }
    ],
    totalKg: 90,
    totalValue: 101.00,
    responsible: 'João Silva',
    status: 'Concluída',
    certificateCode: 'CERT-BACF-2026-0725-14',
    receiptNotes: 'Doação de produtos secos de longa duração.'
  }
];

// Initial Valorization / Composting Logs
export const initialValorizationLogs: ValorizationLog[] = [
  {
    id: 'VAL-01',
    destination: 'Compostagem',
    quantityKg: 145,
    date: '2026-07-30',
    partnerEntity: 'Horta Comunitária Urbana / Camara Municipal',
    co2SavedKg: 159.5,
    responsible: 'António Costa',
    notes: 'Restos de hortícolas e borras de café recolhidos no ecoponto orgânico.'
  },
  {
    id: 'VAL-02',
    destination: 'Reciclagem de Óleos (OAU)',
    quantityKg: 60,
    date: '2026-07-28',
    partnerEntity: 'EcoÓleo Valorização Energética',
    co2SavedKg: 180.0,
    responsible: 'João Silva',
    notes: 'Óleos alimentares usados de fritura recolhidos em bidão certificado.'
  },
  {
    id: 'VAL-03',
    destination: 'Alimentação Animal',
    quantityKg: 85,
    date: '2026-07-24',
    partnerEntity: 'Quinta do Vale - Produção Agropecuária',
    co2SavedKg: 93.5,
    responsible: 'António Costa',
    notes: 'Pão duro e aparas vegetais destinadas a ração complementar.'
  }
];

// Initial HACCP Food Safety Logs
export const initialHaccpLogs: HaccpLog[] = [
  {
    id: 'HACCP-2026-042',
    date: '2026-07-28',
    time: '07:45',
    productName: 'Bacalhau Demolhado Congelado',
    batchNumber: 'LOTE-BAC-889',
    supplier: 'Pescanova Portugal',
    quantityKg: 22,
    rejectionReason: 'Quebra de Temperatura',
    temperatureLogged: 8.5,
    nonConformityCode: 'NC-2026-081',
    correctiveAction: 'Produto rejeitado no momento da receção. Notificação imediata ao fornecedor e emissão de nota de crédito.',
    status: 'Encerrado / Auditado',
    responsible: 'João Silva (Responsável HACCP)'
  },
  {
    id: 'HACCP-2026-039',
    date: '2026-07-20',
    time: '11:20',
    productName: 'Queijo Fresco de Vaca',
    batchNumber: 'LOTE-QUE-102',
    supplier: 'Queijaria do Saloio',
    quantityKg: 8.5,
    rejectionReason: 'Embalagem Danificada',
    nonConformityCode: 'NC-2026-068',
    correctiveAction: 'Selo térmico rompido em 4 unidades. Abate imediato e registo de não conformidade ao transportador.',
    status: 'Encerrado / Auditado',
    responsible: 'João Silva (Responsável HACCP)'
  }
];

// Initial Temperature Logs (Conformidade Reg. CE 852/2004 e DGAV)
export const initialTemperatureLogs: TemperatureLog[] = [
  {
    id: 'TEMP-01',
    equipmentName: 'Câmara Frigorífica de Carnes (CF-01)',
    location: 'Cozinha Central',
    targetTempRange: '0ºC a 4ºC',
    measuredTemp: 2.8,
    date: '2026-08-01',
    time: '08:15',
    shift: 'Manhã',
    status: 'Conforme',
    responsible: 'João Silva'
  },
  {
    id: 'TEMP-02',
    equipmentName: 'Câmara Frigorífica de Peixe (CF-02)',
    location: 'Cozinha Central',
    targetTempRange: '0ºC a 2ºC',
    measuredTemp: 1.5,
    date: '2026-08-01',
    time: '08:20',
    shift: 'Manhã',
    status: 'Conforme',
    responsible: 'João Silva'
  },
  {
    id: 'TEMP-03',
    equipmentName: 'Câmara de Congelação de Pescado (CC-01)',
    location: 'Armazém Principal',
    targetTempRange: '-22ºC a -18ºC',
    measuredTemp: -19.2,
    date: '2026-08-01',
    time: '08:25',
    shift: 'Manhã',
    status: 'Conforme',
    responsible: 'Maria Santos'
  },
  {
    id: 'TEMP-04',
    equipmentName: 'Mesa de Preparação Refrigerada (MP-01)',
    location: 'Zona de Saladas & Frios',
    targetTempRange: '2ºC a 6ºC',
    measuredTemp: 7.2,
    date: '2026-07-31',
    time: '14:30',
    shift: 'Tarde',
    status: 'Não Conforme',
    correctiveAction: 'Ajuste imediato do termóstato e transferência de ingredientes sensíveis para a câmara primária CF-01.',
    responsible: 'Pedro Costa'
  },
  {
    id: 'TEMP-05',
    equipmentName: 'Abatidor de Temperatura Rápido (AB-01)',
    location: 'Confeção Quente',
    targetTempRange: 'Arrefecer a +3ºC em <90 min',
    measuredTemp: 3.0,
    date: '2026-07-31',
    time: '18:45',
    shift: 'Tarde',
    status: 'Conforme',
    responsible: 'Pedro Costa'
  }
];

// Initial Cleaning & Sanitation Logs (BPHF / DGAV)
export const initialCleaningLogs: CleaningLog[] = [
  {
    id: 'CLN-01',
    areaOrEquipment: 'Bancadas de Inox e Tábuas de Corte de Peixe / Carne',
    frequency: 'Diária',
    detergentUsed: 'Detergente Desinfetante Clorado Biocida TP4 (Aprovado ASAE)',
    date: '2026-08-01',
    status: 'Inspecionado',
    responsible: 'Carla Mendes'
  },
  {
    id: 'CLN-02',
    areaOrEquipment: 'Câmaras Frigoríficas e Prateleiras Inox (CF-01 / CF-02)',
    frequency: 'Semanal',
    detergentUsed: 'Desengordurante Neutro para Frio + Desinfetante BACTERICIDA',
    date: '2026-07-28',
    status: 'Concluído',
    responsible: 'Rui Oliveira'
  },
  {
    id: 'CLN-03',
    areaOrEquipment: 'Sistemas de Exaustão, Hottes e Filtros de Gordura',
    frequency: 'Quinzenal',
    detergentUsed: 'Desengordurante Alcalino Forte de Ação Rápida',
    date: '2026-07-25',
    status: 'Concluído',
    responsible: 'Empresa Externa Certificada (LimpaHotte Lda)'
  },
  {
    id: 'CLN-04',
    areaOrEquipment: 'Contentores e Zona de Depósito de Resíduos Orgânicos',
    frequency: 'Diária',
    detergentUsed: 'Detergente Amoniacal Desinfetante e Inibidor de Odores',
    date: '2026-08-01',
    status: 'Inspecionado',
    responsible: 'Carla Mendes'
  }
];

// System Alerts
export const initialAlerts: AlertItem[] = [
  {
    id: 'ALT-01',
    type: 'expiring_soon',
    severity: 'high',
    title: 'Aviso FEFO: Validade Próxima',
    message: 'Filetes de Pescada do Atlântico (60 kg) terminam a validade amanhã (2026-08-02). Promover utilização na ementa de hoje ou doação!',
    date: '2026-08-01',
    read: false,
    relatedCategory: 'Peixe'
  },
  {
    id: 'ALT-02',
    type: 'waste_threshold',
    severity: 'high',
    title: 'Limite de Desperdício Ultrapassado',
    message: 'O setor de Armazém / Câmara Fria ultrapassou o limite semanal com 297,00€ em peixe rejeitado devido a avaria de frio.',
    date: '2026-07-29',
    read: false,
    relatedCategory: 'Peixe'
  },
  {
    id: 'ALT-03',
    type: 'excess_purchase',
    severity: 'medium',
    title: 'Alerta de Sobreatribuição de Compras',
    message: 'A quantidade de Maçã Alcobaça em stock (85 kg) excede a necessidade prevista para os próximos 10 dias em 35%.',
    date: '2026-07-31',
    read: true,
    relatedCategory: 'Frutas'
  }
];

// Historical Monthly Trends for Charts
export const monthlyWasteTrend = [
  { month: 'Jan', kg: 680, cost: 3850, meals: 4100, targetKg: 600, co2: 1904 },
  { month: 'Fev', kg: 620, cost: 3410, meals: 4250, targetKg: 580, co2: 1736 },
  { month: 'Mar', kg: 590, cost: 3180, meals: 4400, targetKg: 560, co2: 1652 },
  { month: 'Abr', kg: 540, cost: 2890, meals: 4300, targetKg: 540, co2: 1512 },
  { month: 'Mai', kg: 510, cost: 2650, meals: 4550, targetKg: 520, co2: 1428 },
  { month: 'Jun', kg: 480, cost: 2420, meals: 4600, targetKg: 500, co2: 1344 },
  { month: 'Jul', kg: 435, cost: 2180, meals: 4720, targetKg: 480, co2: 1218 }
];

// Top Wasted Products
export const topWastedProducts = [
  { name: 'Sopa e Cremes de Legumes', category: 'Refeições Confecionadas', kg: 68, cost: 122.40 },
  { name: 'Sobras de Bacalhau / Peixe', category: 'Peixe', kg: 54, cost: 675.00 },
  { name: 'Pão de Mistura Fatiado', category: 'Padaria', kg: 48, cost: 100.80 },
  { name: 'Cascas e Aparas Vegetais', category: 'Legumes', kg: 82, cost: 98.40 },
  { name: 'Sobras de Carne de Porco / Vitela', category: 'Carne', kg: 38, cost: 399.00 },
  { name: 'Fruta Época Danificada / Madura', category: 'Frutas', kg: 31, cost: 46.50 },
  { name: 'Iogurtes e Lacticínios Expirados', category: 'Lacticínios', kg: 22, cost: 77.00 },
  { name: 'Sobras de Arroz e Massas', category: 'Refeições Confecionadas', kg: 42, cost: 63.00 },
  { name: 'Sobras de Salada mista', category: 'Legumes', kg: 26, cost: 52.00 },
  { name: 'Doces e Sobremesas Buffet', category: 'Outros', kg: 18, cost: 90.00 }
];

// Sector Loss Breakdown
export const sectorLossBreakdown = [
  { sector: 'Empratamento / Buffet', lossCost: 820.00, percent: 37.6, mainReason: 'Dimensionamento excessivo de travessas e sobreatribuição' },
  { sector: 'Cozinha Central', lossCost: 540.00, percent: 24.8, mainReason: 'Restos de preparação e quebras de confeção' },
  { sector: 'Armazém / Câmara Fria', lossCost: 480.00, percent: 22.0, mainReason: 'Expiração de prazos e oscilação de temperatura' },
  { sector: 'Sala de Refeições', lossCost: 210.00, percent: 9.6, mainReason: 'Restos deixados nos pratos pelos clientes' },
  { sector: 'Bar / Cafetaria / Pastelaria', lossCost: 130.00, percent: 6.0, mainReason: 'Validade curta em produtos do dia' }
];

// Initial Suppliers
export const initialSuppliers: Supplier[] = [
  {
    id: 'SUP-01',
    name: 'Avícola do Dão',
    nif: '501234567',
    category: 'Carne',
    contactPerson: 'Manuel Seabra',
    phone: '+351 912 345 678',
    email: 'encomendas@avicoladao.pt',
    address: 'Zona Industrial de Mangualde, Lote 12',
    status: 'Ativo',
    rating: 4.8
  },
  {
    id: 'SUP-02',
    name: 'Lota de Peniche - Peixe Fresco',
    nif: '502345678',
    category: 'Peixe',
    contactPerson: 'Carla Rocha',
    phone: '+351 934 567 890',
    email: 'vendas@lotapeniche.pt',
    address: 'Docas de Peniche, Armazém 4',
    status: 'Ativo',
    rating: 4.9
  },
  {
    id: 'SUP-03',
    name: 'Lactogal Lacticínios',
    nif: '503456789',
    category: 'Lacticínios',
    contactPerson: 'Rui Almeida',
    phone: '+351 965 432 109',
    email: 'comercial@lactogal.pt',
    address: 'Rua das Oliveiras 100, Porto',
    status: 'Ativo',
    rating: 4.6
  },
  {
    id: 'SUP-04',
    name: 'Horta do Oeste - Hortofrutícolas',
    nif: '504567890',
    category: 'Legumes',
    contactPerson: 'Inês Mendes',
    phone: '+351 919 876 543',
    email: 'geral@hortadooeste.pt',
    address: 'Estrada Nacional 8, Torres Vedras',
    status: 'Ativo',
    rating: 4.7
  },
  {
    id: 'SUP-05',
    name: 'Panificadora Central de Lisboa',
    nif: '505678901',
    category: 'Padaria',
    contactPerson: 'Fernando Silva',
    phone: '+351 927 112 233',
    email: 'pedidos@panificadoracentral.pt',
    address: 'Av. Marechal Gomes da Costa 45, Lisboa',
    status: 'Ativo',
    rating: 4.5
  }
];

// Initial Invoices & Purchases
export const initialInvoices: InvoicePurchase[] = [
  {
    id: 'INV-2026-001',
    supplierId: 'SUP-01',
    supplierName: 'Avícola do Dão',
    nif: '501234567',
    invoiceNumber: 'FT 2026/8841',
    date: '2026-08-01',
    totalAmount: 324.00,
    ocrExtracted: true,
    status: 'Processada',
    responsible: 'João Silva',
    items: [
      {
        productName: 'Peito de Frango Biológico',
        category: 'Carne',
        quantity: 45,
        unit: 'kg',
        pricePerUnit: 7.20,
        totalCost: 324.00,
        expiryDate: '2026-08-03',
        batchNumber: 'LOTE-2026-0801A',
        storageType: 'Refrigerado'
      }
    ]
  },
  {
    id: 'INV-2026-002',
    supplierId: 'SUP-02',
    supplierName: 'Lota de Peniche - Peixe Fresco',
    nif: '502345678',
    invoiceNumber: 'FT 2026/7150',
    date: '2026-07-31',
    totalAmount: 690.00,
    ocrExtracted: true,
    status: 'Processada',
    responsible: 'João Silva',
    items: [
      {
        productName: 'Filetes de Pescada do Atlântico',
        category: 'Peixe',
        quantity: 60,
        unit: 'kg',
        pricePerUnit: 11.50,
        totalCost: 690.00,
        expiryDate: '2026-08-02',
        batchNumber: 'LOTE-2026-0715',
        storageType: 'Refrigerado'
      }
    ]
  }
];
