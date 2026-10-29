'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { CalendarDays, Trophy, User, LogOut, Compass, MessageCircle, LayoutGrid, Search, Menu, X, ShieldAlert, MessageSquareWarning } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ThemeToggle } from './ThemeToggle';
import { Notificacoes } from './Notificacoes';
import { BuscaGlobal } from './BuscaGlobal';
import { ModalFeedback } from './ModalFeedback';

const navItems = [
  { name: 'Lançamentos', href: '/', icon: CalendarDays },
  { name: 'Mensagens', href: '/mensagens', icon: MessageCircle },
  { name: 'Feed', href: '/feed', icon: LayoutGrid },
  { name: 'Meu Top 10', href: '/top10', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const supabase = useMemo(() => createClient(), []);
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [feedbackAberto, setFeedbackAberto] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let channel: any;

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(prev => (prev?.id === user?.id ? prev : user));
      
      if (user) {
        const { data } = await supabase.from('profiles').select('username, avatar_url, is_admin').eq('id', user.id).single();
        if (data) { 
          setUsername(data.username || 'Perfil'); 
          setAvatarUrl(data.avatar_url || ''); 
          setIsAdmin(data.is_admin || false);
        }

        const fetchUnread = async () => {
          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);
          setUnreadCount(count || 0);
        };

        fetchUnread();

        channel = supabase
          .channel('navbar-mensagens')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'direct_messages' },
            () => { fetchUnread(); }
          )
          .subscribe();
      }
    };
    
    getUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(prev => (prev?.id === session?.user?.id ? prev : session?.user ?? null));
      if (!session?.user) { setUsername(''); setAvatarUrl(''); setUnreadCount(0); setIsAdmin(false); }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* DESKTOP */}
      <header className="hidden md:flex sticky top-0 z-50 w-full h-16 bg-surface/80 backdrop-blur-md border-b border-border items-center justify-between px-6 transition-colors duration-300">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-accent group-hover:bg-accent/10 transition-colors">
            <span className="text-accent font-black text-lg leading-none mt-[1px]">A</span>
          </div>
          <span className="text-xl font-bold tracking-wider text-text">
            <span className="text-accent">ANI</span><span>VERSE</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text hover:bg-bg'
                }`}
              >
                <Icon size={18} />
                <span className="hidden lg:block">{item.name}</span>
                
                {item.name === 'Mensagens' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          <Link href="/destaques" className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer ${pathname === '/destaques' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text hover:bg-bg'}`}>
            <Compass size={18} />
            <span className="hidden lg:block">Destaques</span>
          </Link>

          {isAdmin && (
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer ${
                pathname === '/admin' ? 'bg-red-500/10 text-red-500' : 'text-muted hover:text-red-500 hover:bg-red-500/10'
              }`}
            >
              <ShieldAlert size={18} />
              <span className="hidden lg:block">Admin</span>
            </Link>
          )}
          
          <div className="mx-2"><BuscaGlobal /></div>
          <div className="mx-2"><ThemeToggle /></div>
          <Notificacoes />

          <div className="relative">
            <button
              onClick={() => {
                if (!user) {
                  setIsMenuOpen(false);
                  router.push('/login');
                } else {
                  setIsMenuOpen(!isMenuOpen);
                }
              }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-full border transition-colors cursor-pointer ${
                pathname === '/perfil' || isMenuOpen 
                  ? 'bg-accent/10 border-accent text-accent' 
                  : 'bg-surface border-border text-muted hover:border-accent hover:text-text'
              }`}
            >
              {user ? (
                <>
                  {avatarUrl ? (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden">
                      <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center">
                      <User size={14} />
                    </div>
                  )}
                  <span className="text-sm font-medium pr-2 max-w-[100px] truncate">{username || 'Meu Perfil'}</span>
                </>
              ) : (
                <>
                  <User size={18} className="ml-2" />
                  <span className="text-sm font-medium pr-2">Entrar</span>
                </>
              )}
            </button>

            {/* MENU DESKTOP (AGORA DENTRO DO BOTÃO, ALINHADO ABAIXO) */}
            {isMenuOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-2xl py-2 flex flex-col z-50">
                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-sm text-text hover:bg-bg transition-colors block w-full text-left">
                  Ver meu perfil
                </Link>
                <button 
                  onClick={() => { setIsMenuOpen(false); setFeedbackAberto(true); }} 
                  className="px-4 py-3 text-sm text-text hover:bg-bg transition-colors flex items-center gap-2 text-left w-full cursor-pointer"
                >
                  <MessageSquareWarning size={16} className="text-accent" /> Enviar Feedback
                </button>
                <div className="h-[1px] bg-border my-1" />
                <button onClick={handleLogout} className="px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-left w-full cursor-pointer">
                  <LogOut size={16} /> Sair da conta
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[900] h-16 bg-surface/90 backdrop-blur-lg border-t border-border flex items-center justify-around pb-safe transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          if (item.name === 'Meu Top 10') return null; 
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[10px] font-medium">{item.name}</span>
              {item.name === 'Mensagens' && unreadCount > 0 && (
                <span className="absolute top-2 right-4 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
        
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-muted hover:text-text cursor-pointer"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>

      {/* MENU MOBILE "MAIS" */}
      {isMobileMenuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl p-6 pb-24 flex flex-col gap-4 shadow-2xl animate-slide-up" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text">Menu</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted hover:text-text"><X size={24} /></button>
            </div>

            <Link href="/destaques" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-bg rounded-xl text-text font-medium hover:bg-border transition-colors">
              <Compass size={20} className="text-accent" /> Destaques
            </Link>
            <Link href="/top10" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-bg rounded-xl text-text font-medium hover:bg-border transition-colors">
              <Trophy size={20} className="text-accent" /> Meu Top 10
            </Link>

            {isAdmin && (
              <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors">
                <ShieldAlert size={20} /> Painel Admin
              </Link>
            )}

            <button 
              onClick={() => { setIsMobileMenuOpen(false); setFeedbackAberto(true); }} 
              className="flex items-center gap-3 p-4 bg-bg rounded-xl text-text font-medium hover:bg-border transition-colors w-full text-left"
            >
              <MessageSquareWarning size={20} className="text-accent" /> Enviar Feedback / Suporte
            </button>

            <div className="flex items-center justify-between p-4 bg-bg rounded-xl">
              <span className="text-text font-medium">Tema</span>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between p-4 bg-bg rounded-xl">
              <span className="text-text font-medium">Buscar</span>
              <BuscaGlobal />
            </div>

            <div className="h-[1px] bg-border my-2" />

            {user ? (
              <>
                <Link href="/perfil" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-bg rounded-xl text-text font-medium hover:bg-border transition-colors">
                  <User size={20} className="text-accent" /> Meu Perfil ({username})
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors">
                  <LogOut size={20} /> Sair da conta
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 p-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-colors">
                <User size={20} /> Entrar
              </Link>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE FEEDBACK */}
      {feedbackAberto && <ModalFeedback onClose={() => setFeedbackAberto(false)} />}
    </>
  );
}