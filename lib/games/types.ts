export type GameType = 
  | 'alibi'
  | 'perspective'
  | 'truth-constraint'
  | 'chain'
  | 'banned-words'
  | 'answer-filter';

export type PlayerRole = 
  | 'normal'
  | 'spy'
  | 'culprit'
  | 'accomplice'
  | 'saboteur';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  role: PlayerRole;
  privateInfo?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
  isValid?: boolean;
  violations?: string[];
  hostAnswer?: boolean | null; // For Answer Filter game: true = Yes, false = No, null = not answered
}

export type RoomStatus = 'waiting' | 'setup' | 'playing' | 'voting' | 'ended';

export interface Room {
  id: string;
  hostId: string;
  gameType: GameType | null;
  status: RoomStatus;
  players: Map<string, Player>;
  gameInstance: BaseGameState | null;
  aiContent: AIGameContent | null;
  createdAt: number;
}

export interface BaseGameState {
  type: GameType;
  round: number;
  currentTurn: number;
  messages: Message[];
}

// AI Generated Content Types
export interface AIGameContent {
  // Common fields
  topic?: string;
  hints?: string[];
  promptTemplate?: string;
  
  // Alibi specific
  scenario?: string;
  location?: string;
  stolenItem?: string;
  culpritConstraint?: string;
  accompliceConstraint?: string;
  alibiTemplate?: string;
  exampleAlibi?: {
    normal: string;
    culprit: string;
    accomplice: string;
  };
  
  // Perspective specific
  mainTopic?: string;
  spyTopic?: string;
  mainPerspective?: string;
  spyPerspective?: string;
  exampleAnswers?: {
    group?: string[];
    spy?: string[];
    valid?: string[];
    invalid?: string[];
  };
  
  // Truth-Constraint specific
  secretFact?: string;
  factExplanation?: string;
  forbiddenWords?: string[];
  
  // Chain specific
  topicDescription?: string;
  exampleChains?: {
    valid: string[];
    invalid: string[];
  };
  keyLogicPoints?: string[];
  
  // Banned Words specific
  mainKeyword?: string;
  spyKeyword?: string;
  bannedWords?: string[];
  requiredWord?: string;
  
  // Answer Filter specific
  secretFilter?: string;
  filterExplanation?: string;
  filterExamples?: {
    yes: string[];
    no: string[];
  };
  saboteurHint?: string;
  difficulty?: string;
}

export interface PlayerView {
  roomId: string;
  gameType: GameType | null;
  status: RoomStatus;
  players: Array<{
    id: string;
    name: string;
    isHost: boolean;
    hasSpoken: boolean;
  }>;
  currentPlayer: {
    id: string;
    name: string;
    role: PlayerRole;
    privateInfo?: string;
  } | null;
  gameInfo: PlayerGameInfo | null;
  messages: Message[];
}

export interface HostView {
  roomId: string;
  gameType: GameType | null;
  status: RoomStatus;
  players: Array<{
    id: string;
    name: string;
    isHost: boolean;
    role: PlayerRole;
    privateInfo?: string;
    hasSpoken: boolean;
  }>;
  aiContent: AIGameContent | null;
  gameInfo: HostGameInfo | null;
  messages: Message[];
}

export interface PlayerGameInfo {
  promptTemplate: string;
  hints: string[];
  privateConstraint?: string;
  topic?: string;
}

export interface HostGameInfo {
  allRoles: Array<{ playerId: string; playerName: string; role: PlayerRole; privateInfo?: string }>;
  secretInfo: string;
  constraints: Record<PlayerRole, string>;
}

export const GAME_INFO: Record<GameType, {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  roles: PlayerRole[];
}> = {
  'alibi': {
    name: 'Alibi 1 câu',
    description: 'Mỗi người nói 1 câu alibi. Thủ phạm không được nhắc đồ vật, đồng phạm không được nhắc người.',
    minPlayers: 4,
    maxPlayers: 12,
    roles: ['normal', 'culprit', 'accomplice'],
  },
  'perspective': {
    name: 'Perspective Undercover',
    description: 'Cùng chủ đề nhưng spy có góc nhìn khác. Phát hiện ai "lệch hệ".',
    minPlayers: 4,
    maxPlayers: 12,
    roles: ['normal', 'spy'],
  },
  'truth-constraint': {
    name: 'Truth-Constraint',
    description: 'Nhóm biết 1 fact bí mật, spy không biết. Ai nói sai fact sẽ lộ.',
    minPlayers: 4,
    maxPlayers: 12,
    roles: ['normal', 'spy'],
  },
  'chain': {
    name: '3-hop Chain',
    description: 'Nói câu theo chuỗi logic. Spy không biết chủ đề nên dễ đứt mạch.',
    minPlayers: 4,
    maxPlayers: 12,
    roles: ['normal', 'spy'],
  },
  'banned-words': {
    name: 'Từ cấm & Từ bắt buộc',
    description: 'Có từ cấm và từ bắt buộc. Spy nhận từ khóa khác nên khó tuân thủ.',
    minPlayers: 4,
    maxPlayers: 12,
    roles: ['normal', 'spy'],
  },
  'answer-filter': {
    name: 'Bộ lọc câu trả lời',
    description: 'MC có bộ lọc bí mật. Nhóm tìm quy luật, 1 người phá đám.',
    minPlayers: 4,
    maxPlayers: 12,
    roles: ['normal', 'saboteur'],
  },
};

