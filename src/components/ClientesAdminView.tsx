import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Painel só para a superadministradora: lista os clientes (organizações) com a
// data de entrada e a data de fim de validade da licença, e permite alterar a
// data de validade (renovações).
//
// A segurança NÃO depende deste ecrã estar escondido: a política de RLS
// "Superadministradora gere todas as organizações" na tabela `organizacoes`
// só deixa a superadministradora ler/alterar organizações que não sejam a sua.
// Um cliente que tentasse chamar isto veria apenas a própria organização e
// não conseguiria alterar nada.

interface Cliente {
  id: string;
  nome: string | null;
  Email: string | null;
  status_licenca: string | null;
  inicio_licenca: string | null;
  valida_ate: string | null;
}

const formatarData = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-PT') : '—';

// yyyy-mm-dd (hora local) para o <input type="date">
const paraInputData = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// A licença vale até ao FIM do dia escolhido (23:59:59, hora local).
const fimDoDia = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
};

const somarMeses = (base: Date, meses: number) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + meses);
  return d;
};

const estadoLicenca = (c: Cliente) => {
  if (c.status_licenca !== 'activa') {
    return { texto: 'Suspensa', cor: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
  if (!c.valida_ate) {
    return { texto: 'Sem data', cor: 'bg-amber-50 text-amber-800 border-amber-300' };
  }
  const dias = Math.ceil((new Date(c.valida_ate).getTime() - Date.now()) / 86400000);
  if (dias <= 0) return { texto: 'Expirada', cor: 'bg-rose-50 text-rose-700 border-rose-300' };
  if (dias <= 30) return { texto: `Expira em ${dias} dia${dias === 1 ? '' : 's'}`, cor: 'bg-amber-50 text-amber-800 border-amber-300' };
  return { texto: 'Ativa', cor: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
};

export const ClientesAdminView: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  // Data escolhida (ainda não guardada) por cliente.
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    const { data, error } = await supabase
      .from('organizacoes')
      .select('*')
      .order('valida_ate', { ascending: true });

    if (error) {
      setErro(`Não foi possível carregar os clientes: ${error.message}`);
    } else {
      setClientes((data ?? []) as Cliente[]);
      setRascunhos({});
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const guardar = async (cliente: Cliente, novaDataYmd: string) => {
    if (!novaDataYmd) return;
    const novaIso = fimDoDia(novaDataYmd);

    if (cliente.inicio_licenca && new Date(novaIso) <= new Date(cliente.inicio_licenca)) {
      setErro('A data de fim de validade tem de ser posterior à data de entrada.');
      return;
    }

    setErro(null);
    setMensagem(null);
    setAGuardar(cliente.id);

    // .select() devolve as linhas alteradas: se a RLS bloquear, vem vazio
    // (em vez de dar erro), por isso verificamos explicitamente.
    const { data, error } = await supabase
      .from('organizacoes')
      .update({ valida_ate: novaIso })
      .eq('id', cliente.id)
      .select('id, valida_ate');

    setAGuardar(null);

    if (error || !data || data.length === 0) {
      setErro(
        error
          ? `Não foi possível guardar: ${error.message}`
          : 'Não foi possível guardar: sem permissão para alterar esta organização.'
      );
      return;
    }

    setClientes((atual) =>
      atual.map((c) => (c.id === cliente.id ? { ...c, valida_ate: data[0].valida_ate } : c))
    );
    setRascunhos((r) => {
      const { [cliente.id]: _, ...resto } = r;
      return resto;
    });
    setMensagem(
      `Validade de "${cliente.nome ?? cliente.Email ?? 'cliente'}" atualizada para ${formatarData(
        data[0].valida_ate
      )}.`
    );
  };

  // Renovação rápida: soma meses ao fim atual (se ainda for futuro) ou a hoje (se já expirou).
  const renovar = (cliente: Cliente, meses: number) => {
    const agora = new Date();
    const fimAtual = cliente.valida_ate ? new Date(cliente.valida_ate) : null;
    const base = fimAtual && fimAtual > agora ? fimAtual : agora;
    setRascunhos((r) => ({ ...r, [cliente.id]: paraInputData(somarMeses(base, meses).toISOString()) }));
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clientes e licenças</h2>
          <p className="text-sm text-slate-500">
            Só tu vês este painel. Escolhe a nova data de fim de validade e clica em Guardar.
          </p>
        </div>
        <button
          onClick={carregar}
          className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
        >
          Atualizar lista
        </button>
      </div>

      {erro && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">{erro}</div>
      )}
      {mensagem && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-lg">
          {mensagem}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">A carregar clientes...</p>
      ) : clientes.length === 0 ? (
        <p className="text-sm text-slate-500">Ainda não há clientes.</p>
      ) : (
        <div className="space-y-3">
          {clientes.map((c) => {
            const estado = estadoLicenca(c);
            const rascunho = rascunhos[c.id];
            const valorInput = rascunho ?? paraInputData(c.valida_ate);
            const alterado = rascunho !== undefined && rascunho !== paraInputData(c.valida_ate);

            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{c.nome ?? c.Email ?? 'Cliente sem nome'}</p>
                    {c.Email && c.nome && c.nome !== c.Email && (
                      <p className="text-xs text-slate-500">{c.Email}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${estado.cor}`}>
                    {estado.texto}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Data de entrada</p>
                    <p className="font-medium text-slate-800">{formatarData(c.inicio_licenca)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Fim de validade atual</p>
                    <p className="font-medium text-slate-800">{formatarData(c.valida_ate)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block" htmlFor={`data-${c.id}`}>
                      Nova data de fim de validade
                    </label>
                    <input
                      id={`data-${c.id}`}
                      type="date"
                      value={valorInput}
                      onChange={(e) => setRascunhos((r) => ({ ...r, [c.id]: e.target.value }))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Renovar:</span>
                  {[3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => renovar(c, m)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      +{m === 12 ? '1 ano' : `${m} meses`}
                    </button>
                  ))}
                  <button
                    onClick={() => guardar(c, valorInput)}
                    disabled={!alterado || aGuardar === c.id}
                    className="ml-auto text-xs font-semibold px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {aGuardar === c.id ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
