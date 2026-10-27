'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deletarPost(postId: string, mediaUrls: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Não autorizado');

  // 1. Verifica se o post pertence ao usuário (ou se ele é admin)
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (post?.user_id !== user.id && !profile?.is_admin) {
    throw new Error('Você não tem permissão para deletar este post.');
  }

  // 2. Deleta as imagens do Storage
  if (mediaUrls && mediaUrls.length > 0) {
    // Pega o nome do arquivo a partir da URL pública
    const fileNames = mediaUrls.map(url => url.split('/').pop()).filter(Boolean) as string[];
    await supabase.storage.from('feed_media').remove(fileNames);
  }

  // 3. Deleta o post do banco (as curtidas e comentários vão junto por causa do ON DELETE CASCADE)
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  
  if (error) throw new Error('Erro ao deletar o post.');

  revalidatePath('/feed');
  return { success: true };
}