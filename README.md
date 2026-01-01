# 🎮 Multi-Game Social Deduction Platform

Platform chơi game social deduction trực tuyến với 6 loại game khác nhau, tích hợp OpenAI API để AI tự động tạo nội dung game (chủ đề, luật chơi, điều kiện). Host sẽ nhận gợi ý từ AI và có quyền quyết định cuối cùng.

## ✨ Tính năng

- 🎯 **6 Loại Game**: Alibi, Perspective Undercover, Truth-Constraint, 3-hop Chain, Banned/Required Words, Answer Filter
- 🤖 **AI Content Generation**: Tự động tạo nội dung game với OpenAI GPT
- 👑 **Hybrid Host System**: AI gợi ý, Host quyết định và chỉnh sửa
- 🔄 **Real-time Communication**: WebSocket cho trải nghiệm real-time
- ✅ **Message Validation**: Tự động kiểm tra vi phạm quy tắc game
- 🎨 **Modern UI**: Giao diện đẹp với Tailwind CSS
- 📱 **Responsive Design**: Hoạt động tốt trên mọi thiết bị

## 🎲 Các Loại Game

### 1. Alibi 1 câu
- **Mô tả**: Mỗi người nói 1 câu alibi. Thủ phạm không được nhắc đồ vật, đồng phạm không được nhắc người.
- **Số người chơi**: 4-12 người
- **Vai trò**: Người chơi thường, Thủ phạm, Đồng phạm

### 2. Perspective Undercover
- **Mô tả**: Cùng chủ đề nhưng spy có góc nhìn khác. Phát hiện ai "lệch hệ".
- **Số người chơi**: 4-12 người
- **Vai trò**: Người chơi thường, Spy

### 3. Truth-Constraint
- **Mô tả**: Nhóm biết 1 fact bí mật, spy không biết. Ai nói sai fact sẽ lộ.
- **Số người chơi**: 4-12 người
- **Vai trò**: Người chơi thường, Spy

### 4. 3-hop Chain
- **Mô tả**: Nói câu theo chuỗi logic. Spy không biết chủ đề nên dễ đứt mạch.
- **Số người chơi**: 4-12 người
- **Vai trò**: Người chơi thường, Spy

### 5. Từ cấm & Từ bắt buộc
- **Mô tả**: Có từ cấm và từ bắt buộc. Spy nhận từ khóa khác nên khó tuân thủ.
- **Số người chơi**: 4-12 người
- **Vai trò**: Người chơi thường, Spy

### 6. Bộ lọc câu trả lời
- **Mô tả**: MC có bộ lọc bí mật. Nhóm tìm quy luật, 1 người phá đám.
- **Số người chơi**: 4-12 người
- **Vai trò**: Người chơi thường, Kẻ phá

## 🚀 Cài đặt

### Yêu cầu

- Node.js >= 20.9.0
- npm hoặc pnpm
- OpenAI API Key (để sử dụng tính năng AI)

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd Game
```

### Bước 2: Cài đặt dependencies

```bash
npm install
# hoặc
pnpm install
```

### Bước 3: Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục gốc:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Bước 4: Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 📁 Cấu trúc Dự án

```
Game/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── openai/              # OpenAI API endpoint
│   ├── room/                    # Room pages
│   │   ├── create/              # Create room page
│   │   └── [id]/                # Game room page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # React Components
│   ├── Games/                   # Game selection components
│   ├── Host/                    # Host view components
│   │   ├── AIAssistant.tsx      # AI content generation UI
│   │   ├── AnswerFilterPanel.tsx # Answer Filter game UI
│   │   ├── HostControls.tsx     # Host control buttons
│   │   └── PlayerManager.tsx    # Player management
│   ├── Player/                  # Player view components
│   │   ├── MessageInput.tsx     # Message input
│   │   ├── MessageList.tsx      # Message display
│   │   └── PlayerView.tsx       # Player game view
│   └── UI/                      # Shared UI components
│       ├── ErrorToast.tsx       # Error notifications
│       ├── Button.tsx           # Button component
│       └── Input.tsx            # Input component
├── lib/                          # Core libraries
│   ├── games/                   # Game implementations
│   │   ├── base.ts              # Base game abstract class
│   │   ├── types.ts             # Type definitions
│   │   ├── alibi.ts             # Alibi game
│   │   ├── perspective.ts       # Perspective game
│   │   ├── truth-constraint.ts  # Truth-Constraint game
│   │   ├── chain.ts             # 3-hop Chain game
│   │   ├── banned-words.ts      # Banned Words game
│   │   └── answer-filter.ts     # Answer Filter game
│   ├── engine/                   # Game engine
│   │   ├── factory.ts           # Game factory
│   │   └── state.ts             # Game state manager
│   ├── openai/                   # OpenAI integration
│   │   ├── client.ts             # OpenAI client
│   │   └── prompts.ts           # Prompt templates
│   └── websocket/                # WebSocket server
│       └── server.ts             # WebSocket handler
├── server.ts                     # Custom Next.js server
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
└── next.config.js                # Next.js config
```

## 🎮 Hướng dẫn Sử dụng

### Cho Host (Quản trò)

1. **Tạo phòng**: Vào trang chủ, nhập tên và chọn "Tạo phòng"
2. **Chọn game**: Chọn một trong 6 loại game
3. **Tạo nội dung**: 
   - Nhấn "✨ Tạo nội dung với AI" để AI tự động tạo
   - Xem preview và có thể:
     - ✓ **Chấp nhận**: Dùng nội dung AI tạo
     - ✏️ **Chỉnh sửa**: Sửa nội dung theo ý muốn
     - 🔄 **Tạo lại**: Yêu cầu AI tạo lại
     - 💬 **Feedback**: Gửi feedback để AI tạo tốt hơn
4. **Bắt đầu game**: Nhấn "Bắt đầu game" khi đã sẵn sàng
5. **Quản lý game**: 
   - Xem tất cả vai trò và thông tin bí mật
   - Theo dõi tin nhắn của người chơi
   - Trả lời câu hỏi (cho Answer Filter game)
   - Kết thúc hoặc reset game

### Cho Player (Người chơi)

1. **Tham gia phòng**: Vào trang chủ, nhập tên và mã phòng, chọn "Tham gia"
2. **Chờ Host**: Đợi Host chọn game và thiết lập nội dung
3. **Xem vai trò**: Khi game bắt đầu, xem vai trò và thông tin bí mật của mình
4. **Gửi tin nhắn**: Gửi câu nói theo quy tắc game
5. **Nhận feedback**: Xem kết quả validation

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Real-time**: WebSocket (ws)
- **AI**: OpenAI API
- **State Management**: React Hooks + WebSocket
- **Server**: Custom Next.js server với WebSocket support

## 📜 Scripts

```bash
# Development
npm run dev          # Chạy development server

# Production
npm run build        # Build production
npm run start        # Chạy production server

# Linting
npm run lint         # Chạy ESLint
```

## 🔧 Cấu hình

### Environment Variables

| Variable | Mô tả | Bắt buộc |
|----------|-------|----------|
| `OPENAI_API_KEY` | OpenAI API key để tạo nội dung game | Có |

### Next.js Config

File `next.config.js` đã được cấu hình để:
- Hỗ trợ custom server với WebSocket
- Webpack fallback cho Node.js modules

### Tailwind CSS

Sử dụng Tailwind CSS v4 với PostCSS plugin. Cấu hình trong `tailwind.config.ts` và `postcss.config.js`.

## 🏗️ Kiến trúc

### Game Engine

- **BaseGame**: Abstract class cho tất cả games
- **Game Factory**: Tạo instance game dựa trên type
- **Game State Manager**: Quản lý state của tất cả rooms và games

### WebSocket Communication

- **Message Types**: `create-room`, `join-room`, `select-game`, `generate-content`, `set-content`, `start-game`, `send-message`, `answer-question`, etc.
- **Real-time Updates**: Broadcast state changes đến tất cả clients trong room

### AI Integration

- **Lazy Loading**: OpenAI client chỉ được khởi tạo khi cần
- **Error Handling**: Graceful fallback nếu API key không có
- **Prompt Templates**: Mỗi game type có prompt template riêng

## 🐛 Troubleshooting

### WebSocket không kết nối

- Kiểm tra server đang chạy
- Kiểm tra firewall/port 3000
- Xem console logs để debug

### OpenAI không hoạt động

- Kiểm tra `OPENAI_API_KEY` trong `.env.local`
- Kiểm tra API key có hợp lệ không
- Xem server logs để biết lỗi cụ thể

### Game không bắt đầu được

- Đảm bảo có ít nhất 4 người (1 host + 3 players)
- Đảm bảo đã chọn game type
- Đảm bảo đã chấp nhận AI content

## 📝 License

Private project

## 👥 Contributors

- Alexander

## 🙏 Acknowledgments

- OpenAI cho API
- Next.js team
- Tailwind CSS team

---

**Lưu ý**: Đây là dự án phát triển. Một số tính năng có thể chưa hoàn thiện.

