import { GameStateManager } from '@/lib/engine/state';
import { AIGameContent, GameType } from '@/lib/games/types';

/**
 * Integration tests for the WebSocket message flow
 * These tests simulate the message handling without actual WebSocket connections
 * by testing the GameStateManager as the core state handler
 */

describe('WebSocket Message Flow Integration', () => {
  let manager: GameStateManager;

  beforeEach(() => {
    manager = new GameStateManager();
  });

  describe('Room Creation Flow', () => {
    it('should create room and return valid room info', () => {
      const { roomId, hostId } = manager.createRoom('TestHost');

      expect(roomId).toHaveLength(8);
      expect(hostId).toBeDefined();

      const room = manager.getRoom(roomId);
      expect(room).toBeDefined();
      expect(room!.status).toBe('waiting');
      expect(room!.hostId).toBe(hostId);
    });

    it('should allow host to get state after room creation', () => {
      const { roomId, hostId } = manager.createRoom('TestHost');

      const hostView = manager.getHostView(roomId, hostId);

      expect(hostView).toBeDefined();
      expect(hostView!.roomId).toBe(roomId);
      expect(hostView!.status).toBe('waiting');
      expect(hostView!.players.length).toBe(1);
    });
  });

  describe('Player Join Flow', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;
    });

    it('should allow player to join and get player view', () => {
      const { player } = manager.joinRoom(roomId, 'Player1');
      expect(player).toBeDefined();

      const playerView = manager.getPlayerView(roomId, player!.id);

      expect(playerView).toBeDefined();
      expect(playerView!.currentPlayer).toBeDefined();
      expect(playerView!.currentPlayer!.name).toBe('Player1');
    });

    it('should update host view when player joins', () => {
      manager.joinRoom(roomId, 'Player1');
      manager.joinRoom(roomId, 'Player2');

      const hostView = manager.getHostView(roomId, hostId);

      expect(hostView!.players.length).toBe(3); // Host + 2 players
    });

    it('should handle player reconnection by name', () => {
      const { player: p1 } = manager.joinRoom(roomId, 'Player1');
      const originalId = p1!.id;

      // Simulate reconnection
      const { player: p2 } = manager.joinRoom(roomId, 'Player1');

      expect(p2!.id).toBe(originalId); // Same player
    });

    it('should handle player reconnection by ID', () => {
      const { player: p1 } = manager.joinRoom(roomId, 'Player1');
      const originalId = p1!.id;

      // Simulate reconnection with playerId
      const { player: p2 } = manager.joinRoom(roomId, 'Player1', originalId);

      expect(p2!.id).toBe(originalId);
    });
  });

  describe('Game Setup Flow', () => {
    let roomId: string;
    let hostId: string;

    beforeEach(() => {
      const result = manager.createRoom('TestHost');
      roomId = result.roomId;
      hostId = result.hostId;

      manager.joinRoom(roomId, 'Player1');
      manager.joinRoom(roomId, 'Player2');
      manager.joinRoom(roomId, 'Player3');
    });

    it('should allow host to select game type', () => {
      const result = manager.setGameType(roomId, hostId, 'alibi');

      expect(result.success).toBe(true);

      const room = manager.getRoom(roomId);
      expect(room!.gameType).toBe('alibi');
      expect(room!.status).toBe('setup');
    });

    it('should allow host to set AI content', () => {
      manager.setGameType(roomId, hostId, 'alibi');

      const aiContent: AIGameContent = {
        topic: 'Test',
        scenario: 'A crime happened',
        stolenItem: 'Laptop',
        culpritConstraint: 'No objects',
        accompliceConstraint: 'No people',
      };

      const result = manager.setAIContent(roomId, hostId, aiContent);

      expect(result.success).toBe(true);

      const room = manager.getRoom(roomId);
      expect(room!.aiContent).toEqual(aiContent);
    });

    it('should allow host to start game after setup', () => {
      manager.setGameType(roomId, hostId, 'alibi');
      manager.setAIContent(roomId, hostId, createMockAlibiContent());

      const result = manager.startGame(roomId, hostId);

      expect(result.success).toBe(true);

      const room = manager.getRoom(roomId);
      expect(room!.status).toBe('playing');
    });
  });

  describe('Gameplay Flow', () => {
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

    it('should allow players to send messages', () => {
      const result = manager.addMessage(roomId, playerId, 'My alibi message');

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.message!.content).toBe('My alibi message');
    });

    it('should update player view with messages', () => {
      manager.addMessage(roomId, playerId, 'Test message');

      const playerView = manager.getPlayerView(roomId, playerId);

      expect(playerView!.messages.length).toBe(1);
      expect(playerView!.messages[0].content).toBe('Test message');
    });

    it('should update host view with messages and roles', () => {
      manager.addMessage(roomId, playerId, 'Test message');

      const hostView = manager.getHostView(roomId, hostId);

      expect(hostView!.messages.length).toBe(1);
      expect(hostView!.gameInfo).toBeDefined();
      expect(hostView!.gameInfo!.allRoles.length).toBeGreaterThan(0);
    });

    it('should validate messages and return result', () => {
      // Find culprit player
      const hostView = manager.getHostView(roomId, hostId);
      const culpritRole = hostView!.gameInfo!.allRoles.find(r => r.role === 'culprit');

      if (culpritRole) {
        // Culprit mentions object - should be invalid
        const result = manager.addMessage(roomId, culpritRole.playerId, 'Tôi thấy cái điện thoại');

        expect(result.success).toBe(true);
        expect(result.message!.isValid).toBe(false);
        expect(result.message!.violations!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Game End Flow', () => {
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

    it('should allow host to end game', () => {
      const result = manager.endGame(roomId, hostId);

      expect(result.success).toBe(true);

      const room = manager.getRoom(roomId);
      expect(room!.status).toBe('ended');
    });

    it('should allow host to reset room', () => {
      manager.endGame(roomId, hostId);

      const result = manager.resetRoom(roomId, hostId);

      expect(result.success).toBe(true);

      const room = manager.getRoom(roomId);
      expect(room!.status).toBe('waiting');
      expect(room!.gameType).toBeNull();
      expect(room!.aiContent).toBeNull();
    });
  });

  describe('Answer Filter Game Flow', () => {
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

    it('should validate questions (must have ?)', () => {
      const result = manager.addMessage(roomId, playerId, 'Is it blue');

      expect(result.success).toBe(true);
      expect(result.message!.isValid).toBe(false);
    });

    it('should accept valid questions', () => {
      const result = manager.addMessage(roomId, playerId, 'Is it blue?');

      expect(result.success).toBe(true);
      expect(result.message!.isValid).toBe(true);
    });

    it('should allow host to answer questions', () => {
      const msgResult = manager.addMessage(roomId, playerId, 'Is it blue?');
      const messageId = msgResult.message!.id;

      const answerResult = manager.answerQuestion(roomId, hostId, messageId, true);

      expect(answerResult.success).toBe(true);

      // Check message now has answer
      const hostView = manager.getHostView(roomId, hostId);
      const message = hostView!.messages.find(m => m.id === messageId);
      expect(message!.hostAnswer).toBe(true);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state across multiple operations', () => {
      // Create room
      const { roomId, hostId } = manager.createRoom('Host');

      // Multiple players join
      for (let i = 0; i < 5; i++) {
        manager.joinRoom(roomId, `Player${i}`);
      }

      const room = manager.getRoom(roomId);
      expect(room!.players.size).toBe(6); // Host + 5 players

      // Setup game
      manager.setGameType(roomId, hostId, 'perspective');
      manager.setAIContent(roomId, hostId, {
        mainTopic: 'Travel',
        spyTopic: 'Camping',
        mainPerspective: 'Resort',
        spyPerspective: 'Outdoor',
      });
      manager.startGame(roomId, hostId);

      // Check all players have roles
      const hostView = manager.getHostView(roomId, hostId);
      const spyCount = hostView!.gameInfo!.allRoles.filter(r => r.role === 'spy').length;
      expect(spyCount).toBe(1);

      // All players can send messages
      const nonHostPlayers = hostView!.players.filter(p => !p.isHost);
      nonHostPlayers.forEach(player => {
        const result = manager.addMessage(roomId, player.id, `Message from ${player.name}`);
        expect(result.success).toBe(true);
      });

      // Check messages count
      const finalHostView = manager.getHostView(roomId, hostId);
      expect(finalHostView!.messages.length).toBe(5);
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
    culpritConstraint: 'Không được nhắc đến đồ vật',
    accompliceConstraint: 'Không được nhắc đến người',
    alibiTemplate: 'Tôi ở {location} và làm {activity}',
    hints: ['Watch for who avoids certain topics'],
  };
}

function createMockAnswerFilterContent(): AIGameContent {
  return {
    topic: 'Color Guessing',
    secretFilter: 'Câu hỏi có chữ "m"',
    filterExplanation: 'If question contains "m", answer Yes',
    filterExamples: {
      yes: ['Có màu không?'],
      no: ['Nó to không?'],
    },
    saboteurHint: 'Try to confuse others',
    hints: ['Pay attention to the pattern'],
  };
}

