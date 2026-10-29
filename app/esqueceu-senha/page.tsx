'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- IMPORT DO ROUTER
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const router = useRouter(); // <-- INICIALIZA O ROUTER
  const supabase = createClient();

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    setErro('');

    // Garante que a URL será a correta (localhost ou produção)
    const origin = window.location.origin;
    const isLocalhost = origin.includes('localhost');
    const baseUrl = isLocalhost ? origin : 'https://www.aniverse.com.br';
    const redirectUrl = `${baseUrl}/redefinir-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setErro('Erro ao enviar o e-mail. Verifique o endereço digitado.');
      setLoading(false);
    } else {
      setMensagem('Enviamos um código de recuperação para o seu e-mail!');
      
      // REDIRECIONA PARA A PÁGINA DE VALIDAÇÃO APÓS 2 SEGUNDOS
      setTimeout(() => {
        router.push('/redefinir-senha');
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-lg">
        <Link href="/login" className="text-muted hover:text-text flex items-center gap-1 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar para o login
        </Link>

        <h1 className="text-2xl font-bold text-text mb-2">Recuperar Senha</h1>
        <p className="text-muted text-sm mb-6">Digite o e-mail cadastrado na sua conta para receber o código de redefinição.</p>

        {erro && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-4">{erro}</div>}
        {mensagem && <div className="bg-green-500/10 text-green-500 p-3 rounded-lg text-sm mb-4">{mensagem}</div>}

        <form onSubmit={handleRecuperar} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="email"
              required
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || mensagem !== ''}
            className="bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Código de Recuperação'}
          </button>
        </form>
      </div>
    </div>
  );
}