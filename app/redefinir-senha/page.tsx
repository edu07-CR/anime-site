'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Lock, Mail, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RedefinirSenhaPage() {
  const [email, setEmail] = useState('');
  const [tokenHash, setTokenHash] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [etapa, setEtapa] = useState<'validar' | 'redefinir'>('validar');
  
  const router = useRouter();
  const supabase = createClient();

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash.trim(), // <-- MUDOU AQUI
      type: 'recovery',
    });

    if (error) {
      console.error("Erro no Supabase:", error);
      setErro('Código inválido ou expirado. Solicite um novo e-mail e tente novamente.');
      setLoading(false);
    } else {
      setEtapa('redefinir');
      setLoading(false);
    }
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-lg">
        <Link href="/login" className="text-muted hover:text-text flex items-center gap-1 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar para o login
        </Link>
        <h1 className="text-2xl font-bold text-text mb-2">Criar Nova Senha</h1>
        {erro && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
            <AlertTriangle className="shrink-0" size={18} />
            <span>{erro}</span>
          </div>
        )}
        {etapa === 'validar' && (
          <>
            <p className="text-muted text-sm mb-6">Digite seu e-mail e o código (token hash) que você recebeu.</p>
            <form onSubmit={handleValidarCodigo} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input type="email" required placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent" />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input type="text" required placeholder="Token Hash do e-mail" value={tokenHash} onChange={(e) => setTokenHash(e.target.value)} className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent text-sm" />
              </div>
              <button type="submit" disabled={loading} className="bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 disabled:opacity-50 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Validar Código'}
              </button>
            </form>
          </>
        )}
        {etapa === 'redefinir' && (
          <>
            <p className="text-muted text-sm mb-6">Código validado! Agora digite a sua nova senha.</p>
            <form onSubmit={handleRedefinirSenha} className="flex flex-col gap-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
                <input type="password" required placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent" />
              </div>
              <button type="submit" disabled={loading} className="bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 disabled:opacity-50 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Nova Senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}