import { NextResponse } from 'next/server';
import { chatRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const { success, reset, limit, remaining } = await chatRateLimit.limit(userId);

    return NextResponse.json({ success, reset, limit, remaining });
  } catch (error) {
    console.error("Erro no rate limit:", error);
    // Se o Redis falhar, deixa passar para não travar o chat
    return NextResponse.json({ success: true, reset: 0, limit: 0, remaining: 0 });
  }
}