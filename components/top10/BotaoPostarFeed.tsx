'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

// A interface agora é idêntica à do GeradorCard
interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
  score: string;
}

export function BotaoPostarFeed({ 
  animes, 
  legenda, 
  feedLiberado, 
  tema 
}: { 
  animes: AnimeData[], 
  legenda: string, 
  feedLiberado: boolean, 
  tema: string 
}) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handlePostar = async () => {
    if (!feedLiberado) { setErro('O Feed está em manutenção.'); return; }
    if (animes.length === 0) { setErro('Adicione pelo menos 1 anime.'); return; }

    setLoading(true);
    setErro('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErro("Você precisa estar logado."); return; }

      const animesParam = encodeURIComponent(JSON.stringify(animes));
      const ogImageUrl = `/api/top10-image?username=${user.user_metadata?.username || 'usuario'}&animes=${animesParam}&tema=${tema}`;
      
      const res = await fetch(ogImageUrl);
      if (!res.ok) throw new Error("Falha ao gerar a imagem do Top 10.");
      
      const blob = await res.blob();
      const fileName = `top10-${user.id}-${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage.from('feed_media').upload(fileName, blob);
      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(fileName);

      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: publicUrl, 
        media_urls: [publicUrl],
        media_type: 'image',
        caption: legenda || `Meu Top 10 de animes!`,
        is_ranking: true, 
        // Se você criar a coluna 'theme' no banco, descomente a linha abaixo:
        // theme: tema, 
      });

      if (postError) throw new Error(`Falha ao salvar: ${postError.message}`);

      router.push('/feed');
      
    } catch (error) {
      // Correção do erro "no-explicit-any" do ESLint
      setErro(error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-4">
      {erro && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-3 flex items-center gap-2">
          <Lock size={18} /> {erro}
        </div>
      )}
      
      <button
        onClick={handlePostar}
        disabled={loading || !feedLiberado} // Correção do ponto 6: botão desabilita de verdade se o feed estiver em manutenção
        className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg w-full ${
          feedLiberado ? 'bg-accent text-white hover:bg-accent/90 shadow-accent/20 cursor-pointer' : 'bg-surface text-muted border border-border cursor-not-allowed'
        }`}
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : !feedLiberado ? <Lock size={20} /> : <Send size={20} />}
        {loading ? 'Gerando Card...' : !feedLiberado ? 'Feed em Manutenção' : 'Postar no Feed'}
      </button>
    </div>
  );
}