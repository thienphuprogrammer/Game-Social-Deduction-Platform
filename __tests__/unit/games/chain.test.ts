import { ChainGame } from '@/lib/games/chain';
import { Player, AIGameContent } from '@/lib/games/types';

describe('ChainGame', () => {
  let game: ChainGame;
  let players: Map<string, Player>;

  const mockContent: AIGameContent = {
    topic: 'Climate Change',
    topicDescription: 'Các nguyên nhân và hậu quả của biến đổi khí hậu',
    promptTemplate: 'Vì ___ nên ___, dẫn đến ___',
    keyLogicPoints: ['CO2', 'Nhiệt độ', 'Băng tan'],
    hints: ['Follow the logical chain'],
  };

  beforeEach(() => {
    game = new ChainGame(mockContent);
    players = createMockPlayers(5);
  });

  describe('assignRoles', () => {
    it('should assign exactly one spy who doesnt know topic', () => {
      game.setup(players);
      
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      expect(spy).toBeDefined();
      expect(spy!.privateInfo).toContain('KHÔNG biết');
    });

    it('should give normal players the topic', () => {
      game.setup(players);
      
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      expect(normal).toBeDefined();
      expect(normal!.privateInfo).toBeDefined();
      expect(normal!.privateInfo).toContain('Climate Change');
    });
  });

  describe('getPlayerInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should tell spy to use general logic', () => {
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      const info = game.getPlayerInfo(spy!.id);
      
      expect(info!.hints).toContainEqual(expect.stringContaining('KHÔNG biết'));
    });

    it('should give normal player topic and logic points', () => {
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      expect(normal).toBeDefined();
      
      const info = game.getPlayerInfo(normal!.id);
      expect(info).toBeDefined();
      expect(info!.topic).toBe('Climate Change');
    });
  });

  describe('validateMessage', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should accept message with chain format', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Vì CO2 tăng nên nhiệt độ tăng dẫn đến băng tan');
      
      expect(result.valid).toBe(true);
    });

    it('should reject message without chain format', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Thời tiết hôm nay đẹp quá');
      
      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('chuỗi logic'));
    });

    it('should accept alternative chain keywords', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'vì mưa nhiều nên lũ lụt làm cho nhà bị ngập');
      
      expect(result.valid).toBe(true);
    });
  });
});

function createMockPlayers(count: number): Map<string, Player> {
  const players = new Map<string, Player>();
  
  players.set('host-id', {
    id: 'host-id',
    name: 'Host',
    isHost: true,
    role: 'normal',
    messages: [],
  });

  for (let i = 0; i < count - 1; i++) {
    const id = `player-${i}`;
    players.set(id, {
      id,
      name: `Player ${i + 1}`,
      isHost: false,
      role: 'normal',
      messages: [],
    });
  }

  return players;
}

