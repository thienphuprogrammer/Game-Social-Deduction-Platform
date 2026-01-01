import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class AnswerFilterGame extends BaseGame {
  readonly type: GameType = 'answer-filter';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 saboteur
    const saboteur = eligiblePlayers[0];
    saboteur.role = 'saboteur';
    saboteur.privateInfo = `Bạn là KẺ PHÁ! ${this.aiContent?.saboteurHint || 'Đưa câu hỏi gây nhiễu nhưng đừng lộ.'}`;

    // Rest are normal
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = 'Hãy đặt câu hỏi Yes/No để tìm ra quy luật filter!';
    }

    eligiblePlayers.forEach((p) => {
      players.set(p.id, p);
    });
    this.players = players;
  }

  getPlayerInfo(playerId: string): PlayerGameInfo | null {
    const player = this.players.get(playerId);
    if (!player || player.isHost) return null;

    const baseInfo: PlayerGameInfo = {
      promptTemplate: 'Đặt câu hỏi Yes/No về chủ đề',
      hints: [
        `Chủ đề: ${this.aiContent?.topic}`,
        'MC sẽ trả lời Có/Không theo một quy luật bí mật.',
        'Tìm ra quy luật đó!',
      ],
      topic: this.aiContent?.topic,
    };

    if (player.role === 'saboteur') {
      baseInfo.hints = [
        'Bạn là KẺ PHÁ!',
        `Chủ đề: ${this.aiContent?.topic}`,
        this.aiContent?.saboteurHint || 'Đưa câu hỏi gây nhiễu.',
        'Đừng để bị phát hiện!',
      ];
    }

    return baseInfo;
  }

  getHostInfo(): HostGameInfo {
    const allRoles = Array.from(this.players.values())
      .filter((p) => !p.isHost)
      .map((p) => ({
        playerId: p.id,
        playerName: p.name,
        role: p.role,
        privateInfo: p.privateInfo,
      }));

    return {
      allRoles,
      secretInfo: `Chủ đề: ${this.aiContent?.topic}. Filter: ${this.aiContent?.secretFilter}. ${this.aiContent?.filterExplanation}`,
      constraints: {
        normal: 'Tìm quy luật filter',
        saboteur: 'Gây nhiễu',
        spy: '',
        culprit: '',
        accomplice: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check if message is a question
    if (!content.includes('?')) {
      violations.push('Phải là câu hỏi (có dấu ?)');
    }

    return { valid: violations.length === 0, violations };
  }

  // Special method for host to answer based on filter
  evaluateQuestion(question: string): boolean {
    if (!this.aiContent?.secretFilter) return Math.random() > 0.5;

    const filter = this.aiContent.secretFilter.toLowerCase();
    const q = question.toLowerCase();

    // Simple filter patterns
    if (filter.includes('có chữ "m"') || filter.includes('chứa chữ m')) {
      return q.includes('m');
    }
    if (filter.includes('có số')) {
      return /\d/.test(q);
    }
    if (filter.includes('có từ "không"')) {
      return q.includes('không');
    }
    if (filter.includes('số từ chẵn') || filter.includes('số chẵn')) {
      const wordCount = q.split(/\s+/).length;
      return wordCount % 2 === 0;
    }
    if (filter.includes('kết thúc bằng nguyên âm')) {
      const lastChar = q.replace(/[?!.,]/g, '').trim().slice(-1);
      return 'aeiouáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ'.includes(lastChar);
    }

    // Default: random
    return Math.random() > 0.5;
  }

  // Answer a question (called by host)
  answerQuestion(messageId: string, answer: boolean): boolean {
    const message = this.messages.find((m) => m.id === messageId);
    if (!message) return false;

    // Auto-evaluate if answer is not provided
    if (answer === undefined || answer === null) {
      answer = this.evaluateQuestion(message.content);
    }

    message.hostAnswer = answer;
    return true;
  }

  // Get unanswered questions
  getUnansweredQuestions(): Message[] {
    return this.messages.filter(
      (m) => m.content.includes('?') && (m.hostAnswer === undefined || m.hostAnswer === null)
    );
  }
}

