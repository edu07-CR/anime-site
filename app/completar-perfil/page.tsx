'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, User, Check } from 'lucide-react';
import Image from 'next/image';

// Lista de avatares (os mesmos que você já tem)
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

export default function CompletarPerfilPage() {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Se o usuário não estiver logado, manda para o login
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Se ele já tiver um username, manda para a home (já completou)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile?.username) {
        router.push('/');
      }
    };
    checkUser();
  }, [supabase, router]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (username.trim().length < 3) {
      setError('O nome deve ter pelo menos 3 letras.');
      setLoading(false);
      return;
    }

    if (!selectedAvatar) {
      setError('Escolha um avatar para continuar.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Atualiza o perfil no banco
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username: username.trim(),
        avatar_url: selectedAvatar 
      })
      .eq('id', user.id);

    if (error) {
      if (error.code === '23505') { // Erro de username duplicado
        setError('Este nome de usuário já está em uso. Escolha outro.');
      } else {
        setError('Erro ao salvar. Tente novamente.');
      }
      setLoading(false);
    } else {
      // Sucesso! Manda para a home
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Quase lá!</h1>
          <p className="text-muted text-sm">Escolha como você quer ser chamado no AniVerse.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSalvar} className="flex flex-col gap-6">
          <div>
            <label className="text-sm font-semibold text-text mb-2 block">Seu nome de usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Kal"
                required
                className="w-full bg-bg border border-border text-text rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-text mb-2 block">Escolha seu avatar</label>
            <div className="grid grid-cols-4 gap-3">
              {AVATARES.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.image)}
                  className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar.image ? 'border-accent ring-4 ring-accent/20' : 'border-border hover:border-accent/50'
                  }`}
                >
                  <Image src={avatar.image} alt={avatar.name} fill className="object-cover" />
                  {selectedAvatar === avatar.image && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <Check className="text-white drop-shadow-md" size={24} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Começar a usar o AniVerse'}
          </button>
        </form>
      </div>
    </div>
  );
}