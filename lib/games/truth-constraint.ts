import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class TruthConstraintGame extends BaseGame {
  readonly type: GameType = 'truth-constraint';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 spy (doesn't know the fact)
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = `Chủ đề: ${this.aiContent?.topic}. Bạn KHÔNG biết fact bí mật!`;

    // Rest know the fact
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Fact bí mật: ${this.aiContent?.secretFact}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Mô tả ___ bằng 1 câu',
      hints: [],
      topic: this.aiContent?.topic,
    };

    if (player.role === 'spy') {
      baseInfo.hints = [
        'Bạn là SPY!',
        `Chủ đề: ${this.aiContent?.topic}`,
        'Bạn KHÔNG biết fact bí mật của nhóm.',
        'Cố gắng nói chung chung để không lộ!',
      ];
    } else {
      baseInfo.privateConstraint = this.aiContent?.secretFact;
      baseInfo.hints = [
        `Chủ đề: ${this.aiContent?.topic}`,
        `🔒 Fact bí mật: ${this.aiContent?.secretFact}`,
        `${this.aiContent?.factExplanation}`,
        'Tìm người nói mâu thuẫn với fact!',
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
      secretInfo: `Chủ đề: ${this.aiContent?.topic}. Fact bí mật: ${this.aiContent?.secretFact}`,
      constraints: {
        normal: `Biết fact: ${this.aiContent?.secretFact}`,
        spy: 'Không biết fact bí mật',
        culprit: '',
        accomplice: '',
        saboteur: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const player = this.players.get(playerId);
    if (!player) return { valid: false, violations: ['Player not found'] };

    const violations: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check if spy accidentally uses forbidden words
    if (player.role === 'spy' && this.aiContent?.forbiddenWords) {
      for (const word of this.aiContent.forbiddenWords) {
        if (lowerContent.includes(word.toLowerCase())) {
          violations.push(`Đã dùng từ vi phạm fact: "${word}"`);
        }
      }
    }

    return { valid: violations.length === 0, violations };
  }
}

