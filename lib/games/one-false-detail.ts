import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class OneFalseDetailGame extends BaseGame {
  readonly type: GameType = 'one-false-detail';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 spy
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = `Bạn là SPY! Mô tả: ${this.aiContent?.truthDescription || 'Mô tả chung'}. Bạn phải SAI đúng 1 chi tiết!`;

    // Rest are normal
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Mô tả: ${this.aiContent?.truthDescription || 'Mô tả chung'}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Mô tả địa điểm/vật bằng 1 câu',
      hints: [],
    };

    if (player.role === 'spy') {
      baseInfo.hints = [
        'Bạn là SPY!',
        `Mô tả chung: ${this.aiContent?.truthDescription}`,
        'BẮT BUỘC: Sai đúng 1 chi tiết (màu sắc, số lượng, thời gian, vị trí, v.v.)',
        `Các loại chi tiết: ${this.aiContent?.detailCategories?.join(', ') || 'màu, số, thời gian, vị trí'}`,
      ];
    } else {
      baseInfo.topic = this.aiContent?.topic;
      baseInfo.hints = [
        `Chủ đề: ${this.aiContent?.topic}`,
        `Mô tả đúng: ${this.aiContent?.truthDescription}`,
        'Mô tả chính xác các chi tiết!',
        'Tìm người có 1 chi tiết sai!',
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
      secretInfo: `Mô tả đúng: ${this.aiContent?.truthDescription}. Spy phải sai 1 chi tiết.`,
      constraints: {
        normal: 'Mô tả chính xác',
        spy: 'Sai đúng 1 chi tiết',
        culprit: '',
        accomplice: '',
        saboteur: '',
        liar: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    // Validation is observational - Host needs to check manually
    return { valid: true, violations: [] };
  }
}
