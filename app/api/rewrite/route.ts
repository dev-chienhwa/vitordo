import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { resume, role } = await req.json()
  if (!resume || !role) {
    return NextResponse.json({ error: 'Missing resume or role' }, { status: 400 })
  }

  const prompt = `You are a resume rewriting expert. Help job seekers rewrite their resume for a specific role.\n\nOriginal Resume: ${resume}\n\nTarget Role: ${role}\n\nInstructions:\nUse STAR method (Situation, Task, Action, Result) if applicable\nUse strong verbs and industry language\nTailor content to the target role using keywords\nQuantify impact where possible\nImprove clarity, remove filler, and sound professional\nOutput in clean plain text.`

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    })
    const text = chat.choices[0].message?.content || ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to contact OpenAI' }, { status: 500 })
  }
}
