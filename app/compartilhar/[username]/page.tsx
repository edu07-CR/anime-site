'use client'; // <-- IMPORTANTE: Isso força a página a rodar no navegador, ignorando bloqueios do servidor

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Loader2 } from 'lucide-react';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';

export default function Top10CompartilharPage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [animes, setAnimes] = useState<any[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // 1. Busca o perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          setErro('Usuário não encontrado.');
          setLoading(false);
          return;
        }
        setProfile(profileData);

        // 2. Busca o Top 10
        const { data: top10Data, error: top10Error } = await supabase
          .from('user_top10')
          .select('position, anime_id')
          .eq('user_id', profileData.id)
          .order('position', { ascending: true })
          .limit(10);

        if (top10Error || !top10Data || top10Data.length === 0) {
          setErro('Este usuário ainda não tem um Top 10 salvo.');
          setLoading(false);
          return;
        }

        // 3. Busca as capas no AniList direto do navegador
        const ids = top10Data.map(t => t.anime_id);
        const query = `query ($ids: [Int]) { Page(page: 1, perPage: 50) { media(id_in: $ids, type: ANIME) { id title { romaji } coverImage { extraLarge } averageScore } } }`;
        
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { ids } })
        });
        
        const anilistJson = await res.json();
        const animesList = anilistJson.data?.Page?.media || [];

        // 4. Junta tudo na ordem certa
        const listaFinal = top10Data.map(item => {
          const info = animesList.find((a: any) => a.id === item.anime_id);
          if (!info) return null;
          return {
            id: info.id,
            title: info.title.romaji,
            coverUrl: info.coverImage.extraLarge,
            score: info.averageScore ? (info.averageScore / 10).toFixed(1) : 'N/A',
            position: item.position
          };
        }).filter(Boolean);

        setAnimes(listaFinal);
      } catch (e) {
        setErro('Ocorreu um erro ao carregar o Top 10.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [username, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <p className="text-muted text-lg">{erro}</p>
        <Link href="/" className="text-accent hover:underline">Voltar para a Home</Link>
      </div>
    );
  }

  // Prepara as imagens para o seu carrossel
  const imagensCarrossel = animes.map(a => a.coverUrl);

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho do Perfil */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mb-4 relative bg-surface">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-accent">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-text mb-2">@{profile.username}</h1>
          <p className="text-muted text-lg">Top 10 Animes Favoritos</p>
        </div>

        {/* O SEU CARROSSEL AQUI */}
        <div className="w-full max-w-md mx-auto mb-12 bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-3 border-b border-border flex items-center gap-2 bg-bg/50">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-text">@{profile.username}</span>
          </div>
          <CarrosselImagens imagens={imagensCarrossel} isRanking={true} />
        </div>

        {/* Lista em Grid abaixo do carrossel para garantir que vejam tudo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
          {animes.map((anime: any) => (
            <div key={anime.id} className="relative group rounded-xl overflow-hidden aspect-[2/3] bg-surface border border-border">
              <Image src={anime.coverUrl} alt={anime.title} fill className="object-cover" />
              <div className="absolute top-1 left-1 w-6 h-6 bg-accent text-white font-black text-xs rounded flex items-center justify-center shadow-lg">
                #{anime.position}
              </div>
              <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Star size={8} fill="currentColor" /> {anime.score}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-surface border border-border rounded-2xl p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-text mb-2">Gostou do Top 10?</h2>
          <p className="text-muted mb-6">Crie o seu próprio ranking definitivo de animes no AniVerse. É grátis!</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-3 rounded-xl hover:bg-accent/90 transition-colors"
          >
            Criar meu Top 10 <ArrowRight size={20} />
          </Link>
        </div>

      </div>
    </div>
  );
}