// Exemplo simplificado do que a rota faria
import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  // Chamada para a API da Vercel (endpoint de contagem de visitantes)
  const res = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/count?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const data = await res.json();
  return NextResponse.json(data);
}