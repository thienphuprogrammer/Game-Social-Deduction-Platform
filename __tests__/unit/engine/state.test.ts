import { GameStateManager } from '@/lib/engine/state';
import { GameType, AIGameContent } from '@/lib/games/types';

describe('GameStateManager', () => {
  let manager: GameStateManager;

  beforeEach(() => {
    manager = new GameStateManager();
  });

  describe('createRoom', () => {
    it('should create a room with valid roomId and hostId', () => {
      const result = manager.createRoom('TestHost');

      expect(result.roomId).toBeDefined();
      expect(result.roomId).toHaveLength(8);
      expect(result.hostId).toBeDefined();
    });

    it('should create host as the first player with isHost=true', () => {
      const { roomId, hostId } = manager.createRoom('TestHost');
      const room = manager.getRoom(roomId);

      expect(room).toBeDefined();
      expect(room!.players.size).toBe(1);

      const host = room!.players.get(hostId);
      expect(host).toBeDefined();
      expect(host!.name).toBe('TestHost');
      expect(host!.isHost).toBe(true);
      expect(host!.role).toBe('normal');
    });

    it('should set room status to waiting', () => {
      const { roomId } = manager.createRoom('TestHost');
      const room = manager.getRoom(roomId);

      expect(room!.status).toBe('waiting');
    });
  });

  describe('joinRoom', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;
    });

    it('should allow new player to join', () => {
      const result = manager.joinRoom(roomId, 'Player1');

      expect(result.error).toBeUndefined();
      expect(result.player).toBeDefined();
      expect(result.player!.name).toBe('Player1');
      expect(result.player!.isHost).toBe(false);
    });

    it('should return error for non-existent room', () => {
      const result = manager.joinRoom('INVALID', 'Player1');

      expect(result.error).toBe('Phòng không tồn tại');
      expect(result.player).toBeNull();
    });

    it('should allow player with same name to reconnect', () => {
      // First join
      const result1 = manager.joinRoom(roomId, 'Player1');
      expect(result1.player).toBeDefined();
      const playerId = result1.player!.id;

      // Reconnect with same name (simulating page reload)
      const result2 = manager.joinRoom(roomId, 'Player1');
      expect(result2.error).toBeUndefined();
      expect(result2.player).toBeDefined();
      expect(result2.player!.id).toBe(playerId); // Same player ID
    });

    it('should allow reconnect with existing playerId', () => {
      const result1 = manager.joinRoom(roomId, 'Player1');
      const playerId = result1.player!.id;

      // Reconnect with playerId
      const result2 = manager.joinRoom(roomId, 'Player1', playerId);
      expect(result2.error).toBeUndefined();
      expect(result2.player!.id).toBe(playerId);
    });

    it('should allow multiple players to join', () => {
      manager.joinRoom(roomId, 'Player1');
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');

      const room = manager.getRoom(roomId);
      expect(room!.players.size).toBe(4); // 1 host + 3 players
    });

    it('should reject when game already started', () => {
      // Add players and start game
      manager.joinRoom(roomId, 'Player1');
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');
      manager.setGameType(roomId, hostId, 'alibi');
      manager.setAIContent(roomId, hostId, createMockAlibiContent());
      manager.startGame(roomId, hostId);

      const result = manager.joinRoom(roomId, 'LatePlayer');
      expect(result.error).toBe('Game đã bắt đầu');
    });
  });

  describe('setGameType', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;
    });

    it('should set game type for host', () => {
      const result = manager.setGameType(roomId, hostId, 'alibi');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      const room = manager.getRoom(roomId);
      expect(room!.gameType).toBe('alibi');
      expect(room!.status).toBe('setup');
    });

    it('should reject non-host trying to set game type', () => {
      const { player } = manager.joinRoom(roomId, 'Player1');

      const result = manager.setGameType(roomId, player!.id, 'alibi');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ host mới có thể chọn game');
    });

    it('should support all game types', () => {
      const gameTypes: GameType[] = [
        'alibi', 'perspective', 'truth-constraint', 
        'chain', 'banned-words', 'answer-filter'
      ];

      gameTypes.forEach(gameType => {
        const { roomId: newRoomId, hostId: newHostId } = manager.createRoom('Host');
        const result = manager.setGameType(newRoomId, newHostId, gameType);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('setAIContent', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;
    });

    it('should set AI content for host', () => {
      const content: AIGameContent = { topic: 'Test Topic' };
      const result = manager.setAIContent(roomId, hostId, content);

      expect(result.success).toBe(true);
      
      const room = manager.getRoom(roomId);
      expect(room!.aiContent).toEqual(content);
    });

    it('should reject non-host trying to set content', () => {
      const { player } = manager.joinRoom(roomId, 'Player1');
      const content: AIGameContent = { topic: 'Test Topic' };

      const result = manager.setAIContent(roomId, player!.id, content);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ host mới có thể thiết lập game');
    });
  });

  describe('startGame', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;
      
      // Add required players
      manager.joinRoom(roomId, 'Player1');
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');
    });

    it('should start game with valid setup', () => {
      manager.setGameType(roomId, hostId, 'alibi');
      manager.setAIContent(roomId, hostId, createMockAlibiContent());

      const result = manager.startGame(roomId, hostId);

      expect(result.success).toBe(true);
      
      const room = manager.getRoom(roomId);
      expect(room!.status).toBe('playing');
    });

    it('should reject without game type', () => {
      manager.setAIContent(roomId, hostId, createMockAlibiContent());

      const result = manager.startGame(roomId, hostId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chưa chọn loại game');
    });

    it('should reject without AI content', () => {
      manager.setGameType(roomId, hostId, 'alibi');

      const result = manager.startGame(roomId, hostId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chưa thiết lập nội dung game');
    });

    it('should reject with insufficient players', () => {
      const { roomId: newRoomId, hostId: newHostId } = manager.createRoom('Host');
      manager.joinRoom(newRoomId, 'Player1');
      manager.joinRoom(newRoomId, 'Player2');
      // Only 2 players + host = 3, need at least 4

      manager.setGameType(newRoomId, newHostId, 'alibi');
      manager.setAIContent(newRoomId, newHostId, createMockAlibiContent());

      const result = manager.startGame(newRoomId, newHostId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cần ít nhất 4 người (1 host + 3 người chơi)');
    });
  });

  describe('addMessage', () => {
    let roomId: string;
    let hostId: string;
    let playerId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;

      const p1 = manager.joinRoom(roomId, 'Player1');
      playerId = p1.player!.id;
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');

      manager.setGameType(roomId, hostId, 'alibi');
      manager.setAIContent(roomId, hostId, createMockAlibiContent());
      manager.startGame(roomId, hostId);
    });

    it('should add message during game', () => {
      const result = manager.addMessage(roomId, playerId, 'Test message');

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message!.content).toBe('Test message');
      expect(result.message!.playerId).toBe(playerId);
    });

    it('should reject message from non-existent room', () => {
      const result = manager.addMessage('INVALID', playerId, 'Test');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Phòng không tồn tại');
    });

    it('should reject message before game starts', () => {
      const { roomId: newRoomId } = manager.createRoom('Host');
      manager.joinRoom(newRoomId, 'Player1');

      const result = manager.addMessage(newRoomId, 'player', 'Test');
      expect(result.success).toBe(false);
    });
  });

  describe('endGame', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;

      manager.joinRoom(roomId, 'Player1');
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');

      manager.setGameType(roomId, hostId, 'alibi');
      manager.setAIContent(roomId, hostId, createMockAlibiContent());
      manager.startGame(roomId, hostId);
    });

    it('should end game and set status to ended', () => {
      const result = manager.endGame(roomId, hostId);

      expect(result.success).toBe(true);
      
      const room = manager.getRoom(roomId);
      expect(room!.status).toBe('ended');
    });

    it('should reject non-host trying to end game', () => {
      const result = manager.endGame(roomId, 'invalid-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ host mới có thể kết thúc game');
    });
  });

  describe('resetRoom', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;

      manager.joinRoom(roomId, 'Player1');
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');

      manager.setGameType(roomId, hostId, 'alibi');
      manager.setAIContent(roomId, hostId, createMockAlibiContent());
      manager.startGame(roomId, hostId);
    });

    it('should reset room to waiting state', () => {
      const result = manager.resetRoom(roomId, hostId);

      expect(result.success).toBe(true);
      
      const room = manager.getRoom(roomId);
      expect(room!.status).toBe('waiting');
      expect(room!.gameType).toBeNull();
      expect(room!.aiContent).toBeNull();
      expect(room!.gameInstance).toBeNull();
    });

    it('should reset all player roles', () => {
      manager.resetRoom(roomId, hostId);
      
      const room = manager.getRoom(roomId);
      room!.players.forEach(player => {
        expect(player.role).toBe('normal');
        expect(player.privateInfo).toBeUndefined();
        expect(player.messages).toHaveLength(0);
      });
    });
  });

  describe('getPlayerView', () => {
    let roomId: string;
    let hostId: string;
    let playerId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;

      const p1 = manager.joinRoom(roomId, 'Player1');
      playerId = p1.player!.id;
    });

    it('should return player view with correct structure', () => {
      const view = manager.getPlayerView(roomId, playerId);

      expect(view).toBeDefined();
      expect(view!.roomId).toBe(roomId);
      expect(view!.currentPlayer).toBeDefined();
      expect(view!.currentPlayer!.id).toBe(playerId);
      expect(view!.currentPlayer!.name).toBe('Player1');
      expect(view!.players).toBeInstanceOf(Array);
    });

    it('should return null for non-existent room', () => {
      const view = manager.getPlayerView('INVALID', playerId);
      expect(view).toBeNull();
    });
  });

  describe('getHostView', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;
    });

    it('should return host view with all player info', () => {
      manager.joinRoom(roomId, 'Player1');
      
      const view = manager.getHostView(roomId, hostId);

      expect(view).toBeDefined();
      expect(view!.roomId).toBe(roomId);
      expect(view!.players).toBeInstanceOf(Array);
      expect(view!.players.length).toBe(2); // Host + 1 player
    });

    it('should return null for non-host player', () => {
      const { player } = manager.joinRoom(roomId, 'Player1');
      
      const view = manager.getHostView(roomId, player!.id);
      expect(view).toBeNull();
    });
  });

  describe('answerQuestion (Answer Filter)', () => {
    let roomId: string;
    let hostId: string;
    let playerId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;

      const p1 = manager.joinRoom(roomId, 'Player1');
      playerId = p1.player!.id;
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');

      manager.setGameType(roomId, hostId, 'answer-filter');
      manager.setAIContent(roomId, hostId, createMockAnswerFilterContent());
      manager.startGame(roomId, hostId);
    });

    it('should allow host to answer question', () => {
      // First add a message
      const msgResult = manager.addMessage(roomId, playerId, 'Is it blue?');
      expect(msgResult.success).toBe(true);
      const messageId = msgResult.message!.id;

      // Answer the question
      const result = manager.answerQuestion(roomId, hostId, messageId, true);
      expect(result.success).toBe(true);
    });

    it('should reject answer from non-host', () => {
      const msgResult = manager.addMessage(roomId, playerId, 'Is it blue?');
      const messageId = msgResult.message!.id;

      const result = manager.answerQuestion(roomId, playerId, messageId, true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ host mới có thể trả lời câu hỏi');
    });

    it('should reject for non-answer-filter games', () => {
      // Create a different game type
      const r2 = manager.createRoom('Host2');
      manager.joinRoom(r2.roomId, 'P1');
      manager.joinRoom(r2.roomId, 'P2');
      manager.joinRoom(r2.roomId, 'P3');
      manager.setGameType(r2.roomId, r2.hostId, 'alibi');
      manager.setAIContent(r2.roomId, r2.hostId, createMockAlibiContent());
      manager.startGame(r2.roomId, r2.hostId);

      const result = manager.answerQuestion(r2.roomId, r2.hostId, 'msg-id', true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ Answer Filter game mới có tính năng này');
    });
  });
});

// Helper functions
function createMockAlibiContent(): AIGameContent {
  return {
    topic: 'Test Crime',
    scenario: 'A crime happened at the office',
    location: 'Office Building',
    stolenItem: 'Laptop',
    culpritConstraint: 'Cannot mention the stolen item',
    accompliceConstraint: 'Cannot mention any person',
    alibiTemplate: 'I was at {location} during the incident',
    hints: ['Think about what each person is avoiding'],
  };
}

function createMockAnswerFilterContent(): AIGameContent {
  return {
    topic: 'Guessing Game',
    secretFilter: 'Things that are blue',
    filterExplanation: 'Only blue things pass the filter',
    filterExamples: {
      yes: ['sky', 'ocean', 'blueberry'],
      no: ['sun', 'grass', 'banana'],
    },
    hints: ['Pay attention to the host answers'],
  };
}

