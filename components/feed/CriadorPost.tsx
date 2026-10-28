'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image as ImageIcon, X, Loader2, Send } from 'lucide-react';
import Image from 'next/image';

export function CriadorPost({ onClose }: { onClose: () => void }) {
  const [legenda, setLegenda] = useState('');
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleSelecionarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Limite de 5MB para não estourar o Storage gratuito
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 5MB.');
      return;
    }

    setFile(selectedFile);
    setImagemPreview(URL.createObjectURL(selectedFile));
    setErro('');
  };

  const handlePostar = async () => {
    if (!file) {
      setErro('Selecione uma imagem para postar.');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Você precisa estar logado.');

      // 1. Upload para o Storage
      const fileName = `post-${user.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('feed_media').upload(fileName, file);
      if (uploadError) throw new Error('Falha no upload da imagem.');

      const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(fileName);

      // 2. Insere no banco
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_urls: [publicUrl], // Array com uma única imagem
        media_type: 'image',
        caption: legenda,
      });

      if (postError) throw new Error('Falha ao salvar o post.');

      onClose(); // Fecha o modal
      window.location.reload(); // Recarrega o feed para mostrar o novo post

    } catch (error: any) {
      setErro(error.message || 'Erro ao postar.');
    } finally {
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

        <div className="p-4 space-y-4">
          {erro && <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm">{erro}</div>}

          <textarea
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="O que você está pensando sobre animes?"
            rows={3}
            className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent resize-none"
          />

          {imagemPreview ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
              <Image src={imagemPreview} alt="Preview" fill className="object-contain" />
              <button 
                onClick={() => { setImagemPreview(null); setFile(null); }}
                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => inputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted hover:border-accent hover:text-accent transition-colors"
            >
              <ImageIcon size={32} />
              <span className="text-sm font-medium">Selecionar Imagem</span>
            </button>
          )}

          <input 
            type="file" 
            accept="image/*" 
            ref={inputRef} 
            onChange={handleSelecionarImagem} 
            className="hidden" 
          />
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={handlePostar}
            disabled={loading || !file}
            className="bg-accent text-white font-bold px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {loading ? 'Postando...' : 'Postar'}
          </button>
        </div>

      </div>
    </div>
  );
}