import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class Liar20QGame extends BaseGame {
  readonly type: GameType = 'liar-20q';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 liar
    const liar = eligiblePlayers[0];
    liar.role = 'liar';
    liar.privateInfo = `Bạn là KẺ DỐI! ${this.aiContent?.liarInstruction || 'Phải dối đúng 1 lần trong game'}. Vật bí mật: ${this.aiContent?.mysteryItem || 'Không rõ'}`;

    // Rest are normal
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Vật bí mật: ${this.aiContent?.mysteryItem || 'Không rõ'}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Hỏi câu Yes/No để đoán vật',
      hints: [],
    };

    if (player.role === 'liar') {
      baseInfo.hints = [
        'Bạn là KẺ DỐI!',
        `Vật bí mật: ${this.aiContent?.mysteryItem}`,
        this.aiContent?.liarInstruction || 'Phải dối đúng 1 lần',
        'Đừng để lộ mình là kẻ dối!',
      ];
    } else {
      baseInfo.topic = this.aiContent?.mysteryItem;
      baseInfo.hints = [
        `Vật bí mật: ${this.aiContent?.mysteryItem}`,
        'Hỏi câu Yes/No để thu hẹp phạm vi',
        'Tìm mâu thuẫn trong câu trả lời!',
        'Có 1 người sẽ dối 1 lần',
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
      secretInfo: `Vật bí mật: ${this.aiContent?.mysteryItem}. ${this.aiContent?.itemDescription || ''}`,
      constraints: {
        normal: 'Trả lời trung thực',
        liar: 'Phải dối đúng 1 lần',
        spy: '',
        culprit: '',
        accomplice: '',
        saboteur: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    // Check if it's a Yes/No question format
    const isQuestion = content.includes('?') || 
                       content.toLowerCase().startsWith('có') ||
                       content.toLowerCase().startsWith('là') ||
                       content.toLowerCase().startsWith('phải');
    
    if (!isQuestion) {
      violations.push('Phải là câu hỏi Yes/No');
    }

    return { valid: violations.length === 0, violations };
  }
}
