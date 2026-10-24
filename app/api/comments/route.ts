import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 1. Buscar comentários de um anime
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const animeId = searchParams.get('animeId');

  if (!animeId) return NextResponse.json({ error: 'ID do anime é obrigatório' }, { status: 400 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      has_spoiler,
      created_at,
      user_id,
      profiles (username)
    `)
    .eq('anime_id', animeId)
    .order('created_at', { ascending: false }); // Mais recentes primeiro

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}