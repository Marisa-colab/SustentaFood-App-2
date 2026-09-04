import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface SetPasswordScreenProps {
  onPasswordSet: () => void;
}

// Ecrã mostrado a quem acabou de aceitar um convite (ou pediu reset de password).
// Nesta altura já existe uma sessão válida (criada pelo Supabase a partir do link do
// email), mas a pessoa ainda não tem nenhuma password definida — por isso não faz
// sentido mostrar-lhe o formulário de login normal a pedir email + password.
export default function SetPasswordScreen({ onPasswordSet }: SetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(`Não foi possível definir a password: ${updateError.message}`);
      return;
    }

    onPasswordSet();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-400">SustentaFood</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bem-vindo(a)! Define a tua password de acesso para continuares.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nova password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 rounded-lg transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'A definir...' : 'Definir password e entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
