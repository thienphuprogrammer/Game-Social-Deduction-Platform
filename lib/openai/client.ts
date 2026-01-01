import OpenAI from 'openai';
import { GameType, AIGameContent } from '../games/types';
import { getPromptForGame } from './prompts';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Please add it to .env.local');
  }
  return new OpenAI({ apiKey });
}

export async function generateGameContent(
  gameType: GameType,
  playerCount: number,
  options?: { theme?: string; difficulty?: 'easy' | 'medium' | 'hard' }
): Promise<AIGameContent> {
  const prompt = getPromptForGame(gameType, playerCount, options);

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là AI tạo nội dung cho game social deduction. Trả về JSON hợp lệ theo format yêu cầu. Luôn trả lời bằng tiếng Việt.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return JSON.parse(content) as AIGameContent;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

export async function regenerateGameContent(
  gameType: GameType,
  playerCount: number,
  previousContent: AIGameContent,
  feedback?: string
): Promise<AIGameContent> {
  const basePrompt = getPromptForGame(gameType, playerCount);
  
  const prompt = `${basePrompt}

Nội dung trước đó:
${JSON.stringify(previousContent, null, 2)}

${feedback ? `Feedback từ Host: ${feedback}` : 'Hãy tạo nội dung MỚI và KHÁC với nội dung trước.'}`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là AI tạo nội dung cho game social deduction. Trả về JSON hợp lệ theo format yêu cầu. Tạo nội dung MỚI khác với nội dung đã cho. Luôn trả lời bằng tiếng Việt.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return JSON.parse(content) as AIGameContent;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

