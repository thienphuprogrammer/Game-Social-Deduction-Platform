import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class TwoLayerGame extends BaseGame {
  readonly type: GameType = 'two-layer';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    const scaleMin = this.aiContent?.scaleMin || 1;
    const scaleMax = this.aiContent?.scaleMax || 5;
    const availableLevels = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => i + scaleMin);

    // Assign 1 spy with "off-scale" level
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = `Bạn là SPY! Mức của bạn: ${this.aiContent?.spyLevel || 'Không có mức'} (lạc thang)`;

    // Distribute levels to normal players
    for (let i = 1; i < eligiblePlayers.length; i++) {
      const level = availableLevels[Math.floor(Math.random() * availableLevels.length)];
      const description = this.aiContent?.scaleValues?.find(v => v.level === level)?.description || `Mức ${level}`;
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Mức của bạn: ${level} - ${description}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Mô tả mức độ của bạn bằng 1 câu (không nói số)',
      hints: [],
    };

    if (player.role === 'spy') {
      baseInfo.hints = [
        'Bạn là SPY!',
        `${player.privateInfo}`,
        'Cố gắng mô tả sao cho giống nhóm nhưng đừng quá rõ ràng!',
      ];
    } else {
      baseInfo.topic = this.aiContent?.topic;
      baseInfo.hints = [
        `Chủ đề: ${this.aiContent?.topic}`,
        `${player.privateInfo}`,
        'Mô tả đúng mức của bạn, không nói số!',
        'Tìm người mô tả "lệch hệ"!',
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
      secretInfo: `Chủ đề: ${this.aiContent?.topic}. Thang: ${this.aiContent?.scaleMin}-${this.aiContent?.scaleMax}. Spy: ${this.aiContent?.spyLevel}`,
      constraints: {
        normal: 'Mô tả đúng mức của mình',
        spy: 'Mức lạc thang - cố blend in',
        culprit: '',
        accomplice: '',
        saboteur: '',
        liar: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    
    // Check if player accidentally revealed their number
    const scaleMin = this.aiContent?.scaleMin || 1;
    const scaleMax = this.aiContent?.scaleMax || 5;
    
    for (let i = scaleMin; i <= scaleMax; i++) {
      if (content.match(new RegExp(`\\b${i}\\b`))) {
        violations.push(`Không được nói số mức (${i})`);
      }
    }

    return { valid: violations.length === 0, violations };
  }
}
