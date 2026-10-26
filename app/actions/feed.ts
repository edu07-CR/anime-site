'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleLike(postId: string, isLiked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autorizado')

  if (isLiked) {
    await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id })
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
  }

  revalidatePath('/feed')
}