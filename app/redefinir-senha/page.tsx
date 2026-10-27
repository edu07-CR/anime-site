'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro('Erro ao redefinir a senha. O link pode ter expirado.');
      setLoading(false);
    } else {
      alert('Senha alterada com sucesso! Faça login novamente.');
      await supabase.auth.signOut(); // Desloga para garantir que ele entre com a nova
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-text mb-2">Criar Nova Senha</h1>
        <p className="text-muted text-sm mb-6">Digite sua nova senha abaixo. Certifique-se de que ela tenha pelo menos 6 caracteres.</p>

        {erro && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-4">{erro}</div>}

        <form onSubmit={handleRedefinir} className="flex flex-col gap-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="password"
              required
              placeholder="Nova senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}