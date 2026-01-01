import {
  GameType,
  Player,
  PlayerRole,
  Message,
  AIGameContent,
  PlayerGameInfo,
  HostGameInfo,
  BaseGameState,
} from './types';

export abstract class BaseGame {
  abstract readonly type: GameType;
  protected players: Map<string, Player> = new Map();
  protected messages: Message[] = [];
  protected aiContent: AIGameContent | null = null;
  protected round: number = 1;
  protected currentTurn: number = 0;

  constructor(aiContent: AIGameContent) {
    this.aiContent = aiContent;
  }

  abstract assignRoles(players: Map<string, Player>): void;
  abstract getPlayerInfo(playerId: string): PlayerGameInfo | null;
  abstract getHostInfo(): HostGameInfo;
  abstract validateMessage(playerId: string, content: string): { valid: boolean; violations: string[] };

  setup(players: Map<string, Player>): void {
    this.players = new Map(players);
    this.assignRoles(this.players);
  }

  handleMessage(playerId: string, content: string): Message | null {
    const player = this.players.get(playerId);
    if (!player || player.isHost) return null;

    const validation = this.validateMessage(playerId, content);

    const message: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      playerId,
      playerName: player.name,
      content: content.trim(),
      timestamp: Date.now(),
      isValid: validation.valid,
      violations: validation.violations,
    };

    this.messages.push(message);
    player.messages.push(message);
    this.currentTurn++;

    return message;
  }

  getState(): BaseGameState {
    return {
      type: this.type,
      round: this.round,
      currentTurn: this.currentTurn,
      messages: this.messages,
    };
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getPlayers(): Map<string, Player> {
    return this.players;
  }

  protected shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  protected selectRandomPlayers(count: number, excludeHost: boolean = true): Player[] {
    const eligible = Array.from(this.players.values()).filter(
      (p) => !excludeHost || !p.isHost
    );
    return this.shuffleArray(eligible).slice(0, count);
  }
}

