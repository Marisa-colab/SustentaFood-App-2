import { WasteLog } from './types';

// Indicadores calculados apenas a partir dos registos reais de desperdício.

export const computeTopWastedProducts = (wasteLogs: WasteLog[], limit = 10) =>
  Object.values(
    wasteLogs.reduce<Record<string, { name: string; category: string; kg: number; cost: number }>>((acc, l) => {
      const key = `${l.item}|${l.category}`;
      if (!acc[key]) acc[key] = { name: l.item, category: l.category, kg: 0, cost: 0 };
      acc[key].kg += l.quantity || 0;
      acc[key].cost += l.totalCost || 0;
      return acc;
    }, {})
  )
    .sort((a, b) => b.kg - a.kg)
    .slice(0, limit);

export const computeSectorLossBreakdown = (wasteLogs: WasteLog[]) => {
  const totalLoss = wasteLogs.reduce((s, l) => s + (l.totalCost || 0), 0);
  return Object.entries(
    wasteLogs.reduce<Record<string, { cost: number; reasons: Record<string, number> }>>((acc, l) => {
      const k = l.location || 'Sem setor';
      if (!acc[k]) acc[k] = { cost: 0, reasons: {} };
      acc[k].cost += l.totalCost || 0;
      acc[k].reasons[l.type] = (acc[k].reasons[l.type] || 0) + (l.totalCost || 0);
      return acc;
    }, {})
  )
    .map(([sector, v]) => ({
      sector,
      lossCost: v.cost,
      percent: totalLoss > 0 ? Math.round((v.cost / totalLoss) * 1000) / 10 : 0,
      mainReason: Object.entries(v.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    }))
    .sort((a, b) => b.lossCost - a.lossCost);
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const computeMonthlyWasteTrend = (wasteLogs: WasteLog[], months = 6) => {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const logs = wasteLogs.filter((l) => (l.date || '').startsWith(prefix));
    return {
      month: MONTHS[d.getMonth()],
      kg: Math.round(logs.reduce((s, l) => s + (l.quantity || 0), 0) * 10) / 10,
      cost: logs.reduce((s, l) => s + (l.totalCost || 0), 0),
      co2: Math.round(logs.reduce((s, l) => s + (l.co2eKg || 0), 0)),
    };
  });
};

// Totais de um mês (ano, mês 0-11) a partir dos registos
export const computeMonthTotals = (wasteLogs: WasteLog[], year: number, month: number) => {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const logs = wasteLogs.filter((l) => (l.date || '').startsWith(prefix));
  return {
    logs,
    kg: logs.reduce((s, l) => s + (l.quantity || 0), 0),
    cost: logs.reduce((s, l) => s + (l.totalCost || 0), 0),
    co2: logs.reduce((s, l) => s + (l.co2eKg || 0), 0),
  };
};

// Variação percentual entre dois valores (null quando não há base de comparação)
export const percentChange = (current: number, previous: number): number | null =>
  previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;
