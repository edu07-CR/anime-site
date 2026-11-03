'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadImagemModerada(file: File) {
  const supabase = await createClient()

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 1. Cria um FormData para enviar a imagem ao Sightengine
    const formData = new FormData()
    formData.append('media', new Blob([buffer]), file.name)
    formData.append('models', 'nudity-2.1,wad,offensive') // Modelos: Nudez, Armas/Drogas, Ofensivo

    // 2. Chama a API do Sightengine
    const apiUser = process.env.SIGHTENGINE_USER
    const apiSecret = process.env.SIGHTENGINE_SECRET

    if (!apiUser || !apiSecret) {
      throw new Error('Credenciais do Sightengine não configuradas.')
    }

    const response = await fetch(`https://api.sightengine.com/1.0/check.json?api_user=${apiUser}&api_secret=${apiSecret}`, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.status !== 'success') {
      throw new Error('Falha na análise do Sightengine.')
    }

    // 3. Verifica os níveis de confiança (de 0 a 1)
    // Consideramos bloqueado se a probabilidade for maior que 0.5 (50%)
    const isNudez = result.nudity?.sexual_activity > 0.5 || result.nudity?.sexual_display > 0.5 || result.nudity?.erotica > 0.5
    const isArma = result.weapon?.classes?.firearm > 0.5
    const isDroga = result.drugs?.classes?.cannabis > 0.5
    const isOfensivo = result.offensive?.prob > 0.5

    if (isNudez || isArma || isDroga || isOfensivo) {
      return { 
        success: false, 
        error: 'Sua imagem foi bloqueada por conter conteúdo impróprio (nudez, violência, drogas ou conteúdo ofensivo).' 
      }
    }

    // 4. Se passou, faz o upload para o Supabase
    const fileName = `post-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    
    const { error: uploadError } = await supabase.storage
      .from('feed_media')
      .upload(fileName, file)

    if (uploadError) {
      throw new Error(`Falha no upload: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage.from('feed_media').getPublicUrl(fileName)

    return { success: true, url: publicUrl }

  } catch (error: any) {
    console.error("=== ERRO DETALHADO NA MODERAÇÃO (Sightengine) ===")
    console.error(error)
    console.error("=================================================")
    
    return { success: false, error: error.message || 'Erro ao processar a imagem.' }
  }
}