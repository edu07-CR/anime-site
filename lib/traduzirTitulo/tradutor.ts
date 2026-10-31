async function traduzirTitulo(texto: string) {
  const API_KEY = process.env.GROQ_API_KEY; 
  if (!API_KEY) return texto; // Se não tiver chave, retorna o original

  const prompt = `
    Avalie o seguinte título de anime: "${texto}".
    Regras:
    1. Se o título já for universalmente conhecido em inglês ou for um nome próprio (ex: "Black Clover", "Dragon Ball", "Naruto"), retorne o título EXATAMENTE como está.
    2. Se o título for em japonês (romaji) ou tiver uma tradução clara e comum em português (ex: "Shingeki no Kyojin" -> "Ataque dos Titãs"), retorne APENAS a tradução em português.
    3. Não adicione explicações, apenas o título final.
  `;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({ 
        model: "openai/gpt-oss-20b", 
        messages: [
          { role: "system", content: "Você é um especialista em animes e tradução de títulos." },
          { role: "user", content: prompt }
        ], 
        temperature: 0.1 // Baixa temperatura para ser mais direto
      })
    });
    
    if (!res.ok) throw new Error('Falha na API');
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || texto;
  } catch (error) {
    return texto; // Se der erro, retorna o original
  }
}