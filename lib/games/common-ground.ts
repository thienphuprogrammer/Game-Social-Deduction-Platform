import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class CommonGroundGame extends BaseGame {
  readonly type: GameType = 'common-ground';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 spy
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = `Bạn là SPY! Đặc điểm của bạn: ${this.aiContent?.spyTrait || 'Đặc điểm khác'}. Cố nói không thuộc cả hai nhóm nhưng giống họ!`;

    // Rest are normal with common traits
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      const traits = this.aiContent?.commonTraits?.join(' hoặc ') || 'Nhóm A hoặc B';
      eligiblePlayers[i].privateInfo = `Bạn thuộc: ${traits}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Tôi thuộc nhóm ___ hoặc ___',
      hints: [],
    };

    if (player.role === 'spy') {
      baseInfo.hints = [
        'Bạn là SPY!',
        `Đặc điểm của bạn: ${this.aiContent?.spyTrait}`,
        'Bạn KHÔNG thuộc các nhóm chung',
        'Cố gắng nói sao cho không bị phát hiện!',
      ];
    } else {
      baseInfo.topic = this.aiContent?.topic;
      baseInfo.hints = [
        `Chủ đề: ${this.aiContent?.topic}`,
        `${player.privateInfo}`,
        'Nói theo format: "Tôi thuộc nhóm A hoặc B"',
        'Tìm người "không khớp" với đa số!',
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
      secretInfo: `Chủ đề: ${this.aiContent?.topic}. Nhóm: ${this.aiContent?.commonTraits?.join(', ')}. Spy: ${this.aiContent?.spyTrait}`,
      constraints: {
        normal: `Thuộc: ${this.aiContent?.commonTraits?.join(' hoặc ')}`,
        spy: `Đặc điểm: ${this.aiContent?.spyTrait}`,
        culprit: '',
        accomplice: '',
        saboteur: '',
        liar: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    // No strict validation - observational game
    return { valid: true, violations: [] };
  }
}
