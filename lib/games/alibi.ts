import { BaseGame } from './base';
import {
  GameType,
  Player,
  PlayerRole,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
} from './types';

export class AlibiGame extends BaseGame {
  readonly type: GameType = 'alibi';

  assignRoles(players: Map<string, Player>): void {
    const eligiblePlayers = this.selectRandomPlayers(players.size);
    
    if (eligiblePlayers.length < 2) return;

    // Assign culprit
    const culprit = eligiblePlayers[0];
    culprit.role = 'culprit';
    culprit.privateInfo = this.aiContent?.culpritConstraint || 'Không được nhắc đến đồ vật';

    // Assign accomplice if enough players
    if (eligiblePlayers.length >= 4) {
      const accomplice = eligiblePlayers[1];
      accomplice.role = 'accomplice';
      accomplice.privateInfo = this.aiContent?.accompliceConstraint || 'Không được nhắc đến người';
    }

    // Rest are normal
    for (let i = 2; i < eligiblePlayers.length; i++) {
      eligiblePlayers[i].role = 'normal';
      eligiblePlayers[i].privateInfo = undefined;
    }

    // Update players map
    eligiblePlayers.forEach((p) => {
      players.set(p.id, p);
    });
    this.players = players;
  }

  getPlayerInfo(playerId: string): PlayerGameInfo | null {
    const player = this.players.get(playerId);
    if (!player || player.isHost) return null;

    const baseInfo: PlayerGameInfo = {
      promptTemplate: this.aiContent?.alibiTemplate || 'Tôi ở ___ và thấy ___',
      hints: this.aiContent?.hints || [],
    };

    if (player.role === 'culprit') {
      baseInfo.privateConstraint = this.aiContent?.culpritConstraint || 'Bạn là THỦ PHẠM! Không được nhắc đến đồ vật.';
      baseInfo.hints = [
        'Bạn là thủ phạm!',
        'Hãy nói alibi mà KHÔNG nhắc đến bất kỳ đồ vật nào.',
        'Cố gắng blend in với người khác.',
      ];
    } else if (player.role === 'accomplice') {
      baseInfo.privateConstraint = this.aiContent?.accompliceConstraint || 'Bạn là ĐỒNG PHẠM! Không được nhắc đến người.';
      baseInfo.hints = [
        'Bạn là đồng phạm!',
        'Hãy nói alibi mà KHÔNG nhắc đến bất kỳ người nào.',
        'Bảo vệ thủ phạm bằng cách blend in.',
      ];
    } else {
      baseInfo.hints = [
        `Vụ án: ${this.aiContent?.scenario || 'Có vật bị mất'}`,
        'Quan sát xem ai né từ một cách kỳ lạ.',
        'Thủ phạm sẽ không nhắc đồ vật, đồng phạm không nhắc người.',
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
      secretInfo: `Vụ án: ${this.aiContent?.scenario || 'Không xác định'}. Vật bị mất: ${this.aiContent?.stolenItem || 'Không xác định'}`,
      constraints: {
        culprit: this.aiContent?.culpritConstraint || 'Không nhắc đồ vật',
        accomplice: this.aiContent?.accompliceConstraint || 'Không nhắc người',
        normal: 'Nói bình thường',
        spy: '',
        saboteur: '',
      },
    };
  }

  validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] } {
    const player = this.players.get(playerId);
    if (!player) return { valid: false, violations: ['Player not found'] };

    const violations: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for object words if culprit
    if (player.role === 'culprit') {
      const objectPatterns = [
        'cái', 'chiếc', 'đồ', 'vật', 'bánh', 'túi', 'điện thoại', 'laptop', 'xe', 'chai',
        'ly', 'cốc', 'bút', 'sách', 'vở', 'đồng hồ', 'ví', 'tiền', 'thẻ', 'chìa khóa',
      ];
      for (const pattern of objectPatterns) {
        if (lowerContent.includes(pattern)) {
          violations.push(`Đã nhắc đến đồ vật: "${pattern}"`);
        }
      }
    }

    // Check for person words if accomplice
    if (player.role === 'accomplice') {
      const personPatterns = [
        'ai', 'người', 'anh', 'chị', 'em', 'ông', 'bà', 'cô', 'chú', 'thằng',
        'con', 'bạn', 'họ', 'ta', 'mình', 'tụi', 'nhóm', 'đám',
      ];
      for (const pattern of personPatterns) {
        if (lowerContent.includes(pattern)) {
          violations.push(`Đã nhắc đến người: "${pattern}"`);
        }
      }
    }

    return { valid: violations.length === 0, violations };
  }
}

