'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Deletar feedback
export async function deletarFeedback(id: string) {
  const supabase = await createClient();
  
  // Verifica se é admin (segurança extra)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');
  
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) throw new Error('Acesso negado');

  const { error } = await supabase.from('feedbacks').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
}

// Marcar como resolvido (alternar status)
export async function toggleResolvido(id: string, isRead: boolean) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');
  
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) throw new Error('Acesso negado');

  const { error } = await supabase.from('feedbacks').update({ is_read: !isRead }).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
}