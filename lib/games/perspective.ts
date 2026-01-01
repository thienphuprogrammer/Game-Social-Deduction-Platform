import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class PerspectiveGame extends BaseGame {
  readonly type: GameType = 'perspective';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 spy
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = `Từ khóa của bạn: ${this.aiContent?.spyTopic || 'Cắm trại'}. Góc nhìn: ${this.aiContent?.spyPerspective || 'Tự túc, ngoài trời'}`;

    // Rest are normal
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Từ khóa: ${this.aiContent?.mainTopic || 'Du lịch'}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Tôi quan tâm nhất là ___',
      hints: [],
    };

    if (player.role === 'spy') {
      baseInfo.topic = this.aiContent?.spyTopic;
      baseInfo.hints = [
        'Bạn là SPY!',
        `Từ khóa của bạn: ${this.aiContent?.spyTopic}`,
        `Góc nhìn: ${this.aiContent?.spyPerspective}`,
        'Cố gắng blend in với nhóm!',
      ];
    } else {
      baseInfo.topic = this.aiContent?.mainTopic;
      baseInfo.hints = [
        `Từ khóa: ${this.aiContent?.mainTopic}`,
        `Góc nhìn nhóm: ${this.aiContent?.mainPerspective}`,
        'Tìm người có góc nhìn "lệch hệ"!',
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
      secretInfo: `Nhóm: "${this.aiContent?.mainTopic}" (${this.aiContent?.mainPerspective}). Spy: "${this.aiContent?.spyTopic}" (${this.aiContent?.spyPerspective})`,
      constraints: {
        normal: `Từ khóa: ${this.aiContent?.mainTopic}`,
        spy: `Từ khóa: ${this.aiContent?.spyTopic}`,
        culprit: '',
        accomplice: '',
        saboteur: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    // No strict validation for perspective game - it's about subtle differences
    return { valid: true, violations: [] };
  }
}

