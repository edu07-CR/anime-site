'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Lista de domínios permitidos
  const dominiosPermitidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'bol.com.br', 'uol.com.br'];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Validação de E-mail Existente (Domínio permitido)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido (ex: seu@email.com).');
      setLoading(false);
      return;
    }

    const dominio = email.split('@')[1].toLowerCase();
    if (!dominiosPermitidos.includes(dominio)) {
      setError(`Por favor, use um e-mail de um provedor conhecido (Gmail, Hotmail, Outlook, etc).`);
      setLoading(false);
      return;
    }

    // 2. Validação de Senha Segura (Apenas no cadastro)
    if (!isLogin) {
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        setLoading(false);
        return;
      }
      
      // Bloquear senhas óbvias
      const senhasFaceis = ['123456', 'abcdef', 'qwerty', '12345678', 'senha123'];
      if (senhasFaceis.includes(password.toLowerCase())) {
        setError('Sua senha é muito fácil de adivinhar. Escolha outra.');
        setLoading(false);
        return;
      }

      // Exigir pelo menos uma letra e um número
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
          email, 
          password,
          options: { data: { username } }
        });
        if (error) throw error;
        alert('Conta criada com sucesso! (Lembre-se de confirmar o e-mail se a opção estiver ativa)');
      }
      
      router.push('/'); 
      router.refresh();
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (err.message.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else {
        setError(err.message || 'Ocorreu um erro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />

        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors mb-6 text-sm font-medium cursor-pointer">
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-muted text-sm">
            {isLogin ? 'Entre para salvar seus animes e notas.' : 'Junte-se ao AniVerse e monte seu Top 10.'}
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
                type="text"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="email" 
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type={showPassword ? 'text' : 'password'} 
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="ml-2 text-accent font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </div>
      </div>
    </div>
  );
}