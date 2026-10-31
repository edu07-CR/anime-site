import { DestaquesClient } from './DestaquesClient';

// Define o tempo de cache (Revalidação) para não bater na API a cada acesso
export const revalidate = 21600; // 6 horas

export default async function DestaquesPage() {
  let dataInicial = { doDia: [], daSemana: [], daTemporada: [] };

  try {
    // Fazemos o fetch direto na API interna.
    // O Next.js vai cachear isso. Em produção, coloque a URL completa do seu site no env, 
    // mas para evitar erros em localhost, usamos um fallback.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const res = await fetch(`${baseUrl}/api/destaques`, {
      next: { revalidate: 21600 } 
    });
    
    if (res.ok) {
      dataInicial = await res.json();
    }
  } catch (error) {
    console.error("Erro ao carregar destaques no servidor:", error);
  }

  // Renderiza o componente de cliente passando os dados já carregados (SSR)
  return <DestaquesClient data={dataInicial} />;
}