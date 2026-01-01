import { GameType } from '../games/types';

interface PromptOptions {
  theme?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export function getPromptForGame(
  gameType: GameType,
  playerCount: number,
  options?: PromptOptions
): string {
  const theme = options?.theme || 'ngẫu nhiên';
  const difficulty = options?.difficulty || 'medium';

  switch (gameType) {
    case 'alibi':
      return getAlibiPrompt(playerCount, theme, difficulty);
    case 'perspective':
      return getPerspectivePrompt(playerCount, theme, difficulty);
    case 'truth-constraint':
      return getTruthConstraintPrompt(playerCount, theme, difficulty);
    case 'chain':
      return getChainPrompt(playerCount, theme, difficulty);
    case 'banned-words':
      return getBannedWordsPrompt(playerCount, theme, difficulty);
    case 'answer-filter':
      return getAnswerFilterPrompt(playerCount, theme, difficulty);
    default:
      throw new Error(`Unknown game type: ${gameType}`);
  }
}

function getAlibiPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Alibi 1 câu" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC đọc vụ án nhẹ nhàng (ví dụ: "Ai đã chôm cái bánh?")
- Mỗi người nói 1 câu alibi: "Tôi ở ___ và thấy ___"
- Thủ phạm: KHÔNG được nhắc đến đồ vật
- Đồng phạm: KHÔNG được nhắc đến người
- Người thường: Nói bình thường

Trả về JSON với format:
{
  "scenario": "Mô tả vụ án ngắn gọn, vui nhộn",
  "location": "Địa điểm xảy ra vụ án",
  "stolenItem": "Vật bị mất/lấy",
  "culpritConstraint": "Không được nhắc đến đồ vật",
  "accompliceConstraint": "Không được nhắc đến người",
  "alibiTemplate": "Tôi ở ___ và thấy ___",
  "hints": ["Gợi ý 1 cho người chơi", "Gợi ý 2"],
  "exampleAlibi": {
    "normal": "Ví dụ alibi bình thường",
    "culprit": "Ví dụ alibi thủ phạm (né đồ vật)",
    "accomplice": "Ví dụ alibi đồng phạm (né người)"
  }
}`;
}

function getPerspectivePrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Perspective Undercover" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- Nhóm nhận 1 từ khóa chung (VD: "Du lịch")
- Điệp viên (spy) nhận từ khóa góc nhìn khác (VD: "Cắm trại")
- Mỗi người nói 1 câu: "Tôi quan tâm nhất là ___"
- Spy sẽ nghiêng về góc nhìn khác (tự túc/ngoài trời) vs nhóm (lịch trình/đi lại)

Trả về JSON với format:
{
  "mainTopic": "Từ khóa cho nhóm",
  "spyTopic": "Từ khóa cho spy (cùng chủ đề nhưng góc nhìn khác)",
  "mainPerspective": "Mô tả góc nhìn của nhóm",
  "spyPerspective": "Mô tả góc nhìn của spy",
  "promptTemplate": "Tôi quan tâm nhất là ___",
  "hints": ["Gợi ý phát hiện spy", "Gợi ý 2"],
  "exampleAnswers": {
    "group": ["Câu trả lời mẫu của nhóm 1", "Mẫu 2"],
    "spy": ["Câu trả lời mẫu của spy 1", "Mẫu 2"]
  }
}`;
}

function getTruthConstraintPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Truth-Constraint" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC cho cả nhóm (trừ điệp viên) biết 1 fact cụ thể
- VD: Chủ đề "đồ ăn sáng", fact "món đó không có nước"
- Mỗi người nói 1 câu mô tả không mâu thuẫn với fact
- Điệp viên không biết fact → hay lỡ nói sai (VD: "nước lèo", "húp")

Trả về JSON với format:
{
  "topic": "Chủ đề chung",
  "secretFact": "Fact bí mật mà spy không biết",
  "factExplanation": "Giải thích fact cho nhóm",
  "forbiddenWords": ["Từ spy có thể lỡ nói 1", "Từ 2", "Từ 3"],
  "promptTemplate": "Mô tả ___ bằng 1 câu",
  "hints": ["Gợi ý phát hiện spy", "Gợi ý 2"],
  "exampleAnswers": {
    "valid": ["Câu đúng với fact 1", "Câu đúng 2"],
    "invalid": ["Câu sai fact (spy có thể nói) 1", "Câu sai 2"]
  }
}`;
}

function getChainPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "3-hop Chain" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- Cả nhóm biết chủ đề, điệp viên không biết
- Mỗi người nói câu theo format: "Vì ___ nên ___, dẫn đến ___"
- Câu phải nối logic với chủ đề
- Spy không biết chủ đề → nói mơ hồ, đứt mạch logic

Trả về JSON với format:
{
  "topic": "Chủ đề cụ thể và rõ ràng",
  "topicDescription": "Mô tả chi tiết chủ đề",
  "promptTemplate": "Vì ___ nên ___, dẫn đến ___",
  "hints": ["Gợi ý nhận biết logic đứt mạch", "Gợi ý 2"],
  "exampleChains": {
    "valid": ["Chuỗi logic đúng 1", "Chuỗi đúng 2"],
    "invalid": ["Chuỗi logic mơ hồ/sai 1", "Chuỗi sai 2"]
  },
  "keyLogicPoints": ["Điểm logic quan trọng 1", "Điểm 2", "Điểm 3"]
}`;
}

function getBannedWordsPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Banned/Required Words" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- Cả nhóm nhận 1 từ khóa chủ đề
- Có 1-2 từ CẤM nói
- Có 1 từ BẮT BUỘC phải có trong câu
- Điệp viên nhận từ khóa KHÁC
- Phát hiện: Lệch chủ đề + né từ cấm gượng gạo

Trả về JSON với format:
{
  "mainKeyword": "Từ khóa cho nhóm",
  "spyKeyword": "Từ khóa cho spy (liên quan nhưng khác)",
  "bannedWords": ["Từ cấm 1", "Từ cấm 2"],
  "requiredWord": "Từ bắt buộc phải có",
  "promptTemplate": "Mô tả ___ bằng 1 câu (có từ bắt buộc, tránh từ cấm)",
  "hints": ["Gợi ý phát hiện người né từ", "Gợi ý 2"],
  "exampleAnswers": {
    "valid": ["Câu hợp lệ 1", "Câu hợp lệ 2"],
    "spy": ["Câu spy có thể nói 1", "Câu spy 2"]
  }
}`;
}

function getAnswerFilterPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Answer Filter" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC có "bộ lọc" bí mật: chỉ trả lời "Có" nếu câu hỏi thỏa điều kiện
- VD: Câu hỏi phải có chữ "m" / có số / có từ "không"
- Cả nhóm hỏi MC các câu Yes/No để tìm quy luật
- 1 người là "kẻ phá" sẽ đưa câu hỏi gây nhiễu

Trả về JSON với format:
{
  "topic": "Chủ đề để hỏi (VD: một đồ vật bí ẩn)",
  "secretFilter": "Quy luật filter bí mật",
  "filterExplanation": "Giải thích filter cho MC",
  "filterExamples": {
    "yes": ["Câu hỏi thỏa filter → Có", "Câu 2"],
    "no": ["Câu hỏi không thỏa → Không", "Câu 2"]
  },
  "sabotageurHint": "Gợi ý cho kẻ phá cách gây nhiễu",
  "hints": ["Gợi ý tìm quy luật", "Gợi ý 2"],
  "difficulty": "${difficulty}"
}`;
}

