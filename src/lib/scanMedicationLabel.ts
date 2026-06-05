export interface MedicationLabelScanResult {
  medicationName: string
  dosage: string
  notes: string
  suggestedFrequencyHours: number | null
}

interface ScanApiResponse {
  medicationName?: string
  dosage?: string
  notes?: string
  suggestedFrequencyHours?: number | null
  error?: string
}

const parseDataUrl = (dataUrl: string): { mimeType: string; imageBase64: string } => {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
  if (!match) {
    throw new Error('Invalid image format')
  }
  return { mimeType: match[1], imageBase64: match[2] }
}

export const scanMedicationLabel = async (dataUrl: string): Promise<MedicationLabelScanResult> => {
  const { mimeType, imageBase64 } = parseDataUrl(dataUrl)

  const response = await fetch('/api/scan-medication', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType })
  })

  const payload = (await response.json()) as ScanApiResponse

  if (!response.ok) {
    throw new Error(payload.error ?? 'Label scan failed')
  }

  return {
    medicationName: payload.medicationName?.trim() ?? '',
    dosage: payload.dosage?.trim() ?? '',
    notes: payload.notes?.trim() ?? '',
    suggestedFrequencyHours:
      typeof payload.suggestedFrequencyHours === 'number' ? payload.suggestedFrequencyHours : null
  }
}
