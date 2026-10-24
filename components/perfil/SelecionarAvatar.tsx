'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';

// Lista de avatares disponíveis (adicione ou remova conforme as imagens que você baixou)
const AVATARES = [
  { id: 'aria', name: 'Aria', image: '/avatars/Aria.png' },
  { id: 'astra', name: 'Astra', image: '/avatars/Astra.png' },
  { id: 'ignis', name: 'Ignis', image: '/avatars/Ignis.png' },
  { id: 'kira', name: 'Kira', image: '/avatars/Kira.png' },
  { id: 'koby', name: 'Koby', image: '/avatars/Koby.png' },
  { id: 'maya', name: 'Maya', image: '/avatars/Maya.png' },
  { id: 'nyx', name: 'Nyx', image: '/avatars/Nyx.png' },
  { id: 'orion', name: 'Orion', image: '/avatars/Orion.png' },
];

export function SelecionarAvatar({ avatarAtual }: { avatarAtual?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarAtual || '');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleSelect = async (avatarImage: string) => {
    setLoading(true);
    setSelectedAvatar(avatarImage);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Atualiza a coluna avatar_url no banco
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarImage })
      .eq('id', user.id);

    if (!error) {
      setIsOpen(false);
      router.refresh(); // Atualiza a página para mostrar o novo avatar
    } else {
      alert("Erro ao salvar o avatar. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Botão para abrir o modal (mostra o avatar atual) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-xl hover:border-accent transition-all cursor-pointer group"
        title="Mudar avatar"
      >
        {selectedAvatar ? (
          <Image src={selectedAvatar} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center text-muted group-hover:text-accent">
            +
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-bold">Mudar</span>
        </div>
      </button>

      {/* O Modal de Seleção */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl relative">
            
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-4 right-4 text-muted hover:text-red-400 transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-text mb-2">Escolha seu Avatar</h2>
            <p className="text-muted text-sm mb-6">Selecione o personagem que melhor representa você no AniVerse.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {AVATARES.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelect(avatar.image)}
                  disabled={loading}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                    selectedAvatar === avatar.image ? 'border-accent ring-4 ring-accent/20' : 'border-border hover:border-accent/50'
                  }`}
                >
                  <Image src={avatar.image} alt={avatar.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  
                  {/* Nome do personagem no hover */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">{avatar.name}</span>
                  </div>

                  {/* Loading Icon por cima do selecionado */}
                  {loading && selectedAvatar === avatar.image && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="animate-spin text-accent" size={24} />
                    </div>
                  )}
                </button>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
}