'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, Trophy, User, LogOut, Compass } from 'lucide-react'; // Adicionado Compass
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ThemeToggle } from './ThemeToggle';
import { Notificacoes } from './Notificacoes';
const navItems = [
  { name: 'Lançamentos', href: '/', icon: CalendarDays },
  { name: 'Destaques', href: '/destaques', icon: Compass }, // <-- Nova aba adicionada
  { name: 'Meu Top 5', href: '/top10', icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setUsername(data.username || 'Perfil');
          setAvatarUrl(data.avatar_url || '');
        }
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setUsername('');
        setAvatarUrl('');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text hover:bg-bg'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}

          <div className="mx-2">
            <ThemeToggle />
          </div>
          <Notificacoes /> 

          <div className="relative" ref={menuRef}>
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
                  <span className="text-sm font-medium pr-2">{username || 'Meu Perfil'}</span>
                </>
              ) : (
                <>
                  <User size={18} className="ml-2" />
                  <span className="text-sm font-medium pr-2">Entrar</span>
                </>
              )}
            </button>

            {user && isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl py-2 flex flex-col z-50">
                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-sm text-text hover:bg-bg transition-colors cursor-pointer">
                  Ver meu perfil
                </Link>
                <div className="h-[1px] bg-border my-1" />
                <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-left w-full cursor-pointer">
                  <LogOut size={16} /> Sair da conta
                </button>
              </div>
            )}
            
            {!user && (
              <Link href="/login" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            )}
          </div>
        </nav>
      </header>

      {/* MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface/90 backdrop-blur-lg border-t border-border flex items-center justify-around pb-safe transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        
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
                <User size={22} className={(pathname === '/perfil' || isMenuOpen) ? 'stroke-[2.5px]' : 'stroke-2'} />
              )}
              <span className="text-[10px] font-medium truncate max-w-[60px]">
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
              <User size={22} className={pathname === '/login' ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className="text-[10px] font-medium">Entrar</span>
            </Link>
          )}

          {user && isMenuOpen && (
            <div className="absolute bottom-full mb-2 right-4 w-48 bg-surface border border-border rounded-lg shadow-xl py-2 flex flex-col z-50">
              <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 text-sm text-text hover:bg-bg transition-colors cursor-pointer">
                Ver meu perfil
              </Link>
              <div className="h-[1px] bg-border my-1" />
              <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-left w-full cursor-pointer">
                <LogOut size={16} /> Sair da conta
              </button>
            </div>
          )}
        </div>
      </nav>
      
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMenuOpen(false)} />
      )}
    </>
  );
}