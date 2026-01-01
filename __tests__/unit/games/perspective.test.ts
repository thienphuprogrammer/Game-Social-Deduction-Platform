import { PerspectiveGame } from '@/lib/games/perspective';
import { Player, AIGameContent } from '@/lib/games/types';

describe('PerspectiveGame', () => {
  let game: PerspectiveGame;
  let players: Map<string, Player>;

  const mockContent: AIGameContent = {
    topic: 'Vacation',
    mainTopic: 'Du lịch biển',
    spyTopic: 'Cắm trại',
    mainPerspective: 'Nghỉ ngơi, bãi biển, resort',
    spyPerspective: 'Tự túc, ngoài trời, lều trại',
    hints: ['Pay attention to perspective differences'],
  };

  beforeEach(() => {
    game = new PerspectiveGame(mockContent);
    players = createMockPlayers(5);
  });

  describe('assignRoles', () => {
    it('should assign exactly one spy', () => {
      game.setup(players);
      
      const playersWithRoles = Array.from(game.getPlayers().values());
      const spies = playersWithRoles.filter(p => p.role === 'spy');
      
      expect(spies.length).toBe(1);
    });

    it('should assign rest as normal', () => {
      game.setup(players);
      
      const playersWithRoles = Array.from(game.getPlayers().values()).filter(p => !p.isHost);
      const normals = playersWithRoles.filter(p => p.role === 'normal');
      
      // 4 non-host players, 1 spy, so 3 normals
      expect(normals.length).toBe(3);
    });

    it('should give spy different topic', () => {
      game.setup(players);
      
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      
      expect(spy!.privateInfo).toContain('Cắm trại');
    });

    it('should give normal players main topic', () => {
      game.setup(players);
      
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      
      expect(normal).toBeDefined();
      expect(normal!.privateInfo).toBeDefined();
      expect(normal!.privateInfo).toContain('Du lịch');
    });
  });

  describe('getPlayerInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should return spy topic for spy', () => {
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      const info = game.getPlayerInfo(spy!.id);
      
      expect(info!.topic).toBe('Cắm trại');
      expect(info!.hints).toContainEqual(expect.stringContaining('SPY'));
    });

    it('should return main topic for normal player', () => {
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      expect(normal).toBeDefined();
      
      const info = game.getPlayerInfo(normal!.id);
      expect(info).toBeDefined();
      expect(info!.topic).toBe('Du lịch biển');
    });
  });

  describe('getHostInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should show both topics', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.secretInfo).toContain('Du lịch biển');
      expect(hostInfo.secretInfo).toContain('Cắm trại');
    });

    it('should show all player roles', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.allRoles.length).toBe(4); // 4 non-host players
      expect(hostInfo.allRoles.some(r => r.role === 'spy')).toBe(true);
    });
  });

  describe('validateMessage', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should allow any message (no strict rules)', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Any random message');
      
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
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

