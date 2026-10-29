'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2, GripVertical, X, Save, Star, Share2 } from 'lucide-react';
import { GeradorCard } from '@/components/top10/GeradorCard';
import Image from 'next/image';
import { EspacoAnuncio } from '@/components/layout/EspacoAnuncio';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Componente de Anime Individual (Arrastável) ---
function SortableAnime({ anime, index, onRemove }: { anime: any, index: number, onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: anime.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 bg-surface border border-border p-3 rounded-xl mb-2 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-accent text-white font-bold flex items-center justify-center flex-shrink-0">
        {index + 1}
      </div>
      <div className="relative w-12 h-16 rounded-md overflow-hidden flex-shrink-0">
        <Image src={anime.coverUrl} alt={anime.title} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-text font-bold truncate">{anime.title}</h3>
        <p className="text-muted text-xs">Nota: {anime.score}</p>
      </div>
      <button onClick={() => onRemove(anime.id)} className="text-muted hover:text-red-500 cursor-pointer">
        <X size={20} />
      </button>
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted hover:text-text p-1">
        <GripVertical size={20} />
      </button>
    </div>
  );
}

// --- Página Principal ---
export default function Top10Page() {
  const supabase = createClient();
  const router = useRouter();

  const [animes, setAnimes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('usuario'); 
  const [feedLiberado, setFeedLiberado] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const init = async () => {
      const { data: config } = await supabase.from('site_config').select('feed_enabled').single();
      if (config?.feed_enabled === false) setFeedLiberado(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (profile?.username) setUsername(profile.username);

      const { data } = await supabase
        .from('user_top10')
        .select('position, anime_id')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .limit(10);

      if (data && data.length > 0) {
        const animePromises = data.map(async (item) => {
          const res = await fetch(`/api/anime/${item.anime_id}`);
          if (!res.ok) return null;
          return await res.json();
        });
        const resolvedAnimes = (await Promise.all(animePromises)).filter(Boolean);
        setAnimes(resolvedAnimes);
      }
    };
    init();
  }, [supabase, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/search-anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: searchQuery })
      });
      if (!res.ok) throw new Error('Falha na busca');
      setSearchResults(await res.json());
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addAnime = (anime: any) => {
    if (animes.length >= 10) return alert("Você já tem 10 animes no Top!");
    if (animes.find(a => a.id === anime.id)) return alert("Esse anime já está na sua lista!");
    setAnimes([...animes, anime]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAnime = (id: number) => setAnimes(animes.filter(a => a.id !== id));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setAnimes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveTop10 = async () => {
    if (!userId) return;
    setIsSaving(true);
    await supabase.from('user_top10').delete().eq('user_id', userId);
    const insertData = animes.map((anime, index) => ({
      user_id: userId,
      anime_id: anime.id,
      position: index + 1
    }));
    const { error } = await supabase.from('user_top10').insert(insertData);
    if (error) alert("Erro ao salvar o Top 10."); else alert("Top 10 salvo com sucesso!");
    setIsSaving(false);
  };

  const handleCompartilhar = async () => {
    const url = `${window.location.origin}/perfil/${username}`;
    const shareData = {
      title: `Top 10 de ${username} no AniVerse`,
      text: `Olha o meu Top 10 de animes no AniVerse!`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link do seu perfil copiado para a área de transferência!');
      }
    } catch (error) {
      console.log('Compartilhamento cancelado', error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      
      <div className="mb-8">
        <EspacoAnuncio formato="banner" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="hidden lg:block lg:col-span-2 w-full sticky top-24">
          <EspacoAnuncio formato="vertical" />
        </div>

        <div className="lg:col-span-8 w-full max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Meu Top 10 Animes</h1>
            <p className="text-muted">Monte seu ranking definitivo. Arraste para ordenar do seu favorito (1º) ao menos favorito (10º).</p>
          </header>

          <div className="mb-8 relative">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por um anime para adicionar..."
                className="w-full bg-surface border border-border text-text rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-accent transition-colors"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-white p-2 rounded-lg cursor-pointer">
                {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Buscar'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-2 bg-surface border border-border rounded-xl overflow-hidden shadow-xl absolute w-full z-10">
                {searchResults.map((anime) => (
                  <button
                    key={anime.id}
                    onClick={() => addAnime(anime)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-bg transition-colors border-b border-border last:border-0 text-left cursor-pointer"
                  >
                    <div className="relative w-10 h-14 rounded-md overflow-hidden flex-shrink-0">
                      <Image src={anime.coverUrl} alt={anime.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-text text-sm">{anime.title}</p>
                      <p className="text-xs text-muted">Nota: {anime.score}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {animes.length > 0 ? (
            <div className="mb-8">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={animes.map(a => a.id)} strategy={verticalListSortingStrategy}>
                  {animes.map((anime, index) => (
                    <SortableAnime key={anime.id} anime={anime} index={index} onRemove={removeAnime} />
                  ))}
                </SortableContext>
              </DndContext>
              
              <button
                onClick={saveTop10}
                disabled={isSaving || animes.length < 1}
                className="w-full mt-6 bg-accent text-white font-bold py-4 rounded-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Salvar Meu Top 10
              </button>

              {/* BOTÃO DE COMPARTILHAR O TOP 10 */}
              {animes.length > 0 && (
                <button
                  onClick={handleCompartilhar}
                  className="w-full mt-3 bg-surface border border-border text-text font-bold py-4 rounded-xl hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={20} />
                  Compartilhar meu Top 10
                </button>
              )}

              {animes.length === 10 && (
                <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-md mx-auto">
                  <GeradorCard animes={animes} username={username} feedLiberado={feedLiberado} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
              <Star className="mx-auto text-muted mb-4" size={48} />
              <h2 className="text-xl font-bold text-text mb-2">Seu Top 10 está vazio</h2>
              <p className="text-muted text-sm">Use a barra de busca acima para adicionar seus animes favoritos.</p>
            </div>
          )}
        </div>

        <div className="hidden lg:block lg:col-span-2 w-full sticky top-24">
          <EspacoAnuncio formato="vertical" />
        </div>
      </div>

      <div className="mt-10">
        <EspacoAnuncio formato="banner" />
      </div>
    </div>
  );
}