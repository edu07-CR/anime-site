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

  // O count: 'exact' garante que sabemos se o banco realmente apagou a linha
  const { error, count } = await supabase
    .from('feedbacks')
    .delete({ count: 'exact' })
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  if (count === 0) throw new Error('Nenhum feedback foi apagado. Verifique as permissões no banco.');

  // A MÁGICA ACONTECE AQUI: Atualiza a rota correta!
  revalidatePath('/admin/feedbacks');
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

  // Atualiza a rota correta
  revalidatePath('/admin/feedbacks');
}