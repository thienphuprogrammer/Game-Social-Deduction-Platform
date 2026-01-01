import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class ConstraintSpyGame extends BaseGame {
  readonly type: GameType = 'constraint-spy';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 spy who doesn't know the constraint
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = `Bạn là SPY! Bạn không biết luật ràng buộc. Cố gắng nói tự nhiên!`;

    // Rest know the constraint
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Luật: ${this.aiContent?.constraintRule || 'Câu phải có điều kiện đặc biệt'}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Nói 1 câu về chủ đề',
      hints: [],
    };

    if (player.role === 'spy') {
      baseInfo.topic = this.aiContent?.topic;
      baseInfo.hints = [
        'Bạn là SPY!',
        `Chủ đề: ${this.aiContent?.topic}`,
        'Bạn KHÔNG biết luật ràng buộc',
        'Nói tự nhiên và quan sát người khác!',
      ];
    } else {
      baseInfo.topic = this.aiContent?.topic;
      baseInfo.privateConstraint = this.aiContent?.constraintRule;
      baseInfo.hints = [
        `Chủ đề: ${this.aiContent?.topic}`,
        `Luật BẮT BUỘC: ${this.aiContent?.constraintRule}`,
        this.aiContent?.ruleExplanation || '',
        'Ai không tuân thủ luật là SPY!',
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
      secretInfo: `Chủ đề: ${this.aiContent?.topic}. Luật: ${this.aiContent?.constraintRule}. Spy không biết luật.`,
      constraints: {
        normal: `Tuân thủ luật: ${this.aiContent?.constraintRule}`,
        spy: 'Không biết luật ràng buộc',
        culprit: '',
        accomplice: '',
        saboteur: '',
        liar: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const player = this.players.get(playerId);
    const violations: string[] = [];

    if (!player || player.role === 'spy') {
      return { valid: true, violations: [] };
    }

    // Basic validation - Host will need to manually check constraint compliance
    // This is a simplified check
    const rule = this.aiContent?.constraintRule?.toLowerCase() || '';
    
    if (rule.includes('thời gian')) {
      const timeWords = ['hôm nay', 'mai', 'hôm qua', 'lúc', 'khi', 'sáng', 'tối', 'chiều'];
      if (!timeWords.some(word => content.toLowerCase().includes(word))) {
        violations.push('Câu phải có từ chỉ thời gian');
      }
    }
    
    if (rule.includes('so sánh')) {
      const compareWords = ['như', 'hơn', 'giống', 'tương tự', 'khác', 'nhất'];
      if (!compareWords.some(word => content.toLowerCase().includes(word))) {
        violations.push('Câu phải có từ so sánh');
      }
    }

    if (rule.includes('đối lập') || rule.includes('mặc dù')) {
      const contrastWords = ['mặc dù', 'nhưng', 'tuy nhiên', 'song', 'còn'];
      if (!contrastWords.some(word => content.toLowerCase().includes(word))) {
        violations.push('Câu phải có ý đối lập');
      }
    }

    return { valid: violations.length === 0, violations };
  }
}
