import { AnswerFilterGame } from '@/lib/games/answer-filter';
import { Player, AIGameContent } from '@/lib/games/types';

describe('AnswerFilterGame', () => {
  let game: AnswerFilterGame;
  let players: Map<string, Player>;

  const mockContent: AIGameContent = {
    topic: 'Color Guessing',
    secretFilter: 'Câu hỏi có chữ "m"',
    filterExplanation: 'Nếu câu hỏi có chữ m thì trả lời Có',
    filterExamples: {
      yes: ['Có màu không?', 'Nó mềm không?'],
      no: ['Nó to không?', 'Có bay được không?'],
    },
    saboteurHint: 'Hãy đặt câu hỏi gây nhiễu',
    hints: ['Pay attention to the pattern'],
  };

  beforeEach(() => {
    game = new AnswerFilterGame(mockContent);
    players = createMockPlayers(5);
  });

  describe('assignRoles', () => {
    it('should assign exactly one saboteur', () => {
      game.setup(players);
      
      const saboteurs = Array.from(game.getPlayers().values()).filter(p => p.role === 'saboteur');
      expect(saboteurs.length).toBe(1);
    });

    it('should give saboteur special hint', () => {
      game.setup(players);
      
      const saboteur = Array.from(game.getPlayers().values()).find(p => p.role === 'saboteur');
      expect(saboteur!.privateInfo).toContain('KẺ PHÁ');
    });

    it('should give normal players generic hint', () => {
      game.setup(players);
      
      const normal = Array.from(game.getPlayers().values()).find(p => p.role === 'normal' && !p.isHost);
      expect(normal).toBeDefined();
      expect(normal!.privateInfo).toBeDefined();
      expect(normal!.privateInfo).toContain('Yes/No');
    });
  });

  describe('getPlayerInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should show topic to all', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      const info = game.getPlayerInfo(player!.id);
      
      expect(info!.topic).toBe('Color Guessing');
    });

    it('should give saboteur special hints', () => {
      const saboteur = Array.from(game.getPlayers().values()).find(p => p.role === 'saboteur');
      const info = game.getPlayerInfo(saboteur!.id);
      
      expect(info!.hints).toContainEqual(expect.stringContaining('KẺ PHÁ'));
    });
  });

  describe('getHostInfo', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should show secret filter to host', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.secretInfo).toContain('chữ "m"');
    });

    it('should identify saboteur', () => {
      const hostInfo = game.getHostInfo();
      
      expect(hostInfo.allRoles.some(r => r.role === 'saboteur')).toBe(true);
    });
  });

  describe('validateMessage', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should require question mark', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Nó có màu xanh');
      
      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(expect.stringContaining('?'));
    });

    it('should accept valid question', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      
      const result = game.validateMessage(player!.id, 'Nó có màu xanh không?');
      
      expect(result.valid).toBe(true);
    });
  });

  describe('evaluateQuestion', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should return true for question with "m"', () => {
      const result = game.evaluateQuestion('Có màu không?');
      expect(result).toBe(true);
    });

    it('should return false for question without "m"', () => {
      const result = game.evaluateQuestion('Nó to không?');
      expect(result).toBe(false);
    });
  });

  describe('answerQuestion', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should set hostAnswer on message', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      const message = game.handleMessage(player!.id, 'Có màu không?');
      
      const success = game.answerQuestion(message!.id, true);
      
      expect(success).toBe(true);
      expect(message!.hostAnswer).toBe(true);
    });

    it('should return false for non-existent message', () => {
      const success = game.answerQuestion('non-existent-id', true);
      expect(success).toBe(false);
    });
  });

  describe('getUnansweredQuestions', () => {
    beforeEach(() => {
      game.setup(players);
    });

    it('should return questions without answers', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      game.handleMessage(player!.id, 'Question 1?');
      game.handleMessage(player!.id, 'Question 2?');
      
      const unanswered = game.getUnansweredQuestions();
      expect(unanswered.length).toBe(2);
    });

    it('should not include answered questions', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      const msg1 = game.handleMessage(player!.id, 'Question 1?');
      game.handleMessage(player!.id, 'Question 2?');
      
      game.answerQuestion(msg1!.id, true);
      
      const unanswered = game.getUnansweredQuestions();
      expect(unanswered.length).toBe(1);
    });

    it('should not include non-questions', () => {
      const player = Array.from(game.getPlayers().values()).find(p => !p.isHost);
      game.handleMessage(player!.id, 'This is not a question');
      
      const unanswered = game.getUnansweredQuestions();
      expect(unanswered.length).toBe(0);
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

