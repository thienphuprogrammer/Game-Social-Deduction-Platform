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
    case 'two-layer':
      return getTwoLayerPrompt(playerCount, theme, difficulty);
    case 'constraint-spy':
      return getConstraintSpyPrompt(playerCount, theme, difficulty);
    case 'common-ground':
      return getCommonGroundPrompt(playerCount, theme, difficulty);
    case 'liar-20q':
      return getLiar20QPrompt(playerCount, theme, difficulty);
    case 'one-false-detail':
      return getOneFalseDetailPrompt(playerCount, theme, difficulty);
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
  "saboteurHint": "Gợi ý cho kẻ phá cách gây nhiễu",
  "hints": ["Gợi ý tìm quy luật", "Gợi ý 2"],
  "difficulty": "${difficulty}"
}`;
}

function getTwoLayerPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Từ khóa 2 lớp" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC chọn 1 chủ đề có "thang" (VD: mức độ cay 1-5 / độ sang 1-5 / độ ồn 1-5)
- Mỗi người nhận một con số (1-5) nhắn riêng
- 1 người là điệp viên nhận số "lạc thang" hoặc không nhận gì
- Mỗi người nói 1 câu mô tả đúng với mức mình nhận (KHÔNG nói số)
- Phát hiện: Ai mô tả "lệch hệ" hoặc "né" quá

Trả về JSON với format:
{
  "topic": "Chủ đề có thể đo bằng thang (VD: độ cay, độ sang, độ ồn)",
  "scaleDescription": "Mô tả thang đo",
  "scaleMin": 1,
  "scaleMax": 5,
  "scaleValues": [
    {"level": 1, "description": "Mô tả mức 1"},
    {"level": 2, "description": "Mô tả mức 2"},
    {"level": 3, "description": "Mô tả mức 3"},
    {"level": 4, "description": "Mô tả mức 4"},
    {"level": 5, "description": "Mô tả mức 5"}
  ],
  "spyLevel": "Không có mức / lạc thang",
  "promptTemplate": "Mô tả mức độ của bạn bằng 1 câu (không nói số)",
  "hints": ["Gợi ý phát hiện spy", "Gợi ý 2"]
}`;
}

function getConstraintSpyPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Câu nói phải chứa điều kiện" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC chọn 1 luật bí mật áp cho tất cả (trừ 1 người không biết)
- Luật là dạng logic ngôn ngữ, ví dụ:
  * Câu phải có 1 từ chỉ thời gian (hôm nay/mai/lúc nãy)
  * Câu phải có 1 so sánh (như, hơn, giống)
  * Câu phải có 2 ý đối lập ("mặc dù… nhưng…")
- Mỗi người nói 1 câu theo chủ đề
- Người "mù luật" rất dễ nói sai cấu trúc

Trả về JSON với format:
{
  "topic": "Chủ đề để nói về",
  "constraintRule": "Luật rằng buộc (VD: Câu phải có từ chỉ thời gian)",
  "ruleExplanation": "Giải thích chi tiết luật",
  "promptTemplate": "Nói 1 câu về chủ đề (tuân thủ luật)",
  "hints": ["Gợi ý phát hiện ai không tuân thủ", "Gợi ý 2"],
  "exampleConstraints": {
    "valid": ["Câu đúng luật 1", "Câu đúng 2"],
    "invalid": ["Câu sai luật 1", "Câu sai 2"]
  }
}`;
}

function getCommonGroundPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Hai sự thật chung - một kẻ lạc hệ" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC đưa 1 chủ đề: "trên xe lúc nãy…"
- Mỗi người nói 1 câu dạng: "Tôi thuộc nhóm A hoặc B"
- 1 điệp viên được nhắn riêng: phải cố nói sao cho không thuộc cả hai nhưng vẫn giống
- Cả nhóm quan sát xem ai "không khớp" với đa số

Trả về JSON với format:
{
  "topic": "Chủ đề chung (VD: trên xe buýt lúc nãy)",
  "commonTraits": ["Nhóm A (VD: nghe nhạc)", "Nhóm B (VD: ngủ)"],
  "spyTrait": "Đặc điểm của spy (không thuộc A hay B)",
  "traitExplanation": "Giải thích các nhóm và spy",
  "promptTemplate": "Tôi thuộc nhóm ___ hoặc ___",
  "hints": ["Gợi ý phát hiện ai không khớp", "Gợi ý 2"]
}`;
}

function getLiar20QPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "20 câu hỏi có kẻ phá luật" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC nghĩ 1 vật/địa điểm
- Cả vòng tròn hỏi lần lượt mỗi người 1 câu Yes/No
- 1 người là "kẻ phá" (nhắn riêng): phải nói dối đúng 1 lần trong cả game
- Nhiệm vụ nhóm: vừa đoán vật, vừa tìm ai đã "dối" bằng cách soi mâu thuẫn

Trả về JSON với format:
{
  "topic": "Loại vật/địa điểm (VD: đồ vật trong nhà)",
  "mysteryItem": "Vật bí mật cụ thể (VD: cái quạt)",
  "itemDescription": "Mô tả chi tiết vật",
  "liarInstruction": "Phải nói dối đúng 1 lần trong game",
  "promptTemplate": "Hỏi câu Yes/No để đoán vật",
  "hints": ["Gợi ý đặt câu hỏi tốt", "Gợi ý soi mâu thuẫn"],
  "questionGuidelines": ["Loại câu hỏi nên hỏi 1", "Loại 2", "Loại 3"]
}`;
}

function getOneFalseDetailPrompt(playerCount: number, theme: string, difficulty: string): string {
  return `Tạo nội dung cho game "Đúng 1 chi tiết sai" với ${playerCount} người chơi.
Chủ đề: ${theme}
Độ khó: ${difficulty}

LUẬT CHƠI:
- MC đọc vụ án nhẹ nhàng: "Ai đã 'chôm' cái bánh?" (chỉ là trò chơi)
- MC mô tả 1 địa điểm/vật với 2 câu
- Mỗi người nói 1 câu mô tả
- Twist: Spy được nhắn: "Câu của bạn phải sai đúng 1 chi tiết"
  (VD: sai màu, sai thời gian, sai số lượng, sai vị trí)
- Nhóm phải phân biệt sai vì bịa hay sai vì diễn đạt

Trả về JSON với format:
{
  "topic": "Chủ đề (VD: một địa điểm nổi tiếng)",
  "truthDescription": "Mô tả chính xác với 2-3 câu về địa điểm/vật",
  "detailCategories": ["màu sắc", "số lượng", "thời gian", "vị trí", "kích thước"],
  "promptTemplate": "Mô tả địa điểm/vật bằng 1 câu",
  "hints": ["Gợi ý phát hiện chi tiết sai", "Gợi ý 2"],
  "exampleFalseDetails": ["VD sai màu", "VD sai số lượng", "VD sai thời gian"]
}`;
}

