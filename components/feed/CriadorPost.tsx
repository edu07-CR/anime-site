'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image as ImageIcon, X, Loader2, Send, ListOrdered, BarChart2, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { uploadImagemModerada } from '@/app/actions/upload';

// Lista de palavras impróprias (você pode expandir conforme necessário)
const PALAVROES = [
  'idiota', 'burro', 'merda', 'porra', 'caralho', 'foda', 'puta', 'bosta', 
  'otario', 'babaca', 'imbecil', 'cretino', 'desgraçado', 'maldito', 'puto',
  'viado', 'bicha', 'corno', 'cuzao', 'arrombado', 'fdp', 'vsf', 'vtnc'
];

export function CriadorPost({ onClose }: { onClose: () => void }) {
  const [legenda, setLegenda] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const [tipoPost, setTipoPost] = useState<'imagem' | 'enquete'>('imagem');
  const [opcao1, setOpcao1] = useState('');
  const [opcao2, setOpcao2] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const podePostar = (tipoPost === 'enquete' 
    ? (legenda.trim().length > 0 && opcao1.trim().length > 0 && opcao2.trim().length > 0)
    : (legenda.trim().length > 0 || files.length > 0)) 
    && !loading;

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

      // --- VERIFICAÇÃO ANTI-SPAM (CONTEÚDO DUPLICADO) ---
      const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: postDuplicado } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('caption', legenda)
        .gte('created_at', cincoMinutosAtras)
        .maybeSingle();

      if (postDuplicado) {
        throw new Error('Você já postou esse mesmo texto há menos de 5 minutos. Evite spams!');
      }
      // ------------------------------------------------

      // --- VERIFICAÇÃO DE PALAVRAS IMPRÓPRIAS ---
      const textoMinusculo = legenda.toLowerCase();
      const temPalavrao = PALAVROES.some(palavra => textoMinusculo.includes(palavra));
      // ------------------------------------------

      let mediaUrls: string[] = [];
      let pollOptions = null;

      if (tipoPost === 'imagem') {
        for (const file of files) {
          const result = await uploadImagemModerada(file);
          
          if (!result.success) {
            throw new Error(result.error);
          }
          
          if (result.url) {
            mediaUrls.push(result.url);
          }
        }
      } else {
        pollOptions = [opcao1.trim(), opcao2.trim()];
      }

      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: mediaUrls[0] || null, 
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: tipoPost === 'enquete' ? 'poll' : (mediaUrls.length > 0 ? 'image' : 'text'), 
        caption: legenda,
        is_ranking: isRanking && mediaUrls.length > 0,
        is_poll: tipoPost === 'enquete',
        poll_options: pollOptions,
        tem_palavrao: temPalavrao // <-- Nova coluna
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

        <div className="flex p-4 pb-0 gap-2">
          <button
            onClick={() => setTipoPost('imagem')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
              tipoPost === 'imagem' ? 'bg-accent text-white' : 'bg-bg text-muted hover:text-text'
            }`}
          >
            <ImageIcon size={16} /> Imagem / Texto
          </button>
          <button
            onClick={() => setTipoPost('enquete')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
              tipoPost === 'enquete' ? 'bg-accent text-white' : 'bg-bg text-muted hover:text-text'
            }`}
          >
            <BarChart2 size={16} /> Enquete
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {erro && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm flex items-start gap-2">
              <ShieldAlert size={20} className="shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <textarea
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder={tipoPost === 'enquete' ? "Qual é a pergunta da enquete?" : "O que você está pensando sobre animes?"}
            rows={3}
            className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent resize-none"
          />

          {tipoPost === 'imagem' ? (
            <>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((preview, index) => {
                    const numeroRanking = previews.length - index;
                    return (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-black group">
                        <Image src={preview} alt={`Preview ${index}`} fill className="object-cover" />
                        
                        {isRanking && (
                          <div className="absolute top-1 left-1 bg-accent text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10 border border-white/20">
                            {numeroRanking}º
                          </div>
                        )}

                        <button 
                          onClick={() => removerImagem(index)}
                          className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-500 transition-colors z-10"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
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
            </>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={opcao1}
                onChange={(e) => setOpcao1(e.target.value)}
                placeholder="Opção 1"
                className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                value={opcao2}
                onChange={(e) => setOpcao2(e.target.value)}
                placeholder="Opção 2"
                className="w-full bg-bg border border-border text-text rounded-xl p-3 focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex flex-col gap-3">
          
          {tipoPost === 'imagem' && (
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
          )}

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
              {loading ? 'Verificando imagem...' : 'Postar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}