import React from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  ShoppingCart,
  ShieldAlert,
  CheckCircle2,
  Check
} from 'lucide-react';
import { AlertItem } from '../types';

interface AlertsViewProps {
  alerts: AlertItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  setActiveTab: (tab: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onMarkAsRead,
  onClearAll,
  setActiveTab
}) => {
  const getIconForType = (type: AlertItem['type']) => {
    switch (type) {
      case 'expiring_soon':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'waste_threshold':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'excess_purchase':
        return <ShoppingCart className="w-5 h-5 text-sky-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Centro de Alertas Automáticos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Notificações em tempo real sobre prazos de validade, limites de desperdício e anomalias de compras
          </p>
        </div>

        {alerts.some((a) => !a.read) && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Marcar Todos como Lidos
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border text-center text-slate-400 text-xs">
            Não existem alertas pendentes no sistema. Excelente gestão de desperdício!
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                alert.read
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-amber-50/40 border-amber-300 shadow-sm text-slate-900'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm shrink-0">
                  {getIconForType(alert.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{alert.title}</h3>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">{alert.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {alert.type === 'expiring_soon' && (
                  <button
                    onClick={() => setActiveTab('stock_fefo')}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Ver FEFO
                  </button>
                )}
                {!alert.read && (
                  <button
                    onClick={() => onMarkAsRead(alert.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                    title="Marcar como lido"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
