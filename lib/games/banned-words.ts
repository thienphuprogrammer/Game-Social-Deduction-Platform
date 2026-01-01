import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class BannedWordsGame extends BaseGame {
  readonly type: GameType = 'banned-words';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 spy (different keyword)
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = `Từ khóa của bạn: ${this.aiContent?.spyKeyword}. Từ cấm: ${this.aiContent?.bannedWords?.join(', ')}. Từ bắt buộc: ${this.aiContent?.requiredWord}`;

    // Rest have main keyword
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Từ khóa: ${this.aiContent?.mainKeyword}. Từ cấm: ${this.aiContent?.bannedWords?.join(', ')}. Từ bắt buộc: ${this.aiContent?.requiredWord}`;
    }

    eligiblePlayers.forEach((p) => {
      players.set(p.id, p);
    });
    this.players = players;
  }

  getPlayerInfo(playerId: string): PlayerGameInfo | null {
    const player = this.players.get(playerId);
    if (!player || player.isHost) return null;

    const bannedStr = this.aiContent?.bannedWords?.join(', ') || '';
    const requiredStr = this.aiContent?.requiredWord || '';

    const baseInfo: PlayerGameInfo = {
      promptTemplate: this.aiContent?.promptTemplate || 'Mô tả ___ bằng 1 câu',
      hints: [
        `🚫 Từ CẤM: ${bannedStr}`,
        `✅ Từ BẮT BUỘC phải có: ${requiredStr}`,
      ],
    };

    if (player.role === 'spy') {
      baseInfo.topic = this.aiContent?.spyKeyword;
      baseInfo.hints.unshift('Bạn là SPY!');
      baseInfo.hints.push(`Từ khóa của bạn: ${this.aiContent?.spyKeyword}`);
      baseInfo.hints.push('Cố gắng không lộ từ khóa khác biệt!');
    } else {
      baseInfo.topic = this.aiContent?.mainKeyword;
      baseInfo.hints.unshift(`Từ khóa: ${this.aiContent?.mainKeyword}`);
      baseInfo.hints.push('Tìm người có từ khóa khác hoặc né từ cấm gượng gạo!');
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
      secretInfo: `Nhóm: "${this.aiContent?.mainKeyword}". Spy: "${this.aiContent?.spyKeyword}". Cấm: ${this.aiContent?.bannedWords?.join(', ')}. Bắt buộc: ${this.aiContent?.requiredWord}`,
      constraints: {
        normal: `Từ khóa: ${this.aiContent?.mainKeyword}`,
        spy: `Từ khóa: ${this.aiContent?.spyKeyword}`,
        culprit: '',
        accomplice: '',
        saboteur: '',
        liar: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check banned words
    if (this.aiContent?.bannedWords) {
      for (const word of this.aiContent.bannedWords) {
        if (lowerContent.includes(word.toLowerCase())) {
          violations.push(`Đã dùng từ CẤM: "${word}"`);
        }
      }
    }

    // Check required word
    if (this.aiContent?.requiredWord) {
      if (!lowerContent.includes(this.aiContent.requiredWord.toLowerCase())) {
        violations.push(`Thiếu từ BẮT BUỘC: "${this.aiContent.requiredWord}"`);
      }
    }

    return { valid: violations.length === 0, violations };
  }
}

