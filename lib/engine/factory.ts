import { GameType, AIGameContent } from '../games/types';
import { BaseGame } from '../games/base';
import { AlibiGame } from '../games/alibi';
import { PerspectiveGame } from '../games/perspective';
import { TruthConstraintGame } from '../games/truth-constraint';
import { ChainGame } from '../games/chain';
import { BannedWordsGame } from '../games/banned-words';
import { AnswerFilterGame } from '../games/answer-filter';

export function createGame(gameType: GameType, aiContent: AIGameContent): BaseGame {
  switch (gameType) {
    case 'alibi':
      return new AlibiGame(aiContent);
    case 'perspective':
      return new PerspectiveGame(aiContent);
    case 'truth-constraint':
      return new TruthConstraintGame(aiContent);
    case 'chain':
      return new ChainGame(aiContent);
    case 'banned-words':
      return new BannedWordsGame(aiContent);
    case 'answer-filter':
      return new AnswerFilterGame(aiContent);
    default:
      throw new Error(`Unknown game type: ${gameType}`);
  }
}

