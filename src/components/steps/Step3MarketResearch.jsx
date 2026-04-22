import { useState } from 'react';

export default function Step3MarketResearch({ basicInfo, marketResearch, onChange, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generateResearch() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suggest-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: basicInfo.title, category: basicInfo.category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '생성 실패');
      onChange({ marketResearch: data.summary });
    } catch (e) {
      setError('생성 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <span className="section-badge bg-indigo-100 text-indigo-700">3</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">시장조사</h2>
          <p className="text-sm text-slate-500">
            AI가 시장 현황을 자동 생성하거나, 직접 조사한 내용을 입력해주세요.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className="btn-primary"
          onClick={generateResearch}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              AI 생성 중...
            </span>
          ) : 'AI 시장조사 자동 생성'}
        </button>
        {marketResearch && (
          <button
            className="btn-secondary text-sm"
            onClick={() => onChange({ marketResearch: '' })}
          >
            초기화
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <textarea
        rows={12}
        className="input-field resize-y text-sm font-mono"
        placeholder={`직접 조사한 내용을 입력하거나, 위 버튼으로 AI 자동 생성 후 수정하세요.\n\n예시:\n- 데이터 분석 관련 자격증 응시자 2023년 전년 대비 32% 증가\n- 국비지원 유사 과정 현재 약 45개 기관 운영 중\n- 경쟁사 A: 수강료 49만원, 주요 소구점은 자격증 취득 보장`}
        value={marketResearch}
        onChange={(e) => onChange({ marketResearch: e.target.value })}
      />

      <p className="text-xs text-slate-400 mt-2">
        입력하지 않으면 AI가 자체 지식 기반으로 시장조사 섹션을 생성합니다.
      </p>

      <div className="flex justify-between mt-8">
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext}>다음 단계 →</button>
      </div>
    </div>
  );
}
