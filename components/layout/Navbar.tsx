'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { CalendarDays, Trophy, User, LogOut, Compass, MessageCircle, LayoutGrid, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ThemeToggle } from './ThemeToggle';
import { Notificacoes } from './Notificacoes';
import { BuscaGlobal } from './BuscaGlobal';

const navItems = [
  { name: 'Lançamentos', href: '/', icon: CalendarDays },
  { name: 'Destaques', href: '/destaques', icon: Compass },
  { name: 'Mensagens', href: '/mensagens', icon: MessageCircle },
  { name: 'Feed', href: '/feed', icon: LayoutGrid },
  { name: 'Meu Top 5', href: '/top10', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const supabase = useMemo(() => createClient(), []);
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
        if (data) { setUsername(data.username || 'Perfil'); setAvatarUrl(data.avatar_url || ''); }

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
            () => {
              fetchUnread();
            }
          )
          .subscribe();
      }
    };
    
    getUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(prev => (prev?.id === session?.user?.id ? prev : session?.user ?? null));
      if (!session?.user) { setUsername(''); setAvatarUrl(''); setUnreadCount(0); }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
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
          
          <div className="mx-2">
            <BuscaGlobal /> {/* Busca Global no Desktop */}
          </div>
          
          <div className="mx-2">
            <ThemeToggle />
          </div>
          
          <Notificacoes />

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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
          </div>
        </nav>
      </header>

      {/* MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[900] h-16 bg-surface/90 backdrop-blur-lg border-t border-border flex items-center justify-around pb-safe transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[9px] font-medium">{item.name}</span>

              {item.name === 'Mensagens' && unreadCount > 0 && (
                <span className="absolute top-2 right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
        
        {/* Busca Global no Mobile (ícone de lupa) */}
        <div className="flex items-center justify-center w-full h-full">
          <BuscaGlobal />
        </div>

        <div className="flex items-center justify-center w-full h-full">
          <ThemeToggle />
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          {user ? (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors cursor-pointer ${
                pathname === '/perfil' || isMenuOpen ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              {avatarUrl ? (
                <div className={`relative w-6 h-6 rounded-full overflow-hidden border ${isMenuOpen || pathname === '/perfil' ? 'border-accent' : 'border-transparent'}`}>
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                </div>
              ) : (
                <User size={20} className={(pathname === '/perfil' || isMenuOpen) ? 'stroke-[2.5px]' : 'stroke-2'} />
              )}
              <span className="text-[9px] font-medium truncate max-w-[50px]">
                {username || 'Perfil'}
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors cursor-pointer ${
                pathname === '/login' ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <User size={20} className={pathname === '/login' ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[9px] font-medium">Entrar</span>
            </Link>
          )}
        </div>
      </nav>

      {/* O PORTAL COM O MENU */}
      {isMenuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-48 bg-surface border border-border rounded-lg shadow-2xl py-2 flex flex-col pointer-events-auto mb-16 mr-2">
            <Link
              href="/perfil"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-3 text-sm text-text hover:bg-bg transition-colors block w-full text-left"
            >
              Ver meu perfil
            </Link>
            <div className="h-[1px] bg-border my-1" />
            <button
              onClick={handleLogout}
              className="px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-left w-full cursor-pointer"
            >
              <LogOut size={16} /> Sair da conta
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}