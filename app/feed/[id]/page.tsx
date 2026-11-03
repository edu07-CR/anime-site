import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { deletarPost } from '@/app/actions/posts';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ProfileData {
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
}

interface PostData {
  id: string;
  user_id: string;
  media_url: string | null;
  media_urls: string[] | null;
  media_type: string;
  caption: string | null;
  has_spoiler: boolean;
  created_at: string;
  is_ranking: boolean;
  is_poll: boolean;
  poll_options: any;
  profiles: ProfileData | null;
}

export default async function PostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // 1. Pega o usuário logado (VOCÊ)
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Busca o post e o perfil do DONO do post
  const { data: post } = await supabase
    .from('posts')
    .select(`
      id, user_id, media_url, media_urls, media_type, caption, has_spoiler, created_at, is_ranking, is_poll, poll_options,
      profiles (username, avatar_url, is_admin)
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (!post) {
    return notFound();
  }

  const typedPost = post as unknown as PostData;
  const profileDono = typedPost.profiles;
  const imagens = typedPost.media_urls || (typedPost.media_url ? [typedPost.media_url] : []);

  // 3. VERIFICAÇÃO DE PERMISSÃO
  const isDono = user?.id === typedPost.user_id;

  // Busca o perfil do usuário LOGADO para ver se ele é admin
  let isAdmin = false;
  if (user) {
    const { data: meuPerfil } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    isAdmin = meuPerfil?.is_admin || false;
  }

  const podeDeletar = isDono || isAdmin;

  // Server Action para deletar
  async function deletarAction() {
    'use server';
    await deletarPost(typedPost.id, typedPost.media_urls || []);
    redirect('/feed');
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      <Link href="/feed" className="flex items-center gap-2 text-accent hover:underline mb-6">
        <ArrowLeft size={18} /> Voltar para o Feed
      </Link>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Cabeçalho do Post */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-border">
            {profileDono?.avatar_url ? (
              <Image src={profileDono.avatar_url} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                {profileDono?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <Link href={`/perfil/${profileDono?.username || ''}`} className="font-bold text-text hover:text-accent">
              {profileDono?.username || 'Usuário'}
            </Link>
            <p className="text-xs text-muted">
              {new Date(typedPost.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* BOTÃO DE EXCLUIR (SÓ APARECE SE PUDER) */}
          {podeDeletar && (
            <form action={deletarAction}>
              <button 
                type="submit" 
                className="text-muted hover:text-red-500 transition-colors p-2"
                title="Excluir post"
              >
                <Trash2 size={20} />
              </button>
            </form>
          )}
        </div>

        {/* Imagem */}
        {imagens.length > 0 && (
          <div className="relative aspect-square bg-black">
            <Image src={imagens[0]} alt="Post" fill className="object-cover" />
          </div>
        )}

        {/* Texto */}
        {typedPost.caption && (
          <div className="p-4">
            <p className="text-text whitespace-pre-wrap">{typedPost.caption}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="p-4 border-t border-border flex items-center gap-4 text-muted text-sm">
          <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
            <Heart size={18} /> Curtir
          </button>
          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageCircle size={18} /> Comentar
          </button>
          <button className="flex items-center gap-1 hover:text-accent transition-colors ml-auto">
            <Share2 size={18} /> Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}