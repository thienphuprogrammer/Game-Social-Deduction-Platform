import { TruthConstraintGame } from '@/lib/games/truth-constraint';
import { Player, AIGameContent } from '@/lib/games/types';

describe('TruthConstraintGame', () => {
  let game: TruthConstraintGame;
  let players: Map<string, Player>;

  const mockContent: AIGameContent = {
    topic: 'Famous Places',
    secretFact: 'Tháp Eiffel ở Paris',
    factExplanation: 'Mọi người biết tháp Eiffel ở Paris, spy không biết',
    forbiddenWords: ['paris', 'pháp'],
    hints: ['Find who contradicts the secret fact'],
  };

  beforeEach(() => {
    game = new TruthConstraintGame(mockContent);
    players = createMockPlayers(5);
  });

  describe('assignRoles', () => {
    it('should assign exactly one spy', () => {
      game.setup(players);
      
      const spies = Array.from(game.getPlayers().values()).filter(p => p.role === 'spy');
      expect(spies.length).toBe(1);
    });

    it('should give spy info that they dont know the fact', () => {
      game.setup(players);
      
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      expect(spy!.privateInfo).toContain('KHÔNG biết');
    });

    it('should give normal players the secret fact', () => {
      game.setup(players);
      
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      expect(normal).toBeDefined();
      expect(normal!.privateInfo).toBeDefined();
      expect(normal!.privateInfo).toContain('Tháp Eiffel');
    });
  });

  describe('getPlayerInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should tell spy they dont know the fact', () => {
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      const info = game.getPlayerInfo(spy!.id);
      
      expect(info!.hints).toContainEqual(expect.stringContaining('KHÔNG biết'));
    });

    it('should give normal player the secret fact', () => {
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      expect(normal).toBeDefined();
      
      const info = game.getPlayerInfo(normal!.id);
      expect(info).toBeDefined();
      expect(info!.privateConstraint).toBe('Tháp Eiffel ở Paris');
    });
  });

  describe('getHostInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should include secret fact', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.secretInfo).toContain('Tháp Eiffel');
    });
  });

  describe('validateMessage', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should flag spy using forbidden words', () => {
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      
      const result = game.validateMessage(spy!.id, 'Tháp ở Paris rất đẹp');
      
      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('paris'));
    });

    it('should allow normal player to use any word', () => {
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal');
      
      const result = game.validateMessage(normal!.id, 'Tháp ở Paris rất đẹp');
      
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

