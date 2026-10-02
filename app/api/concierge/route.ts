import { NextResponse } from 'next/server';
import { runShoppingConcierge } from '../../../modules/experience/concierge/engine';
export async function POST(request: Request) { const body = await request.json(); return NextResponse.json(runShoppingConcierge({ query:String(body.query ?? ''), budget: body.budget ? Number(body.budget) : undefined, currency:String(body.currency ?? 'EGP'), deadline: body.deadline ? String(body.deadline) : undefined, priorities:Array.isArray(body.priorities) ? body.priorities : [] })); }
