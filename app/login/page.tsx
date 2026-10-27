'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff, User } from 'lucide-react';
import Link from 'next/link';
import { SeletorAvatares } from '@/components/perfil/SelecionarAvatar';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // Estado para o avatar
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const dominiosPermitidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'bol.com.br', 'uol.com.br'];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação de E-mail
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

    // Validações de Cadastro
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
      if (!avatarUrl) {
        setError('Escolha um avatar para continuar.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Cria a conta e envia o username/avatar nos metadados
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { data: { username, avatar_url: avatarUrl } } 
        });
        if (authError) throw authError;

        // Se a conta foi criada, atualiza o avatar no perfil (caso o trigger não tenha feito)
        if (authData.user) {
          await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', authData.user.id);
        }
      }
      
      window.location.href = '/';
 
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) setError('E-mail ou senha incorretos.');
      else if (err.message.includes('User already registered')) setError('Este e-mail já está cadastrado.');
      else setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(`Erro ao entrar com ${provider}. Tente novamente.`);
      setSocialLoading(null);
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
            {isLogin ? 'Entre para salvar seus animes e notas.' : 'Junte-se ao AniVerse e monte seu Top 5.'}
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
                className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type={showPassword ? 'text' : 'password'} placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors cursor-pointer">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* LINK DE ESQUECEU A SENHA - SÓ APARECE NO LOGIN */}
          {isLogin && (
            <div className="flex justify-end mt-[-8px]">
              <Link href="/esqueceu-senha" className="text-sm text-accent hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
          )}

          {/* SELETOR DE AVATARES (APARECE SÓ NO CADASTRO) */}
          {!isLogin && (
            <div className="mt-2">
              <label className="text-sm font-semibold text-text mb-2 block">Escolha seu avatar</label>
              <SeletorAvatares selectedAvatar={avatarUrl} onSelect={setAvatarUrl} />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-muted">Ou continue com</span></div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={!!socialLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-bg border border-border text-text py-3 rounded-lg hover:border-accent transition-colors cursor-pointer font-medium text-sm disabled:opacity-50"
          >
            {socialLoading === 'google' ? <Loader2 className="animate-spin" size={18} /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={!!socialLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-bg border border-border text-text py-3 rounded-lg hover:border-accent transition-colors cursor-pointer font-medium text-sm disabled:opacity-50"
          >
            {socialLoading === 'facebook' ? <Loader2 className="animate-spin" size={18} /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            Facebook
          </button>
        </div>

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