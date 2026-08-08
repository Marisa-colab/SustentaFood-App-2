import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Bot,
  Send,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WasteLog, StockItem } from '../types';

interface AIPredictionsViewProps {
  wasteLogs: WasteLog[];
  stockItems: StockItem[];
  highlightPrediction: string;
  setHighlightPrediction: (p: string) => void;
}

// Helper function to initialize Gemini model safely outside the component
const getGeminiModel = (systemInstruction?: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave VITE_GEMINI_API_KEY não configurada na Vercel.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    ...(systemInstruction ? { systemInstruction } : { generationConfig: { responseMimeType: 'application/json' } })
  });
};

export const AIPredictionsView: React.FC<AIPredictionsViewProps> = ({
  wasteLogs,
  stockItems,
  highlightPrediction,
  setHighlightPrediction
}) => {
  const [loading, setLoading] = useState(false);
  const [expectedDiners, setExpectedDiners] = useState<number>(280);
  const [upcomingEmenta, setUpcomingEmenta] = useState<string>('Bacalhau à Brás e Sopa de Legumes');

  // AI Response Data
  const [aiData, setAiData] = useState<{
    highlightPrediction?: string;
    wasteRiskScore?: number;
    forecastInsights?: Array<{
      title: string;
      category: string;
      riskLevel: string;
      predictedExcessKg: number;
      recommendation: string;
    }>;
    procurementAdvice?: Array<{
      item: string;
      action: string;
      suggestedQtyKg: number;
      reasoning: string;
    }>;
    haccpTip?: string;
  } | null>({
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
  });

  // Chat messages
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'Olá! Sou o seu Consultor Virtual SustentaFood powered by Gemini. Como posso ajudar com a ementa de hoje, controlo de validades ou redução de custos?'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Trigger AI Forecast diretamente no Frontend
  const handleGenerateForecast = async () => {
    setLoading(true);
    try {
      const model = getGeminiModel();
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

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);
      
      setAiData(parsedData);
      console.log("Previsão gerada com sucesso:", parsedData);

    } catch (error: any) {
      console.error("Erro ao gerar previsão com IA:", error);
      alert(`Ocorreu um erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Chat message send diretamente no Frontend
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setChatLoading(true);

    try {
      const chatModel = getGeminiModel('És o Consultor Virtual SustentaFood, perito em Gestão de Desperdício Alimentar, HACCP e Economia Circular. Responde sempre em Português de Portugal de forma prática.');

      const validHistory = chatMessages
        .filter((_, index) => index !== 0) 
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const chat = chatModel.startChat({
        history: validHistory
      });

      const result = await chat.sendMessage(userText);
      const replyText = await result.response.text();

      setChatMessages((prev) => [...prev, { sender: 'bot', text: replyText }]);
    } catch (err: any) {
      console.error("Erro no chat IA:", err);
      setChatMessages((prev) => [...prev, { sender: 'bot', text: 'Erro de ligação à IA: ' + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/40 text-indigo-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Módulo de Inteligência Preditiva (Gemini IA)</h2>
              <p className="text-xs text-indigo-200 mt-1">
                Previsão de excesso de produção, sugestões de compra inteligente e análise de tendências de consumo
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateForecast}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'A analisar dados com IA...' : 'Atualizar Previsão Preditiva'}</span>
          </button>
        </div>
      </div>

      {/* Inputs for Simulation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">N.º de Refeições Previstas para Amanhã</label>
          <input
            type="number"
            value={expectedDiners}
            onChange={(e) => setExpectedDiners(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border font-bold text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Ementa Planeada</label>
          <input
            type="text"
            value={upcomingEmenta}
            onChange={(e) => setUpcomingEmenta(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border font-medium"
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
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">Previsão Destaque para Amanhã</span>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">"{aiData.highlightPrediction}"</p>
            </div>
          </div>

          {/* Forecast Insights List */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Previsão de Excesso de Produção e Riscos
            </h3>

            <div className="space-y-3 text-xs">
              {aiData.forecastInsights?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
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
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Sugestões de Compras Inteligentes
            </h3>

            <div className="space-y-2.5 text-xs">
              {aiData.procurementAdvice?.map((proc, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1">
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
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <strong>Dica HACCP:</strong> {aiData.haccpTip}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive AI Assistant Chat */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-400" />
          <span>Consultor SustentaFood — Assistente de IA para Dúvidas e Ementas</span>
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
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="text-slate-400 italic text-[11px] animate-pulse">
              Consultor a pensar...
            </div>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSendChat} className="p-3 bg-white border-t flex gap-2">
          <input
            type="text"
            placeholder="Faça uma pergunta sobre reaproveitamento, HACCP ou redução de custos..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1 shadow"
          >
            <Send className="w-3.5 h-3.5" /> Enviar
          </button>
        </form>
      </div>
    </div>
  );
};
