import { BaseGame } from './base';
import {
  GameType,
  Player,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class ChainGame extends BaseGame {
  readonly type: GameType = 'chain';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 1) return;

    // Assign 1 spy (doesn't know topic)
    const spy = eligiblePlayers[0];
    spy.role = 'spy';
    spy.privateInfo = 'Bạn KHÔNG biết chủ đề. Cố gắng nói logic chung chung!';

    // Rest know the topic
    for (let i = 1; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = `Chủ đề: ${this.aiContent?.topic}. ${this.aiContent?.topicDescription}`;
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
      promptTemplate: this.aiContent?.promptTemplate || 'Vì ___ nên ___, dẫn đến ___',
      hints: [],
    };

    if (player.role === 'spy') {
      baseInfo.hints = [
        'Bạn là SPY!',
        'Bạn KHÔNG biết chủ đề.',
        'Nói câu logic theo format nhưng đừng quá cụ thể.',
        'Cố blend in với chuỗi logic của nhóm!',
      ];
    } else {
      baseInfo.topic = this.aiContent?.topic;
      baseInfo.hints = [
        `📌 Chủ đề: ${this.aiContent?.topic}`,
        `${this.aiContent?.topicDescription}`,
        'Nói chuỗi logic liên quan đến chủ đề.',
        'Tìm người nói mơ hồ hoặc đứt mạch logic!',
      ];
      if (this.aiContent?.keyLogicPoints) {
        baseInfo.hints.push(`💡 Điểm logic: ${this.aiContent.keyLogicPoints.join(', ')}`);
      }
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
      secretInfo: `Chủ đề: ${this.aiContent?.topic}. ${this.aiContent?.topicDescription}`,
      constraints: {
        normal: `Biết chủ đề: ${this.aiContent?.topic}`,
        spy: 'Không biết chủ đề',
        culprit: '',
        accomplice: '',
        saboteur: '',
        liar: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check if message follows the chain format
    const hasChainFormat = 
      (content.includes('vì') || content.includes('Vì')) &&
      (content.includes('nên') || content.includes('dẫn đến') || content.includes('làm cho'));

    if (!hasChainFormat) {
      violations.push('Câu chưa theo format chuỗi logic (Vì... nên... dẫn đến...)');
    }

    return { valid: violations.length === 0, violations };
  }
}

