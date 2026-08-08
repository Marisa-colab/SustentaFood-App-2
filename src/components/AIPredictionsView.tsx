import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Bot,
  Send,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Settings,
  ShieldAlert,
  Info,
  Database,
  Key,
  ChevronRight,
  Zap
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { WasteLog, StockItem, AIPredictionData, APIErrorDetails } from '../types';

interface AIPredictionsViewProps {
  wasteLogs?: WasteLog[];
  stockItems?: StockItem[];
  highlightPrediction?: string;
  setHighlightPrediction?: (p: string) => void;
}

// Updated standard models according to system skill guidelines
const PRIMARY_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-flash-latest';
const PRO_MODEL = 'gemini-3.1-pro-preview';

export const AIPredictionsView: React.FC<AIPredictionsViewProps> = ({
  wasteLogs = [],
  stockItems = [],
  highlightPrediction = '',
  setHighlightPrediction
}) => {
  const [loading, setLoading] = useState(false);
  const [expectedDiners, setExpectedDiners] = useState<number>(280);
  const [upcomingEmenta, setUpcomingEmenta] = useState<string>('Bacalhau à Brás e Sopa de Legumes');

  // Custom API key override state for easy testing
  const [customKey, setCustomKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(PRIMARY_MODEL);

  // System status and Error state
  const [apiError, setApiError] = useState<APIErrorDetails | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);

  // Default fallback AI Data
  const defaultAiData: AIPredictionData = {
    highlightPrediction: highlightPrediction || 'Para amanhã prevê-se um excedente de 25 kg de sopa devido à baixa procura das últimas 4 semanas.',
    wasteRiskScore: 35,
    forecastInsights: [
      {
        title: 'Excedente Previsto de Sopa de Legumes',
        category: 'Refeições Confecionadas',
        riskLevel: 'Elevado',
        predictedExcessKg: 25,
        recommendation: 'Reduzir a produção da caldeira principal em 25 kg e redirecionar vegetais para acompanhamento grelhado.'
      },
      {
        title: 'Risco de Expiração em Filetes de Pescada',
        category: 'Peixe',
        riskLevel: 'Elevado',
        predictedExcessKg: 18,
        recommendation: 'Aproveitar lote de peixe em stock FEFO para o prato do dia de hoje.'
      }
    ],
    procurementAdvice: [
      {
        item: 'Maçã Alcobaça',
        action: 'Reduzir Encomenda',
        suggestedQtyKg: 20,
        reasoning: 'Existe stock excedente de 85 kg em armazém com rotação lenta.'
      },
      {
        item: 'Peito de Frango',
        action: 'Manter',
        suggestedQtyKg: 35,
        reasoning: 'Procura estável ajustada ao número de refeições do próximo evento.'
      }
    ],
    haccpTip: 'Em dias de temperatura elevada, assegurar arrefecimento rápido da sopa em célula de abatimento em menos de 2 horas (de +65ºC para +10ºC).'
  };

  const [aiData, setAiData] = useState<AIPredictionData | null>(defaultAiData);

  // Chat messages state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; isError?: boolean }>>([
    {
      sender: 'bot',
      text: 'Olá! Sou o seu Consultor Virtual SustentaFood powered by Gemini. Como posso ajudar com a ementa de hoje, controlo de validades ou redução de custos?'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Helper to extract clean API Key
  const getApiKey = (): string | null => {
    if (customKey.trim()) return customKey.trim();
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    const envKey = metaEnv?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
    return envKey || null;
  };

  // Safe JSON extraction helper
  const cleanAndParseJSON = (text: string): AIPredictionData => {
    let sanitized = text.trim();
    // Remove codeblock wrappers if present
    if (sanitized.startsWith('```')) {
      sanitized = sanitized.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
    }
    return JSON.parse(sanitized);
  };

  // Parse error analysis for clear UI feedback
  const categorizeError = (err: any, attemptedModel: string): APIErrorDetails => {
    const errorStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
    const message = err?.message || errorStr;

    if (message.includes('404') || message.includes('is no longer available') || message.includes('not found')) {
      return {
        code: 404,
        message: `O modelo "${attemptedModel}" foi descontinuado ou não está disponível na sua região/versão da API.`,
        modelUsed: attemptedModel,
        timestamp: new Date().toLocaleTimeString('pt-PT'),
        type: 'MODEL_NOT_FOUND'
      };
    }

    if (message.includes('401') || message.includes('API key') || message.includes('unauthorized') || message.includes('VITE_GEMINI_API_KEY')) {
      return {
        code: 401,
        message: 'A chave de API do Gemini não está configurada ou é inválida.',
        modelUsed: attemptedModel,
        timestamp: new Date().toLocaleTimeString('pt-PT'),
        type: 'MISSING_API_KEY'
      };
    }

    if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      return {
        code: 429,
        message: 'Limite de pedidos da API excedido (Quota ou Rate Limit).',
        modelUsed: attemptedModel,
        timestamp: new Date().toLocaleTimeString('pt-PT'),
        type: 'QUOTA_EXCEEDED'
      };
    }

    if (err instanceof SyntaxError || message.includes('JSON')) {
      return {
        code: 'PARSE_ERROR',
        message: 'A resposta recebida da IA não veio em formato JSON válido.',
        modelUsed: attemptedModel,
        timestamp: new Date().toLocaleTimeString('pt-PT'),
        type: 'PARSE_ERROR'
      };
    }

    return {
      code: err?.status || 500,
      message: message || 'Ocorreu um erro ao comunicar com os servidores do Gemini.',
      modelUsed: attemptedModel,
      timestamp: new Date().toLocaleTimeString('pt-PT'),
      type: 'UNKNOWN'
    };
  };

  // Trigger AI Forecast with Automatic Fallback & Error Handling
  const handleGenerateForecast = async () => {
    setLoading(true);
    setApiError(null);

    const apiKey = getApiKey();

    if (!apiKey) {
      const errorDetails: APIErrorDetails = {
        code: 401,
        message: 'Nenhuma chave de API detetada (VITE_GEMINI_API_KEY). A usar modo de simulação inteligente local.',
        timestamp: new Date().toLocaleTimeString('pt-PT'),
        type: 'MISSING_API_KEY'
      };
      setApiError(errorDetails);
      setIsSimulatedMode(true);
      
      // Update simulation content dynamically based on user input
      setAiData({
        highlightPrediction: `Para amanhã (${expectedDiners} refeições) prevê-se um consumo estimado de ${(expectedDiners * 0.45).toFixed(0)}kg com risco de 15% de sobra em "${upcomingEmenta}".`,
        wasteRiskScore: Math.min(85, Math.max(15, Math.floor(expectedDiners / 4))),
        forecastInsights: [
          {
            title: `Análise Preditiva para ${upcomingEmenta}`,
            category: 'Refeições Confecionadas',
            riskLevel: expectedDiners > 300 ? 'Elevado' : 'Médio',
            predictedExcessKg: Math.round(expectedDiners * 0.08),
            recommendation: 'Ajustar o ponto de confeção para empratamento faseado para diminuir sobras em travessa.'
          },
          {
            title: 'Rotação de Ingredientes de Época',
            category: 'Hortofrutícolas',
            riskLevel: 'Baixo',
            predictedExcessKg: 12,
            recommendation: 'Utilizar aparas de vegetais para fundo de caldo aromático.'
          }
        ],
        procurementAdvice: [
          {
            item: 'Vegetais Frescos',
            action: 'Manter',
            suggestedQtyKg: Math.round(expectedDiners * 0.15),
            reasoning: 'Quantidade calculada proporcional ao histórico de presenças.'
          }
        ],
        haccpTip: 'Monitorizar continuamente a temperatura de conservação na câmara frigorífica (entre 0ºC e 4ºC).'
      });
      setLoading(false);
      return;
    }

    // Try API call with current model or fallback
    let currentModelToUse = selectedModel;
    
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
És o especialista sénior em Prevenção de Desperdício Alimentar e Segurança Alimentar (HACCP) do sistema SustentaFood.
Analisa os dados reais:
- Refeições previstas: ${expectedDiners}
- Ementa planeada: "${upcomingEmenta}"
- Registos de resíduos: ${JSON.stringify((wasteLogs || []).slice(0, 10))}
- Artigos em stock: ${JSON.stringify((stockItems || []).slice(0, 10))}

Responde EXCLUSIVAMENTE em formato JSON estruturado com o seguinte esquema:
{
  "highlightPrediction": "string (frase curta e direta com previsão real)",
  "wasteRiskScore": number (0 a 100),
  "forecastInsights": [{"title": "string", "category": "string", "riskLevel": "string", "predictedExcessKg": number, "recommendation": "string"}],
  "procurementAdvice": [{"item": "string", "action": "string", "suggestedQtyKg": number, "reasoning": "string"}],
  "haccpTip": "string"
}
`;

      let responseText = '';

      try {
        const response = await ai.models.generateContent({
          model: currentModelToUse,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        responseText = response.text || '';
      } catch (firstError: any) {
        console.warn(`Falha no modelo principal (${currentModelToUse}), tentando modelo de recurso (${FALLBACK_MODEL})...`, firstError);
        
        // Attempt fallback model
        currentModelToUse = FALLBACK_MODEL;
        setSelectedModel(FALLBACK_MODEL);

        const responseFallback = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        responseText = responseFallback.text || '';
      }

      if (!responseText) throw new Error("A resposta recebida da IA está vazia.");

      const parsedData = cleanAndParseJSON(responseText);
      setAiData(parsedData);
      setIsSimulatedMode(false);
      
      if (setHighlightPrediction && parsedData.highlightPrediction) {
        setHighlightPrediction(parsedData.highlightPrediction);
      }

    } catch (error: any) {
      console.error("Erro na API Gemini:", error);
      const categorized = categorizeError(error, currentModelToUse);
      setApiError(categorized);
      setIsSimulatedMode(true);

      // Keep present UI data or fallback gracefully so UI does NOT crash
      if (!aiData) {
        setAiData(defaultAiData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Chat message send with Error Protection & Fallback
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setChatLoading(true);

    const apiKey = getApiKey();

    if (!apiKey) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `(Modo de Resposta Local) Para a ementa de "${upcomingEmenta}" com ${expectedDiners} refeições, recomendo monitorizar as doses e aplicar a regra FEFO no stock. [Nota: Adicione VITE_GEMINI_API_KEY para respostas completas via IA].`
          }
        ]);
        setChatLoading(false);
      }, 600);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const validHistory = chatMessages
        .filter((m) => !m.isError && m.sender !== 'user' || m.sender === 'user')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const chat = ai.chats.create({
        model: selectedModel,
        config: {
          systemInstruction: 'És o Consultor Virtual SustentaFood, perito em Gestão de Desperdício Alimentar, HACCP e Economia Circular. Responde sempre em Português de Portugal de forma prática e concisa.'
        },
        history: validHistory
      });

      const result = await chat.sendMessage({ message: userText });
      const replyText = result.text || 'Sem resposta disponível de momento.';

      setChatMessages((prev) => [...prev, { sender: 'bot', text: replyText }]);
    } catch (err: any) {
      console.error("Erro no chat da IA:", err);
      const details = categorizeError(err, selectedModel);

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ Erro na comunicação com a IA: ${details.message} (Modelo: ${selectedModel}). Mudando para resposta assistida local.`,
          isError: true
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/40 text-indigo-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">Módulo de Inteligência Preditiva (Gemini IA)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold">
                  {selectedModel}
                </span>
                {isSimulatedMode && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-medium">
                    Modo Assistido Local
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                Previsão de excesso de produção, sugestões de compra inteligente e análise de tendências de consumo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Definições e diagnóstico da IA"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={handleGenerateForecast}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'A analisar dados com IA...' : 'Atualizar Previsão Preditiva'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Diagnostics / Settings Panel */}
      {showSettings && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-indigo-500/30 shadow-lg text-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Painel de Configuração e Diagnóstico do Gemini AI
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                Chave da API Gemini (Opcional - substitui VITE_GEMINI_API_KEY)
              </label>
              <input
                type="password"
                placeholder="Cole a sua chave AIzaSy..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Se não introduzir uma chave, o sistema usará a chave de ambiente ou o modo de simulação.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Modelo Ativo
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={PRIMARY_MODEL}>{PRIMARY_MODEL} (Recomendado - Gratuito/Padrão)</option>
                <option value={FALLBACK_MODEL}>{FALLBACK_MODEL} (Recurso)</option>
                <option value={PRO_MODEL}>{PRO_MODEL} (Pro)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Avisos: Modelos legados como gemini-1.5-flash ou gemini-2.5-flash já não estão disponíveis.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400 border-t border-slate-800">
            <span className="flex items-center gap-1">
              {getApiKey() ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chave de API Detetada
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Sem Chave (Modo Simulado Ativo)
                </span>
              )}
            </span>

            <button
              onClick={() => {
                setIsSimulatedMode(true);
                setApiError(null);
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
            >
              Ativar Modo de Simulação Local
            </button>
          </div>
        </div>
      )}

      {/* User-facing Friendly API Error Alert (Graceful Fallback Banner) */}
      {apiError && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm text-amber-900 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 border border-amber-300 rounded-xl text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-amber-950 text-sm">
                  {apiError.type === 'MODEL_NOT_FOUND' && 'Atualização de Modelo do Gemini'}
                  {apiError.type === 'MISSING_API_KEY' && 'Configuração de Chave de API'}
                  {apiError.type === 'QUOTA_EXCEEDED' && 'Limite de Pedidos da IA Excedido'}
                  {apiError.type === 'PARSE_ERROR' && 'Formatação de Resposta'}
                  {apiError.type === 'UNKNOWN' && 'Aviso de Ligação à IA'}
                </h4>
                <span className="text-[10px] text-amber-700 font-mono">
                  {apiError.timestamp}
                </span>
              </div>

              <p className="mt-1 text-amber-800 leading-relaxed">
                {apiError.message}
              </p>

              {apiError.type === 'MODEL_NOT_FOUND' && (
                <p className="mt-1 text-amber-900 font-medium">
                  💡 <strong>Solução Aplicada:</strong> O modelo foi automaticamente ajustado para <strong>{PRIMARY_MODEL}</strong>. Pode tentar novamente agora.
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleGenerateForecast}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold text-[11px] transition cursor-pointer"
                >
                  Tentar Novamente ({selectedModel})
                </button>
                <button
                  onClick={() => setApiError(null)}
                  className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-200 text-amber-900 rounded-lg font-medium text-[11px] transition cursor-pointer"
                >
                  Continuar em Modo Simulado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inputs for Simulation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">N.º de Refeições Previstas para Amanhã</label>
          <input
            type="number"
            value={expectedDiners}
            onChange={(e) => setExpectedDiners(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Ementa Planeada</label>
          <input
            type="text"
            value={upcomingEmenta}
            onChange={(e) => setUpcomingEmenta(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Ex: Bacalhau à Brás, Sopa de Legumes, Fruta da Época"
          />
        </div>
      </div>

      {/* Main Prediction Results */}
      {aiData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Highlight Prediction Box */}
          <div className="lg:col-span-12 bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-800 shadow-md flex items-start gap-3">
            <div className="p-2 bg-indigo-800/80 rounded-xl text-indigo-300 shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">Previsão Destaque para Amanhã</span>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">"{aiData.highlightPrediction}"</p>
            </div>
          </div>

          {/* Forecast Insights List */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Previsão de Excesso de Produção e Riscos
            </h3>

            <div className="space-y-3 text-xs">
              {aiData.forecastInsights?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 hover:border-slate-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      item.riskLevel === 'Elevado' || item.riskLevel === 'Crítico'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      Excesso: {item.predictedExcessKg} kg
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Recomendação da IA:</strong> {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Procurement Recommendations */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Sugestões de Compras Inteligentes
            </h3>

            <div className="space-y-2.5 text-xs">
              {aiData.procurementAdvice?.map((proc, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{proc.item}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      {proc.action} ({proc.suggestedQtyKg} kg)
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{proc.reasoning}</p>
                </div>
              ))}
            </div>

            {aiData.haccpTip && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs mt-3">
                <strong>Dica HACCP:</strong> {aiData.haccpTip}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive AI Assistant Chat */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span>Consultor SustentaFood — Assistente de IA para Dúvidas e Ementas</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
            {selectedModel}
          </span>
        </div>

        {/* Chat History */}
        <div className="p-4 h-64 overflow-y-auto space-y-3 bg-slate-50 text-xs">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-none shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="text-slate-400 italic text-[11px] animate-pulse">
              Consultor a analisar...
            </div>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="Faça uma pergunta sobre reaproveitamento, HACCP ou redução de custos..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1 shadow cursor-pointer transition"
          >
            <Send className="w-3.5 h-3.5" /> Enviar
          </button>
        </form>
      </div>
    </div>
  );
};
