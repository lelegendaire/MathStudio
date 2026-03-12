import { parseInput } from '@/lib/mathParser'

export async function POST(request) {
  const { input } = await request.json()
  const result = parseInput(input.trim())
  return Response.json({ result })
}