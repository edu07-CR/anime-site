'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image as ImageIcon, X, Loader2, Send, ListOrdered } from 'lucide-react';
import Image from 'next/image';

export function CriadorPost({ onClose }: { onClose: () => void }) {
  const [legenda, setLegenda] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isRanking, setIsRanking] = useState(false); // Estado do checkbox
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const podePostar = (legenda.trim().length > 0 || files.length > 0) && !loading;

  const handleSelecionarImagens = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles = selectedFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length !== selectedFiles.length) {
      setErro('Algumas imagens ultrapassaram 5MB e foram ignoradas.');
    }

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removerImagem = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostar = async () => {
    if (!podePostar) return;

    setLoading(true);
    setErro('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Você precisa estar logado.');

      const mediaUrls: string[] = [];

      for (const file of files) {
        const fileName = `post-${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const { error: uploadError } = await supabase.storage.from('feed_media').upload(fileName, file);
        if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(fileName);
        mediaUrls.push(publicUrl);
      }

      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: mediaUrls[0] || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaUrls.length > 0 ? 'image' : 'text', 
        caption: legenda,
        is_ranking: isRanking && mediaUrls.length > 0, // Só é ranking se tiver imagem
      });

      if (postError) throw new Error(postError.message);

      onClose();
      window.location.reload();

    } catch (error: any) {
      setErro(error.message || 'Erro ao postar.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">Criar Novo Post</h2>
          <button onClick={onClose} className="text-muted hover:text-red-500"><X size={24} /></button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {erro && <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm">{erro}</div>}

          <textarea
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="O que você está pensando sobre animes?"
            rows={3}
            className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent resize-none"
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-black">
                  <Image src={preview} alt={`Preview ${index}`} fill className="object-cover" />
                  <button 
                    onClick={() => removerImagem(index)}
                    className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={() => inputRef.current?.click()}
            className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <ImageIcon size={24} />
            <span className="text-sm font-medium">Adicionar Imagens (Opcional)</span>
          </button>

          <input 
            type="file" 
            accept="image/*" 
            multiple 
            ref={inputRef} 
            onChange={handleSelecionarImagens} 
            className="hidden" 
          />
        </div>

        {/* RODAPÉ COM O CHECKBOX E O BOTÃO POSTAR */}
        <div className="p-4 border-t border-border flex flex-col gap-3">
          
          {/* CHECKBOX MOVIDO PARA CÁ */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="ranking-check"
              checked={isRanking}
              onChange={(e) => setIsRanking(e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
            <label htmlFor="ranking-check" className="text-sm text-text cursor-pointer flex items-center gap-2 select-none">
              <ListOrdered size={16} className="text-accent" />
              Numerar as imagens (Ranking)
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePostar}
              disabled={!podePostar}
              className={`font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                podePostar 
                  ? 'bg-accent text-white hover:bg-accent/90 cursor-pointer' 
                  : 'bg-accent/50 text-white/70 cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {loading ? 'Postando...' : 'Postar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}