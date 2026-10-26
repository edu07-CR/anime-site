'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AnimeData {
  id: number;
  title: string;
  coverUrl: string;
}

export function BotaoPostarFeed({ cardImage, animes }: { cardImage: string, animes: AnimeData[] }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handlePostar = async () => {
    if (!cardImage) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Você precisa estar logado para postar.");
        return;
      }

      const mediaUrls: string[] = [];

      // 1. Upload das capas (apenas as 5 primeiras para o carrossel)
      for (const anime of animes) {
        const highResUrl = anime.coverUrl.replace('/large/', '/extraLarge/'); 
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(highResUrl)}`);
        const blob = await res.blob();
        const fileName = `capa-${anime.id}-${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage.from('feed_media').upload(fileName, blob);
        
        // 👇 A MÁGICA DO SEU AMIGO AQUI 👇
        if (uploadError) {
          console.error("ERRO DETALHADO NO UPLOAD DA CAPA:", JSON.stringify(uploadError, null, 2));
          throw new Error(`Falha no upload da capa: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(fileName);
        mediaUrls.push(publicUrl);
      }

      // 2. Upload do card final
      const resCard = await fetch(cardImage);
      const blobCard = await resCard.blob();
      const fileNameCard = `card-${user.id}-${Date.now()}.png`;
      
      const { error: uploadErrorCard } = await supabase.storage.from('feed_media').upload(fileNameCard, blobCard);
      
      // 👇 A MÁGICA DO SEU AMIGO AQUI TAMBÉM 👇
      if (uploadErrorCard) {
        console.error("ERRO DETALHADO NO UPLOAD DO CARD:", JSON.stringify(uploadErrorCard, null, 2));
        throw new Error(`Falha no upload do card: ${uploadErrorCard.message}`);
      }

      const { data: { publicUrl: publicUrlCard } } = supabase.storage.from('feed_media').getPublicUrl(fileNameCard);
      mediaUrls.push(publicUrlCard);

      // 3. Insere no banco
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: mediaUrls[0], 
        media_urls: mediaUrls,   
        media_type: 'image',
        caption: `Meu Top 5 de animes!`,
      });

      // 👇 E AQUI TAMBÉM 👇
      if (postError) {
        console.error("ERRO DETALHADO NO BANCO:", JSON.stringify(postError, null, 2));
        throw new Error(`Falha ao salvar no banco: ${postError.message}`);
      }

      alert('Postado no Feed com sucesso! 🎉');
      router.push('/feed');
      
    } catch (error: any) {
      // O console vai mostrar o erro "limpo" que a gente criou acima
      console.error("Erro final capturado:", error.message);
      alert(`Erro ao postar: ${error.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePostar}
      disabled={loading}
      className="flex items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer w-full mt-4"
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
      {loading ? 'Postando...' : 'Postar no Feed'}
    </button>
  );
}