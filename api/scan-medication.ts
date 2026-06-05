import type { VercelRequest, VercelResponse } from '@vercel/node'

interface ScanRequestBody {
  imageBase64?: string
  mimeType?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}

interface ParsedLabel {
  medicationName: string
  dosage: string
  notes: string
  suggestedFrequencyHours: number | null
}

const MODEL = 'gemini-2.5-flash'
const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const buildPrompt = () => `You are reading a medication package or prescription label for a children's health tracker app.

Extract only what is clearly visible on the label. Return JSON with these fields:
- medicationName: brand or generic name (string)
- dosage: strength or form on the label, e.g. "160 mg/5 ml" or "250 mg tablets" (string)
- notes: short instructions or warnings from the label (string, empty if none)
- suggestedFrequencyHours: if the label clearly states an interval like "every 6 hours", return that number; otherwise null

Do not guess child-specific doses. If unsure, use empty strings and null.`

const parseModelJson = (text: string): ParsedLabel => {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(cleaned) as Partial<ParsedLabel>

  const frequency = parsed.suggestedFrequencyHours
  const validFrequencies = [4, 6, 8, 12, 24]

  return {
    medicationName: typeof parsed.medicationName === 'string' ? parsed.medicationName : '',
    dosage: typeof parsed.dosage === 'string' ? parsed.dosage : '',
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    suggestedFrequencyHours:
      typeof frequency === 'number' && validFrequencies.includes(frequency) ? frequency : null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'Label scan is not configured. Add GEMINI_API_KEY to your Vercel environment variables.'
    })
  }

  const body = req.body as ScanRequestBody
  const imageBase64 = body.imageBase64?.trim()
  const mimeType = body.mimeType?.trim() || 'image/jpeg'

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing image data' })
  }

  if (!mimeType.startsWith('image/')) {
    return res.status(400).json({ error: 'Invalid image type' })
  }

  const byteLength = Buffer.byteLength(imageBase64, 'base64')
  if (byteLength > MAX_IMAGE_BYTES) {
    return res.status(413).json({ error: 'Image is too large. Try a smaller photo.' })
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildPrompt() },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    })

    const payload = (await geminiResponse.json()) as GeminiResponse

    if (!geminiResponse.ok) {
      const message = payload.error?.message ?? 'Gemini API request failed'
      const status = geminiResponse.status === 429 ? 429 : 502
      return res.status(status).json({ error: message })
    }

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return res.status(502).json({ error: 'No label details returned from vision model' })
    }

    const result = parseModelJson(text)
    return res.status(200).json(result)
  } catch (error) {
    console.error('scan-medication error', error)
    return res.status(500).json({ error: 'Failed to scan medication label' })
  }
}
