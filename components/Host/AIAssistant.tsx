'use client';

import React, { useState } from 'react';
import { GameType, AIGameContent, GAME_INFO } from '@/lib/games/types';

interface AIAssistantProps {
  gameType: GameType;
  aiContent: AIGameContent | null;
  isLoading: boolean;
  onGenerate: () => void;
  onRegenerate: (feedback?: string) => void;
  onAccept: (content: AIGameContent) => void;
  onEdit: (content: AIGameContent) => void;
}

export default function AIAssistant({
  gameType,
  aiContent,
  isLoading,
  onGenerate,
  onRegenerate,
  onAccept,
  onEdit,
}: AIAssistantProps) {
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<AIGameContent | null>(null);

  const gameInfo = GAME_INFO[gameType];

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(aiContent);
  };

  const handleSaveEdit = () => {
    if (editedContent) {
      onEdit(editedContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(null);
  };

  const renderContentPreview = (content: AIGameContent) => {
    switch (gameType) {
      case 'alibi':
        return (
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-slate-700">Vụ án:</span>
              <p className="text-slate-600">{content.scenario}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Địa điểm:</span>
              <span className="ml-2 text-slate-600">{content.location}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Vật bị mất:</span>
              <span className="ml-2 text-slate-600">{content.stolenItem}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-50 p-2 rounded">
                <span className="font-semibold text-red-700 text-sm">Thủ phạm:</span>
                <p className="text-red-600 text-sm">{content.culpritConstraint}</p>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <span className="font-semibold text-orange-700 text-sm">Đồng phạm:</span>
                <p className="text-orange-600 text-sm">{content.accompliceConstraint}</p>
              </div>
            </div>
          </div>
        );

      case 'perspective':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <span className="font-semibold text-green-700">Từ khóa nhóm:</span>
                <p className="text-green-600 text-lg">{content.mainTopic}</p>
                <p className="text-green-500 text-sm mt-1">{content.mainPerspective}</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <span className="font-semibold text-red-700">Từ khóa Spy:</span>
                <p className="text-red-600 text-lg">{content.spyTopic}</p>
                <p className="text-red-500 text-sm mt-1">{content.spyPerspective}</p>
              </div>
            </div>
          </div>
        );

      case 'truth-constraint':
        return (
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-slate-700">Chủ đề:</span>
              <span className="ml-2 text-slate-600 text-lg">{content.topic}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded">
              <span className="font-semibold text-amber-700">🔒 Fact bí mật:</span>
              <p className="text-amber-600">{content.secretFact}</p>
              <p className="text-amber-500 text-sm mt-1">{content.factExplanation}</p>
            </div>
            {content.forbiddenWords && (
              <div>
                <span className="font-semibold text-slate-700">Từ spy có thể lỡ nói:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {content.forbiddenWords.map((word, i) => (
                    <span key={i} className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'chain':
        return (
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-slate-700">Chủ đề:</span>
              <span className="ml-2 text-slate-600 text-lg">{content.topic}</span>
            </div>
            <p className="text-slate-500">{content.topicDescription}</p>
            {content.keyLogicPoints && (
              <div>
                <span className="font-semibold text-slate-700">Điểm logic quan trọng:</span>
                <ul className="list-disc list-inside mt-1">
                  {content.keyLogicPoints.map((point, i) => (
                    <li key={i} className="text-slate-600 text-sm">{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'banned-words':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <span className="font-semibold text-green-700">Từ khóa nhóm:</span>
                <p className="text-green-600 text-lg">{content.mainKeyword}</p>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <span className="font-semibold text-red-700">Từ khóa Spy:</span>
                <p className="text-red-600 text-lg">{content.spyKeyword}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="font-semibold text-slate-700">🚫 Từ cấm:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {content.bannedWords?.map((word, i) => (
                    <span key={i} className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-700">✅ Từ bắt buộc:</span>
                <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded text-sm">
                  {content.requiredWord}
                </span>
              </div>
            </div>
          </div>
        );

      case 'answer-filter':
        return (
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-slate-700">Chủ đề:</span>
              <span className="ml-2 text-slate-600">{content.topic}</span>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <span className="font-semibold text-purple-700">🔮 Filter bí mật:</span>
              <p className="text-purple-600">{content.secretFilter}</p>
              <p className="text-purple-500 text-sm mt-1">{content.filterExplanation}</p>
            </div>
            {content.filterExamples && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-green-700 text-sm">Trả lời CÓ:</span>
                  <ul className="text-green-600 text-sm">
                    {content.filterExamples.yes?.slice(0, 2).map((ex, i) => (
                      <li key={i}>• {ex}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-red-700 text-sm">Trả lời KHÔNG:</span>
                  <ul className="text-red-600 text-sm">
                    {content.filterExamples.no?.slice(0, 2).map((ex, i) => (
                      <li key={i}>• {ex}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <pre className="text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🤖</span> AI Assistant
        </h2>
        <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
          {gameInfo.name}
        </span>
      </div>

      {!aiContent && !isLoading && (
        <div className="text-center py-8">
          <p className="text-slate-600 mb-4">
            Nhấn nút bên dưới để AI tạo nội dung cho game
          </p>
          <button
            onClick={onGenerate}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            ✨ Tạo nội dung với AI
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tạo nội dung...</p>
        </div>
      )}

      {aiContent && !isLoading && !isEditing && (
        <div>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            {renderContentPreview(aiContent)}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[AIAssistant] Accept button clicked', { aiContent, hasOnAccept: !!onAccept });
                if (onAccept && aiContent) {
                  onAccept(aiContent);
                } else {
                  console.error('[AIAssistant] Missing onAccept or aiContent', { onAccept, aiContent });
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              ✓ Chấp nhận
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
            >
              ✏️ Chỉnh sửa
            </button>
            <button
              onClick={() => onRegenerate()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              🔄 Tạo lại
            </button>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Feedback cho AI (tùy chọn):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="VD: Chủ đề vui hơn, khó hơn..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => {
                  onRegenerate(feedback);
                  setFeedback('');
                }}
                disabled={!feedback}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && editedContent && (
        <div>
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <textarea
              value={JSON.stringify(editedContent, null, 2)}
              onChange={(e) => {
                try {
                  setEditedContent(JSON.parse(e.target.value));
                } catch {}
              }}
              className="w-full h-64 font-mono text-sm p-2 border rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              💾 Lưu
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-slate-400 text-white rounded-lg font-medium hover:bg-slate-500"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

