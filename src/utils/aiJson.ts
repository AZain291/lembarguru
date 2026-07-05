import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Dipakai oleh route generator alat bantu guru (src/app/api/generate-*/route.ts)
// yang butuh Claude mengembalikan JSON terstruktur, bukan teks bebas seperti
// /api/generate (generator soal utama).
export async function generateJSON<T>(prompt: string, maxTokens: number): Promise<{ hasil: T; totalTokens: number }> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const totalTokens = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)

  // Claude kadang tetap membungkus JSON dengan ```json ... ``` walau diminta tidak -- lucuti kalau ada.
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  const hasil = JSON.parse(cleaned) as T
  return { hasil, totalTokens }
}
