'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SeloAdmin } from './SeloAdmin';

export function BuscaGlobal() {
  const [aberto, setAberto] = useState(false);
  const [query, setQuery] = useState('');
  const [animes, setAnimes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAberto(true);
      }
      if (e.key === 'Escape') setAberto(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setAnimes([]);
      setUsuarios([]);
    }
  }, [aberto]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length < 2) {
        setAnimes([]);
        setUsuarios([]);
        return;
      }

      setBuscando(true);

      // 1. Busca Usuários no Supabase (igual antes)
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_admin')
        .ilike('username', `%${query}%`)
        .limit(5);
      if (usersData) setUsuarios(usersData);

      // 2. Busca Animes APENAS nos Lançamentos
      try {
        // Aqui você troca para a sua rota de lançamentos.
        // Se a sua rota for /api/destaques ou outra, é só ajustar o fetch.
        const res = await fetch('/api/lancamentos-semana'); 
        if (res.ok) {
          const data = await res.json();
          // Filtra os animes que contém o termo digitado (ignorando maiúsculas/minúsculas)
          const filtrados = data.filter((anime: any) => 
            anime.title.toLowerCase().includes(query.toLowerCase())
          );
          setAnimes(filtrados.slice(0, 5)); // Pega no máximo 5
        }
      } catch (err) {
        console.error("Erro ao buscar lançamentos:", err);
      }

      setBuscando(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, supabase]);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="p-2 rounded-full hover:bg-bg transition-colors text-muted hover:text-accent cursor-pointer flex items-center gap-2"
      >
        <Search size={20} />
        <span className="hidden lg:flex items-center gap-1 text-xs border border-border px-2 py-1 rounded-md bg-bg/50">
          <span className="font-sans">Ctrl</span> K
        </span>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm" onClick={() => setAberto(false)}>
          <div 
            className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 border-b border-border">
              <Search className="text-muted" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por animes (Lançamentos) ou usuários..."
                className="flex-1 bg-transparent text-text text-lg px-4 py-4 focus:outline-none placeholder:text-muted"
              />
              {buscando && <Loader2 className="animate-spin text-accent" size={20} />}
              <button onClick={() => setAberto(false)} className="text-muted hover:text-red-500 ml-2">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              
              {query.length < 2 ? (
                <div className="text-center py-10 text-muted text-sm flex flex-col items-center gap-2">
                  <PlayCircle size={32} className="opacity-50" />
                  Digite pelo menos 2 letras para buscar.
                </div>
              ) : (animes.length === 0 && usuarios.length === 0 && !buscando) ? (
                <div className="text-center py-10 text-muted text-sm">
                  Nenhum resultado encontrado nos lançamentos ou usuários para "{query}".
                </div>
              ) : (
                <div className="space-y-4">
                  {usuarios.length > 0 && (
                    <div>
                      <h3 className="px-3 text-xs font-bold text-muted uppercase tracking-wider mb-2">Usuários</h3>
                      {usuarios.map((user) => (
                        <Link 
                          key={user.id} 
                          href={`/perfil/${user.username}`}
                          onClick={() => setAberto(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg transition-colors"
                        >
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-border shrink-0">
                            {user.avatar_url ? (
                              <Image src={user.avatar_url} alt="Avatar" fill sizes="32px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold">{user.username?.charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-1">
                            <span className="font-bold text-text">{user.username}</span>
                            {user.is_admin && <SeloAdmin />}
                          </div>
                          <span className="text-xs text-muted">Ver Perfil</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {animes.length > 0 && (
                    <div>
                      <h3 className="px-3 text-xs font-bold text-muted uppercase tracking-wider mb-2">Lançamentos</h3>
                      {animes.map((anime) => (
                        <Link 
                          key={anime.id} 
                          href={`/anime/${anime.id}`}
                          onClick={() => setAberto(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg transition-colors"
                        >
                          <div className="relative w-8 h-12 rounded-md overflow-hidden bg-border shrink-0">
                            <Image src={anime.coverUrl} alt={anime.title} fill sizes="32px" className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <span className="font-bold text-text line-clamp-1">{anime.title}</span>
                            <span className="text-xs text-muted block">Nota: {anime.score || 'N/A'}</span>
                          </div>
                          <span className="text-xs text-muted">Ir para o Anime</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-bg/50 border-t border-border flex justify-between items-center text-xs text-muted">
              <span>Use <kbd className="font-sans bg-surface px-1 py-0.5 rounded border border-border">Esc</kbd> para fechar</span>
              <span>Buscando apenas nos lançamentos</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}