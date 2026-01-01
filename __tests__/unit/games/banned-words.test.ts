import { BannedWordsGame } from '@/lib/games/banned-words';
import { Player, AIGameContent } from '@/lib/games/types';

describe('BannedWordsGame', () => {
  let game: BannedWordsGame;
  let players: Map<string, Player>;

  const mockContent: AIGameContent = {
    topic: 'Food',
    mainKeyword: 'Phở',
    spyKeyword: 'Bún bò',
    bannedWords: ['nóng', 'nước', 'thịt'],
    requiredWord: 'ngon',
    hints: ['Avoid banned words, include required word'],
  };

  beforeEach(() => {
    game = new BannedWordsGame(mockContent);
    players = createMockPlayers(5);
  });

  describe('assignRoles', () => {
    it('should assign spy with different keyword', () => {
      game.setup(players);
      
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      expect(spy!.privateInfo).toContain('Bún bò');
    });

    it('should assign normal players main keyword', () => {
      game.setup(players);
      
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      expect(normal).toBeDefined();
      expect(normal!.privateInfo).toBeDefined();
      expect(normal!.privateInfo).toContain('Phở');
    });

    it('should include banned and required words in private info', () => {
      game.setup(players);
      
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      expect(player!.privateInfo).toContain('nóng');
      expect(player!.privateInfo).toContain('ngon');
    });
  });

  describe('getPlayerInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should show banned words in hints', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      const info = game.getPlayerInfo(player!.id);
      
      expect(info!.hints.some(h => h.includes('CẤM'))).toBe(true);
    });

    it('should show required word in hints', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      const info = game.getPlayerInfo(player!.id);
      
      expect(info!.hints.some(h => h.includes('BẮT BUỘC'))).toBe(true);
    });

    it('should give spy their different keyword', () => {
      const spy = Array.from(game.getPlayers().values()).find(p => p.role === 'spy');
      const info = game.getPlayerInfo(spy!.id);
      
      expect(info!.topic).toBe('Bún bò');
    });
  });

  describe('validateMessage', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should flag message with banned word', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Tô phở ngon có nước dùng');
      
      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('nước'));
    });

    it('should flag message missing required word', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Tô phở rất tuyệt vời');
      
      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('BẮT BUỘC'));
    });

    it('should accept valid message with required word and no banned words', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Tô phở ngon hấp dẫn');
      
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should catch multiple violations', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Tô phở nóng có thịt bò');
      
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(2); // Missing required + banned words
    });
  });

  describe('getHostInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should show both keywords', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.secretInfo).toContain('Phở');
      expect(hostInfo.secretInfo).toContain('Bún bò');
    });

    it('should show banned and required words', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.secretInfo).toContain('ngon');
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

