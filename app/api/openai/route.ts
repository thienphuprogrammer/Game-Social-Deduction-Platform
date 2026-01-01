import { NextRequest, NextResponse } from 'next/server';
import { generateGameContent, regenerateGameContent } from '@/lib/openai/client';
import { GameType, AIGameContent } from '@/lib/games/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gameType, playerCount, options, previousContent, feedback } = body;

    if (!gameType) {
      return NextResponse.json({ error: 'Game type is required' }, { status: 400 });
    }

    let aiContent: AIGameContent;

    if (action === 'regenerate' && previousContent) {
      aiContent = await regenerateGameContent(
        gameType as GameType,
        playerCount || 6,
        previousContent,
        feedback
      );
    } else {
      aiContent = await generateGameContent(
        gameType as GameType,
        playerCount || 6,
        options
      );
    }

    return NextResponse.json({ aiContent });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

