import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cliente Supabase Admin (Bypasses RLS no servidor com Service Role Key)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Instância partilhada do cliente Gemini
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY não configurada.');
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // Endpoint de verificação de saúde
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Endpoint de Análise Preditiva e Previsão IA
  app.post('/api/ai/forecast', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Chave de API Gemini não configurada.',
          fallbackNotice: 'Configure a variável GEMINI_API_KEY no painel de ambiente.'
        });
      }

      let { wasteLogs, stockItems, expectedDiners = 250, upcomingEmenta = 'Ementa do Dia' } = req.body;

      // Se o frontend não enviar dados de resíduos/stock, procura diretamente na base de dados (bypass RLS via Admin)
      if ((!wasteLogs || wasteLogs.length === 0) && supabaseAdmin) {
        const { data: dbWaste } = await supabaseAdmin.from('registos_desperdicio').select('*').limit(20);
        wasteLogs = dbWaste || [];
      }

      if ((!stockItems || stockItems.length === 0) && supabaseAdmin) {
        const { data: dbStock } = await supabaseAdmin.from('stock_items').select('*').limit(20);
        stockItems = dbStock || [];
      }

      const prompt = `
És o especialista sénior em Prevenção de Desperdício Alimentar e Segurança Alimentar (HACCP) do sistema SustentaFood.
Analisa rigorosamente os dados reais fornecidos abaixo:

- Refeições previstas: ${expectedDiners}
- Ementa planeada: "${upcomingEmenta}"
- Registos recentes de resíduos: ${JSON.stringify((wasteLogs || []).slice(0, 10))}
- Artigos em stock (FEFO/Validades): ${JSON.stringify((stockItems || []).slice(0, 10))}

Gera um relatório preditivo em Português de Portugal:
1. Alertas de Risco Preditivo baseados nos alimentos em stock ou resíduos passados.
2. Recomendações de Compra Inteligente.
3. Dicas de Otimização de Confeção e Redução de Perdas.
4. Uma frase destacada de previsão única e altamente específica baseada nos dados reais (NÃO uses exemplos genéricos).
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Responde exclusivamente no formato JSON estruturado com o esquema solicitado.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              highlightPrediction: {
                type: Type.STRING,
                description: 'Frase curta e direta com previsão real baseada nos dados analisados'
              },
              wasteRiskScore: {
                type: Type.NUMBER,
                description: 'Nível de risco de desperdício em % (0 a 100)'
              },
              forecastInsights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    riskLevel: { type: Type.STRING, description: 'Elevado | Médio | Baixo' },
                    predictedExcessKg: { type: Type.NUMBER },
                    recommendation: { type: Type.STRING }
                  },
                  required: ['title', 'category', 'riskLevel', 'predictedExcessKg', 'recommendation']
                }
              },
              procurementAdvice: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    action: { type: Type.STRING, description: 'Reduzir Encomenda | Aumentar | Manter | Doar Excedente' },
                    suggestedQtyKg: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING }
                  },
                  required: ['item', 'action', 'suggestedQtyKg', 'reasoning']
                }
              },
              haccpTip: {
                type: Type.STRING,
                description: 'Dica de segurança alimentar e conservação para a ementa do dia'
              }
            },
            required: ['highlightPrediction', 'wasteRiskScore', 'forecastInsights', 'procurementAdvice', 'haccpTip']
          }
        }
      });

      const parsedText = response.text || '{}';
      const resultData = JSON.parse(parsedText);
      res.json(resultData);
    } catch (err: any) {
      console.error('Erro na API AI Forecast:', err);
      res.status(500).json({ error: 'Erro ao gerar análise preditiva com Gemini IA.', details: err.message });
    }
  });

  // Endpoint de Assistente de Chat IA
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ error: 'Chave de API Gemini não disponível.' });
      }

      const { message } = req.body;

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `
És o Consultor Virtual SustentaFood, perito em Gestão de Desperdício Alimentar, Nutrição Sustentável, Legislação HACCP e Economia Circular em Restauração.
Responde sempre em Português de Portugal com tom profissional, prático e motivador.
Dá conselhos concretos para:
- Reaproveitamento seguro de excedentes alimentares;
- Rotação FEFO e gestão de validades;
- Redução de custos e emissões de CO2;
- Sugestões de ementas de desperdício zero.
`
        }
      });

      const response = await chat.sendMessage({ message });
      res.json({ reply: response.text });
    } catch (err: any) {
      console.error('Erro na API AI Chat:', err);
      res.status(500).json({ error: 'Erro ao processar mensagem do assistente.', details: err.message });
    }
  });

  // Endpoint de OCR para Faturas
  app.post('/api/ai/parse-invoice', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const { image, mimeType = 'image/jpeg', textContent } = req.body;

      if (!image && !textContent) {
        return res.status(400).json({ error: 'Nenhum ficheiro ou imagem de fatura fornecido para processamento OCR.' });
      }

      if (!ai) {
        return res.status(503).json({ error: 'Chave de API Gemini não configurada.' });
      }

      let base64Clean = image ? image.replace(/^data:[^;]+;base64,/, '') : '';
      let effectiveMime = mimeType;
      if (image && image.startsWith('data:')) {
        const matches = image.match(/^data:([^;]+);base64,/);
        if (matches) {
          effectiveMime = matches[1];
        }
      }

      const promptParts: any[] = [];

      if (base64Clean) {
        promptParts.push({
          inlineData: {
            data: base64Clean,
            mimeType: effectiveMime
          }
        });
      }

      promptParts.push({
        text: `
Analisa esta fatura / nota de encomenda de alimentos para o sistema SustentaFood.
Extrai os dados estruturados de OCR em formato JSON conforme o esquema definido.
${textContent ? `Texto extraído do PDF: "${textContent.slice(0, 3000)}"` : ''}
`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: promptParts
          }
        ],
        config: {
          systemInstruction: 'És um assistente OCR especializado em faturas de restauração. Responde apenas no formato JSON estruturado exigido.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supplierName: { type: Type.STRING },
              nif: { type: Type.STRING },
              invoiceNumber: { type: Type.STRING },
              date: { type: Type.STRING },
              totalAmount: { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productName: { type: Type.STRING },
                    category: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    pricePerUnit: { type: Type.NUMBER },
                    totalCost: { type: Type.NUMBER },
                    expiryDate: { type: Type.STRING },
                    batchNumber: { type: Type.STRING },
                    storageType: { type: Type.STRING }
                  },
                  required: ['productName', 'category', 'quantity', 'unit', 'pricePerUnit', 'totalCost', 'expiryDate', 'storageType']
                }
              }
            },
            required: ['supplierName', 'invoiceNumber', 'date', 'items']
          }
        }
      });

      const parsedText = response.text || '{}';
      const ocrResult = JSON.parse(parsedText);
      res.json({
        ...ocrResult,
        ocrExtracted: true
      });
    } catch (err: any) {
      console.error('Erro no OCR de fatura:', err);
      res.status(500).json({ error: 'Falha ao processar a fatura por OCR.', details: err.message });
    }
  });

  // Integração Vite / Ficheiros estáticos
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor SustentaFood a rodar na porta ${PORT}`);
  });
}

startServer();
