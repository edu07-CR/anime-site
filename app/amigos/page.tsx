'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2, UserPlus, User, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SeloAdmin } from '@/components/layout/SeloAdmin';

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  is_admin: boolean;
}

export default function BuscarAmigosPage() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<Profile[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResultados([]);
        setBuscou(false);
        return;
      }

      setBuscando(true);
      setBuscou(true);

      // Busca usuários que contenham o texto digitado (ignorando maiúsculas/minúsculas)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_admin')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (data) setResultados(data);
      setBuscando(false);
    }, 500); // Debounce de 500ms para não fazer uma requisição a cada letra

    return () => clearTimeout(delayDebounceFn);
  }, [query, supabase]);

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-text mb-2">Encontre seus Amigos</h1>
        <p className="text-muted">Busque por usuários do AniVerse e comece a interagir.</p>
      </header>

      {/* Barra de Busca */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome de usuário..."
          className="w-full bg-surface border border-border text-text rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-accent transition-colors text-lg shadow-sm"
        />
        {buscando && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accent" size={20} />
        )}
      </div>

      {/* Resultados */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
        {buscando && resultados.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" size={32} /></div>
        ) : !buscou ? (
          <div className="text-center py-20">
            <User className="mx-auto text-muted mb-4" size={48} />
            <p className="text-muted">Digite pelo menos 2 letras para começar a buscar.</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted">Nenhum usuário encontrado com "{query}".</p>
          </div>
        ) : (
          <div>
            {resultados.map((profile) => (
              <div key={profile.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                <Link href={`/perfil/${profile.username}`} className="relative w-12 h-12 rounded-full overflow-hidden bg-border shrink-0 hover:ring-2 hover:ring-accent transition-all">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                      {profile.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/perfil/${profile.username}`} className="font-bold text-text truncate hover:text-accent transition-colors">
                      {profile.username}
                    </Link>
                    {profile.is_admin && <SeloAdmin />}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/perfil/${profile.username}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-bg border border-border text-text rounded-lg hover:border-accent hover:text-accent transition-colors font-medium text-sm cursor-pointer"
                  >
                    Ver Perfil
                  </Link>
                  <Link
                    href={`/mensagens/${profile.id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium text-sm cursor-pointer"
                  >
                    <MessageCircle size={16} /> Mensagem
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}