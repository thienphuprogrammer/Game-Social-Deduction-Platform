import { AlibiGame } from '@/lib/games/alibi';
import { Player, AIGameContent } from '@/lib/games/types';

describe('AlibiGame', () => {
  let game: AlibiGame;
  let players: Map<string, Player>;

  const mockContent: AIGameContent = {
    topic: 'Office Theft',
    scenario: 'A laptop was stolen from the office',
    location: 'Office Building',
    stolenItem: 'Laptop',
    culpritConstraint: 'Không được nhắc đến đồ vật',
    accompliceConstraint: 'Không được nhắc đến người',
    alibiTemplate: 'Tôi ở {location} và thấy {activity}',
    hints: ['Observe who avoids certain topics'],
  };

  beforeEach(() => {
    game = new AlibiGame(mockContent);
    players = createMockPlayers(5);
  });

  describe('assignRoles', () => {
    it('should assign culprit role to one player', () => {
      game.setup(players);
      
      const playersWithRoles = Array.from(game.getPlayers().values());
      const culprits = playersWithRoles.filter(p => p.role === 'culprit');
      
      expect(culprits.length).toBe(1);
    });

    it('should assign accomplice role when 4+ players', () => {
      game.setup(players);
      
      const playersWithRoles = Array.from(game.getPlayers().values());
      const accomplices = playersWithRoles.filter(p => p.role === 'accomplice');
      
      expect(accomplices.length).toBe(1);
    });

    it('should not assign accomplice with less than 4 players', () => {
      const smallPlayers = createMockPlayers(3);
      game.setup(smallPlayers);
      
      const playersWithRoles = Array.from(game.getPlayers().values());
      const accomplices = playersWithRoles.filter(p => p.role === 'accomplice');
      
      expect(accomplices.length).toBe(0);
    });

    it('should set privateInfo for culprit', () => {
      game.setup(players);
      
      const culprit = Array.from(game.getPlayers().values()).find(p => p.role === 'culprit');
      
      expect(culprit).toBeDefined();
      expect(culprit!.privateInfo).toBeDefined();
      expect(culprit!.privateInfo).toContain('Không được nhắc đến đồ vật');
    });
  });

  describe('getPlayerInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should return player info with hints', () => {
      const nonHostPlayer = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      const info = game.getPlayerInfo(nonHostPlayer!.id);
      
      expect(info).toBeDefined();
      expect(info!.promptTemplate).toBeDefined();
      expect(info!.hints).toBeInstanceOf(Array);
    });

    it('should return null for host', () => {
      const host = Array.from(game.getPlayers().values()).find(p => p.isHost);
      const info = game.getPlayerInfo(host!.id);
      
      expect(info).toBeNull();
    });

    it('should include special hints for culprit', () => {
      const culprit = Array.from(game.getPlayers().values()).find(p => p.role === 'culprit');
      const info = game.getPlayerInfo(culprit!.id);
      
      expect(info!.hints).toContainEqual(expect.stringContaining('thủ phạm'));
    });
  });

  describe('getHostInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should return all player roles', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.allRoles).toBeInstanceOf(Array);
      expect(hostInfo.allRoles.length).toBeGreaterThan(0);
    });

    it('should include secret info about the crime', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.secretInfo).toContain('Vụ án');
      expect(hostInfo.secretInfo).toContain('Laptop');
    });

    it('should include constraints for each role', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.constraints.culprit).toBeDefined();
      expect(hostInfo.constraints.accomplice).toBeDefined();
    });
  });

  describe('validateMessage', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should flag culprit mentioning object words', () => {
      const culprit = Array.from(game.getPlayers().values()).find(p => p.role === 'culprit');
      
      const result = game.validateMessage(culprit!.id, 'Tôi đang xem cái điện thoại');
      
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should flag accomplice mentioning person words', () => {
      const accomplice = Array.from(game.getPlayers().values()).find(p => p.role === 'accomplice');
      if (!accomplice) return; // Skip if no accomplice
      
      const result = game.validateMessage(accomplice.id, 'Tôi thấy anh ấy ở đó');
      
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should allow normal player to say anything', () => {
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal');
      
      const result = game.validateMessage(normal!.id, 'Tôi thấy anh ấy cầm cái điện thoại');
      
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });
  });

  describe('handleMessage', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should add message and return it', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const message = game.handleMessage(player!.id, 'Test message');
      
      expect(message).toBeDefined();
      expect(message!.content).toBe('Test message');
      expect(message!.playerId).toBe(player!.id);
    });

    it('should not allow host to send message', () => {
      const host = Array.from(game.getPlayers().values()).find(p => p.isHost);
      
      const message = game.handleMessage(host!.id, 'Host message');
      
      expect(message).toBeNull();
    });

    it('should track message count', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      game.handleMessage(player!.id, 'Message 1');
      game.handleMessage(player!.id, 'Message 2');
      
      expect(game.getMessages().length).toBe(2);
    });
  });
});

function createMockPlayers(count: number): Map<string, Player> {
  const players = new Map<string, Player>();
  
  // Add host
  players.set('host-id', {
    id: 'host-id',
    name: 'Host',
    isHost: true,
    role: 'normal',
    messages: [],
  });

  // Add players
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

