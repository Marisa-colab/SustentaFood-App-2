import React, { useState } from 'react';
import { supabase } from '../supabaseClient.ts';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Estado para alternar entre o ecrã de Login e o de Recuperação de Palavra-passe
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciais inválidas ou erro no acesso.');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, introduz o teu e-mail primeiro.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://sustenta-food-app.vercel.app/', // Aponta para a tua aplicação
    });

    if (error) {
      setError(`Erro ao enviar e-mail: ${error.message}`);
    } else {
      setMessage('E-mail de recuperação enviado! Verifica a tua caixa de correio.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-400">SustentaFood</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão, Prevenção do Desperdício Alimentar & HACCP</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-sm rounded-lg">
            {message}
          </div>
        )}

        {!isForgotPassword ? (
          // FORMULÁRIO DE LOGIN NORMAL
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="cliente@empresa.pt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Palavra-passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError(null);
                  setMessage(null);
                }}
                className="text-emerald-400 hover:underline focus:outline-none"
              >
                Esqueceste-te da palavra-passe?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'A entrar...' : 'Iniciar Sessão'}
            </button>
          </form>
        ) : (
          // FORMULÁRIO DE RECUPERAÇÃO DE PALAVRA-PASSE
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Insere o teu e-mail associado para receberes um link seguro de redefinição de palavra-passe.
              </p>
              <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="cliente@empresa.pt"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'A enviar...' : 'Enviar e-mail de recuperação'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
                setMessage(null);
              }}
              className="w-full py-2 bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-white font-medium text-xs rounded-lg transition-colors"
            >
              Voltar ao Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
