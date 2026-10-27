'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [sessaoValida, setSessaoValida] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      // Troca o código da URL por uma sessão válida
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setErro('Link inválido ou expirado. Solicite um novo e-mail.');
          setLoading(false);
        } else {
          setSessaoValida(true);
          setLoading(false);
        }
      });
    } else {
      setErro('Nenhum código de recuperação encontrado na URL.');
      setLoading(false);
    }
  }, [searchParams, supabase.auth]);

  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessaoValida) {
      setErro('Sessão inválida. Solicite um novo e-mail.');
      return;
    }

    setLoading(true);
    setErro('');

    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setErro('Erro ao redefinir a senha. Tente novamente.');
      setLoading(false);
    } else {
      alert('Senha alterada com sucesso! Faça login novamente.');
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[80vh]"><Loader2 className="animate-spin text-accent" size={40} /></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-text mb-2">Criar Nova Senha</h1>
        
        {!sessaoValida ? (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg text-sm mb-6 flex items-start gap-2">
            <AlertTriangle className="shrink-0" size={20} />
            <span>{erro || 'Link inválido ou expirado. Volte para o login e solicite um novo e-mail.'}</span>
          </div>
        ) : (
          <p className="text-muted text-sm mb-6">Digite sua nova senha abaixo.</p>
        )}

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
              disabled={!sessaoValida}
              className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !sessaoValida}
            className="bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}