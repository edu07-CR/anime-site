'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2, Eye, EyeOff, User, X } from 'lucide-react';
import Link from 'next/link';

export default function LoginModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const dominiosPermitidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'bol.com.br', 'uol.com.br'];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido.');
      setLoading(false);
      return;
    }

    const dominio = email.split('@')[1].toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
      setError('Use um e-mail de um provedor conhecido (Gmail, Hotmail, etc).');
      setLoading(false);
      return;
    }

    if (!isLogin) {
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        setLoading(false);
        return;
      }
      
      const senhasFaceis = ['123456', 'abcdef', 'qwerty', '12345678', 'senha123'];
      if (senhasFaceis.includes(password.toLowerCase())) {
        setError('Sua senha é muito fácil. Escolha outra.');
        setLoading(false);
        return;
      }

      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        setError('A senha deve conter pelo menos uma letra e um número.');
        setLoading(false);
        return;
      }

      if (username.trim().length < 3) {
        setError('O nome de usuário deve ter pelo menos 3 letras.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, password, options: { data: { username } }
        });
        if (error) throw error;
      }
      
      router.back(); // Fecha o modal e volta para a Home
      router.refresh();
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) setError('E-mail ou senha incorretos.');
      else if (err.message.includes('User already registered')) setError('Este e-mail já está cadastrado.');
      else setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // O FUNDO ESCURO E DESFOCADO
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      
      {/* O CARD DE VIDRO (Glassmorphism) */}
      <div className="w-full max-w-md bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        
        {/* Botão de Fechar */}
        <button 
          onClick={() => router.back()} 
          className="absolute top-4 right-4 text-muted hover:text-red-400 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8 mt-2">
          <h1 className="text-2xl font-bold text-text mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-muted text-sm">
            {isLogin ? 'Entre para salvar seus animes e notas.' : 'Junte-se ao AniVerse.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text" placeholder="Seu nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} required={!isLogin}
                className="w-full bg-bg/50 border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-bg/50 border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type={showPassword ? 'text' : 'password'} placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-bg/50 border border-border text-text rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:border-accent"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent cursor-pointer">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 mt-2 flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="ml-2 text-accent font-bold hover:underline cursor-pointer">
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </div>
      </div>
    </div>
  );
}