import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Painel só para a superadministradora: lista os clientes (organizações) com a
// data de entrada, o período/validade da licença, o pagamento, e permite
// alterar tudo isto (renovações) e emitir um comprovativo de pagamento.
//
// A segurança NÃO depende deste ecrã estar escondido: a política de RLS
// "Superadministradora gere todas as organizações" na tabela `organizacoes`
// só deixa a superadministradora ler/alterar organizações que não sejam a sua,
// e a função `emitir_comprovativo` recusa quem não for superadministradora.

// ---------------------------------------------------------------------------
// DADOS DO EMITENTE que aparecem no comprovativo. Preenche antes de emitires
// comprovativos a clientes reais (as linhas vazias não aparecem no documento).
// ---------------------------------------------------------------------------
const EMITENTE = {
  nome: 'SustentaFood',
  nif: '', // ex.: '123456789'
  morada: '', // ex.: 'Rua ..., Angra do Heroísmo'
  contacto: '', // ex.: email ou telefone
};

interface Cliente {
  id: string;
  nome: string | null;
  Email: string | null;
  nif: string | null;
  status_licenca: string | null;
  inicio_licenca: string | null;
  valida_ate: string | null;
  periodo_meses: number | null;
  montante_pago: number | string | null;
  pago: boolean | null;
  data_pagamento: string | null;
  comprovativo_numero: string | null;
}

// O que está no formulário de cada cliente (tudo em texto, como nos inputs).
interface Formulario {
  validade: string; // yyyy-mm-dd
  periodo: string; // meses
  montante: string; // euros
  pago: boolean;
  dataPag: string; // yyyy-mm-dd
}

const formatarData = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-PT') : '—';

const formatarEuros = (n: number) =>
  n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// yyyy-mm-dd (hora local) para o <input type="date">
const paraInputData = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const hojeInput = () => paraInputData(new Date().toISOString());

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

const numeroDe = (texto: string) => Number(texto.replace(',', '.'));

const formularioDe = (c: Cliente): Formulario => ({
  validade: paraInputData(c.valida_ate),
  periodo: c.periodo_meses != null ? String(c.periodo_meses) : '',
  montante: c.montante_pago != null && Number(c.montante_pago) !== 0 ? String(c.montante_pago) : '',
  pago: Boolean(c.pago),
  dataPag: c.data_pagamento ?? '',
});

const iguais = (a: Formulario, b: Formulario) =>
  a.validade === b.validade &&
  a.periodo === b.periodo &&
  a.montante === b.montante &&
  a.pago === b.pago &&
  a.dataPag === b.dataPag;

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

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Gera o HTML do comprovativo (para imprimir ou guardar em PDF).
const htmlComprovativo = (c: Cliente, numero: string) => {
  const valor = Number(c.montante_pago ?? 0);
  const periodo =
    c.periodo_meses != null
      ? `${c.periodo_meses} ${c.periodo_meses === 1 ? 'mês' : 'meses'}`
      : 'período contratado';
  const linhaEmitente = [EMITENTE.nome, EMITENTE.nif && `NIF ${EMITENTE.nif}`, EMITENTE.morada, EMITENTE.contacto]
    .filter(Boolean)
    .map((t) => esc(String(t)))
    .join('<br>');
  const linhaCliente = [c.nome ?? c.Email ?? 'Cliente', c.nif && `NIF ${c.nif}`, c.Email && c.nome !== c.Email ? c.Email : '']
    .filter(Boolean)
    .map((t) => esc(String(t)))
    .join('<br>');

  return `<!doctype html>
<html lang="pt-PT"><head><meta charset="utf-8">
<title>Comprovativo ${esc(numero)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:720px;margin:40px auto;padding:0 24px}
  h1{font-size:22px;margin:0 0 4px} .num{color:#475569;margin-bottom:28px}
  .cols{display:flex;gap:40px;margin-bottom:28px} .cols div{flex:1;font-size:14px;line-height:1.5}
  .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px}
  th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left} th{background:#f8fafc}
  td.r,th.r{text-align:right} .total{font-size:18px;font-weight:bold;text-align:right;margin-bottom:28px}
  .nota{font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px}
  @media print{body{margin:0}}
</style></head><body>
<h1>Comprovativo de pagamento</h1>
<div class="num">Nº ${esc(numero)} &nbsp;·&nbsp; Emitido em ${new Date().toLocaleDateString('pt-PT')}</div>
<div class="cols">
  <div><div class="lbl">Emitente</div>${linhaEmitente}</div>
  <div><div class="lbl">Cliente</div>${linhaCliente}</div>
</div>
<table>
  <tr><th>Descrição</th><th>Validade da licença</th><th class="r">Valor</th></tr>
  <tr>
    <td>Licença de utilização da aplicação SustentaFood (${esc(periodo)})</td>
    <td>${formatarData(c.inicio_licenca)} a ${formatarData(c.valida_ate)}</td>
    <td class="r">${esc(formatarEuros(valor))}</td>
  </tr>
</table>
<div class="total">Total pago: ${esc(formatarEuros(valor))}</div>
<p style="font-size:14px">Pagamento recebido em ${formatarData(c.data_pagamento)}.</p>
<p class="nota">Documento interno de comprovativo de pagamento, sem valor fiscal. Não substitui a fatura/recibo
que deva ser emitido através de programa certificado pela Autoridade Tributária.</p>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
};

export const ClientesAdminView: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState<string | null>(null);
  const [aEmitir, setAEmitir] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  // Alterações ainda não guardadas, por cliente.
  const [rascunhos, setRascunhos] = useState<Record<string, Formulario>>({});

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

  const formDe = (c: Cliente): Formulario => rascunhos[c.id] ?? formularioDe(c);

  const alterarCampo = (c: Cliente, parcial: Partial<Formulario>) =>
    setRascunhos((r) => ({ ...r, [c.id]: { ...(r[c.id] ?? formularioDe(c)), ...parcial } }));

  // Renovação rápida: soma meses ao fim atual (se ainda for futuro) ou a hoje (se já expirou).
  const renovar = (c: Cliente, meses: number) => {
    const agora = new Date();
    const fimAtual = c.valida_ate ? new Date(c.valida_ate) : null;
    const base = fimAtual && fimAtual > agora ? fimAtual : agora;
    alterarCampo(c, {
      validade: paraInputData(somarMeses(base, meses).toISOString()),
      periodo: String(meses),
    });
  };

  const guardar = async (c: Cliente) => {
    const f = formDe(c);
    if (!f.validade) {
      setErro('Escolhe a data de fim de validade.');
      return;
    }
    const validadeIso = fimDoDia(f.validade);
    if (c.inicio_licenca && new Date(validadeIso) <= new Date(c.inicio_licenca)) {
      setErro('A data de fim de validade tem de ser posterior à data de entrada.');
      return;
    }
    const montante = f.montante.trim() === '' ? 0 : numeroDe(f.montante);
    if (!Number.isFinite(montante) || montante < 0) {
      setErro('O montante pago não é válido.');
      return;
    }
    const periodo = f.periodo.trim() === '' ? null : Math.round(numeroDe(f.periodo));
    if (periodo !== null && (!Number.isFinite(periodo) || periodo <= 0)) {
      setErro('O período de validade (em meses) não é válido.');
      return;
    }
    if (f.pago && montante <= 0) {
      setErro('Para marcar como pago, indica o montante pago.');
      return;
    }

    setErro(null);
    setMensagem(null);
    setAGuardar(c.id);

    // .select() devolve as linhas alteradas: se a RLS bloquear, vem vazio
    // (em vez de dar erro), por isso verificamos explicitamente.
    const { data, error } = await supabase
      .from('organizacoes')
      .update({
        valida_ate: validadeIso,
        periodo_meses: periodo,
        montante_pago: montante,
        pago: f.pago,
        data_pagamento: f.pago ? f.dataPag || hojeInput() : null,
      })
      .eq('id', c.id)
      .select('*');

    setAGuardar(null);

    if (error || !data || data.length === 0) {
      setErro(
        error
          ? `Não foi possível guardar: ${error.message}`
          : 'Não foi possível guardar: sem permissão para alterar esta organização.'
      );
      return;
    }

    const atualizado = data[0] as Cliente;
    setClientes((atual) => atual.map((x) => (x.id === c.id ? atualizado : x)));
    setRascunhos((r) => {
      const { [c.id]: _, ...resto } = r;
      return resto;
    });
    setMensagem(`Dados de "${c.nome ?? c.Email ?? 'cliente'}" guardados.`);
  };

  const emitirComprovativo = async (c: Cliente) => {
    setErro(null);
    setMensagem(null);

    // A janela tem de ser aberta já, no clique, senão o navegador bloqueia-a.
    const janela = window.open('', '_blank');
    if (!janela) {
      setErro('O navegador bloqueou a janela do comprovativo. Permite pop-ups para este site e tenta de novo.');
      return;
    }
    janela.document.write('<p style="font-family:sans-serif">A preparar comprovativo...</p>');

    setAEmitir(c.id);
    const { data: numero, error } = await supabase.rpc('emitir_comprovativo', { org_id: c.id });
    setAEmitir(null);

    if (error || !numero) {
      janela.close();
      setErro(`Não foi possível emitir o comprovativo: ${error?.message ?? 'sem número devolvido'}`);
      return;
    }

    janela.document.open();
    janela.document.write(htmlComprovativo(c, String(numero)));
    janela.document.close();

    setClientes((atual) =>
      atual.map((x) => (x.id === c.id ? { ...x, comprovativo_numero: String(numero) } : x))
    );
  };

  const inputCls = 'w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white';
  const lblCls = 'text-xs text-slate-500 block';

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clientes e licenças</h2>
          <p className="text-sm text-slate-500">
            Só tu vês este painel. Altera o que for preciso e clica em Guardar.
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
            const f = formDe(c);
            const alterado = !iguais(f, formularioDe(c));
            const podeEmitir = Boolean(c.pago) && Number(c.montante_pago ?? 0) > 0 && !alterado;

            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{c.nome ?? c.Email ?? 'Cliente sem nome'}</p>
                    {c.Email && c.nome && c.nome !== c.Email && (
                      <p className="text-xs text-slate-500">{c.Email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        c.pago
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {c.pago ? 'Pago' : 'Por pagar'}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${estado.cor}`}>
                      {estado.texto}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className={lblCls}>Data de entrada</p>
                    <p className="font-medium text-slate-800">{formatarData(c.inicio_licenca)}</p>
                  </div>
                  <div>
                    <p className={lblCls}>Fim de validade atual</p>
                    <p className="font-medium text-slate-800">{formatarData(c.valida_ate)}</p>
                  </div>
                  <div>
                    <p className={lblCls}>Comprovativo</p>
                    <p className="font-medium text-slate-800">{c.comprovativo_numero ?? 'Ainda não emitido'}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <label className={lblCls} htmlFor={`data-${c.id}`}>Nova data de fim de validade</label>
                    <input
                      id={`data-${c.id}`}
                      type="date"
                      value={f.validade}
                      onChange={(e) => alterarCampo(c, { validade: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={lblCls} htmlFor={`per-${c.id}`}>Período contratado (meses)</label>
                    <input
                      id={`per-${c.id}`}
                      type="number"
                      min={1}
                      step={1}
                      placeholder="ex.: 12"
                      value={f.periodo}
                      onChange={(e) => alterarCampo(c, { periodo: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={lblCls} htmlFor={`mont-${c.id}`}>Montante pago (€)</label>
                    <input
                      id={`mont-${c.id}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="ex.: 300"
                      value={f.montante}
                      onChange={(e) => alterarCampo(c, { montante: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={lblCls} htmlFor={`dpag-${c.id}`}>Data do pagamento</label>
                    <input
                      id={`dpag-${c.id}`}
                      type="date"
                      value={f.dataPag}
                      disabled={!f.pago}
                      onChange={(e) => alterarCampo(c, { dataPag: e.target.value })}
                      className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400`}
                    />
                  </div>
                </div>

                <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 w-fit">
                  <input
                    type="checkbox"
                    checked={f.pago}
                    onChange={(e) =>
                      alterarCampo(c, {
                        pago: e.target.checked,
                        dataPag: e.target.checked ? f.dataPag || hojeInput() : '',
                      })
                    }
                  />
                  Já está pago
                </label>

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
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => emitirComprovativo(c)}
                      disabled={!podeEmitir || aEmitir === c.id}
                      title={
                        podeEmitir
                          ? 'Abre o comprovativo para imprimir ou guardar em PDF'
                          : 'Marca como pago, indica o montante e guarda primeiro'
                      }
                      className="text-xs font-semibold px-4 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aEmitir === c.id
                        ? 'A emitir...'
                        : c.comprovativo_numero
                          ? 'Ver comprovativo'
                          : 'Emitir comprovativo'}
                    </button>
                    <button
                      onClick={() => guardar(c)}
                      disabled={!alterado || aGuardar === c.id}
                      className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aGuardar === c.id ? 'A guardar...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
