import { GameStateManager } from '@/lib/engine/state';
import { AIGameContent } from '@/lib/games/types';

describe('Voting Functionality', () => {
  let manager: GameStateManager;
  let roomId: string;
  let hostId: string;
  let player1Id: string;
  let player2Id: string;
  let player3Id: string;

  beforeEach(() => {
    manager = new GameStateManager();
    
    // Create room and add players
    const result = manager.createRoom('TestHost');
    roomId = result.roomId;
    hostId = result.hostId;

    const p1 = manager.joinRoom(roomId, 'Player1');
    player1Id = p1.player!.id;
    
    const p2 = manager.joinRoom(roomId, 'Player2');
    player2Id = p2.player!.id;
    
    const p3 = manager.joinRoom(roomId, 'Player3');
    player3Id = p3.player!.id;

    // Start game
    manager.setGameType(roomId, hostId, 'alibi');
    manager.setAIContent(roomId, hostId, createMockAlibiContent());
    manager.startGame(roomId, hostId);
  });

  describe('startVoting', () => {
    it('should allow host to start voting', () => {
      const result = manager.startVoting(roomId, hostId);

      expect(result.success).toBe(true);

      const room = manager.getRoom(roomId);
      expect(room!.status).toBe('voting');
      expect(room!.votingState).toBeDefined();
      expect(room!.votingState!.isActive).toBe(true);
    });

    it('should reject non-host starting voting', () => {
      const result = manager.startVoting(roomId, player1Id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ host mới có thể bắt đầu vote');
    });

    it('should reject voting when game not playing', () => {
      manager.endGame(roomId, hostId);

      const result = manager.startVoting(roomId, hostId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game phải đang chơi để bắt đầu vote');
    });
  });

  describe('castVote', () => {
    beforeEach(() => {
      manager.startVoting(roomId, hostId);
    });

    it('should allow player to cast vote', () => {
      const result = manager.castVote(roomId, player1Id, player2Id);

      expect(result.success).toBe(true);
    });

    it('should update vote count', () => {
      manager.castVote(roomId, player1Id, player2Id);
      manager.castVote(roomId, player3Id, player2Id);

      const votingView = manager.getVotingView(roomId, player1Id);

      expect(votingView).toBeDefined();
      expect(votingView!.voteCounts![player2Id]).toBe(2);
    });

    it('should not allow voting for self', () => {
      const result = manager.castVote(roomId, player1Id, player1Id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Không thể vote chính mình');
    });

    it('should not allow voting for host', () => {
      const result = manager.castVote(roomId, player1Id, hostId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Không thể vote người này');
    });

    it('should not allow host to vote', () => {
      const result = manager.castVote(roomId, hostId, player1Id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ người chơi mới có thể vote');
    });

    it('should allow changing vote', () => {
      manager.castVote(roomId, player1Id, player2Id);
      manager.castVote(roomId, player1Id, player3Id);

      const votingView = manager.getVotingView(roomId, player1Id);

      expect(votingView!.myVote).toBe(player3Id);
      expect(votingView!.voteCounts![player2Id] || 0).toBe(0);
      expect(votingView!.voteCounts![player3Id]).toBe(1);
    });

    it('should reject voting when voting not active', () => {
      manager.endVoting(roomId, hostId);

      const result = manager.castVote(roomId, player1Id, player2Id);

      expect(result.success).toBe(false);
    });
  });

  describe('endVoting', () => {
    beforeEach(() => {
      manager.startVoting(roomId, hostId);
      manager.castVote(roomId, player1Id, player2Id);
      manager.castVote(roomId, player3Id, player2Id);
    });

    it('should allow host to end voting', () => {
      const result = manager.endVoting(roomId, hostId);

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
    });

    it('should return sorted results', () => {
      const result = manager.endVoting(roomId, hostId);

      expect(result.results).toHaveLength(1);
      expect(result.results![0].targetId).toBe(player2Id);
      expect(result.results![0].voteCount).toBe(2);
    });

    it('should include voter names in results', () => {
      const result = manager.endVoting(roomId, hostId);

      expect(result.results![0].voters).toContain('Player1');
      expect(result.results![0].voters).toContain('Player3');
    });

    it('should reject non-host ending voting', () => {
      const result = manager.endVoting(roomId, player1Id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chỉ host mới có thể kết thúc vote');
    });

    it('should set voting as inactive after ending', () => {
      manager.endVoting(roomId, hostId);

      const room = manager.getRoom(roomId);
      expect(room!.votingState!.isActive).toBe(false);
    });
  });

  describe('getVotingView', () => {
    beforeEach(() => {
      manager.startVoting(roomId, hostId);
    });

    it('should return voting view for player', () => {
      const view = manager.getVotingView(roomId, player1Id);

      expect(view).toBeDefined();
      expect(view!.isActive).toBe(true);
      expect(view!.hasVoted).toBe(false);
    });

    it('should show hasVoted as true after voting', () => {
      manager.castVote(roomId, player1Id, player2Id);

      const view = manager.getVotingView(roomId, player1Id);

      expect(view!.hasVoted).toBe(true);
      expect(view!.myVote).toBe(player2Id);
    });

    it('should return null when no voting state', () => {
      // Reset to clear voting
      manager.endGame(roomId, hostId);
      manager.resetRoom(roomId, hostId);

      const view = manager.getVotingView(roomId, player1Id);

      expect(view).toBeNull();
    });
  });

  describe('Integration with views', () => {
    it('should include votingView in PlayerView during voting', () => {
      manager.startVoting(roomId, hostId);

      const playerView = manager.getPlayerView(roomId, player1Id);

      expect(playerView).toBeDefined();
      expect(playerView!.votingView).toBeDefined();
      expect(playerView!.votingView!.isActive).toBe(true);
    });

    it('should include votingView in HostView during voting', () => {
      manager.startVoting(roomId, hostId);

      const hostView = manager.getHostView(roomId, hostId);

      expect(hostView).toBeDefined();
      expect(hostView!.votingView).toBeDefined();
    });
  });
});

function createMockAlibiContent(): AIGameContent {
  return {
    topic: 'Test Crime',
    scenario: 'A crime happened',
    stolenItem: 'Laptop',
    culpritConstraint: 'No objects',
    accompliceConstraint: 'No people',
    alibiTemplate: 'I was at...',
    hints: [],
  };
}

