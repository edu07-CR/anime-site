import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CarrosselImagens } from '@/components/feed/CarrosselImagens';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .eq('id', params.id)
    .single();

  if (!post) return notFound();

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      <Link href="/feed" className="flex items-center gap-2 text-muted hover:text-accent mb-6">
        <ArrowLeft size={20} /> Voltar para o Feed
      </Link>
      
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-border">
            {post.profiles?.avatar_url ? (
              <Image src={post.profiles.avatar_url} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold">{post.profiles?.username?.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div>
            <Link href={`/perfil/${post.profiles?.username}`} className="font-bold text-text hover:text-accent">
              {post.profiles?.username}
            </Link>
          </div>
        </div>

        {/* Carrossel */}
        <CarrosselImagens imagens={post.media_urls || (post.media_url ? [post.media_url] : [])} isRanking={post.is_ranking} />

        {/* Legenda */}
        {post.caption && (
          <div className="p-4">
            <p className="text-text">{post.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}