import { useState } from 'react';

export default function Step2Edges({ edgeCandidates, basicInfo, marketResearch, persona, onChange, onNext, onBack }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generateEdges() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suggest-edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: basicInfo.title,
          category: basicInfo.category,
          marketResearch,
          persona,
        }),
      });
      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('서버 응답 오류. Vercel 환경변수(GROQ_API_KEY)가 설정됐는지 확인해주세요.');
      }
      if (!res.ok) throw new Error(result.error || '생성 실패');
      onChange({ edgeCandidates: result.edges || [] });
    } catch (e) {
      setError('생성 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function addEdge() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onChange({ edgeCandidates: [...edgeCandidates, trimmed] });
    setInputText('');
  }

  function updateEdge(i, v) {
    const next = [...edgeCandidates];
    next[i] = v;
    onChange({ edgeCandidates: next });
  }

  function removeEdge(i) {
    onChange({ edgeCandidates: edgeCandidates.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <span className="section-badge bg-indigo-100 text-indigo-700">5</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">상품 Edge 후보</h2>
          <p className="text-sm text-slate-500">
            AI가 앞 단계 내용을 바탕으로 소구점을 자동 생성합니다. 수정·추가도 가능해요.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className="btn-primary"
          onClick={generateEdges}
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
          ) : 'AI Edge 자동 생성'}
        </button>
        {edgeCandidates.length > 0 && (
          <button
            className="btn-secondary text-sm"
            onClick={() => onChange({ edgeCandidates: [] })}
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

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>예시:</strong> "5년 현직 데이터 분석가 강사", "실무 프로젝트 3개 포함",
          "자격증 취득률 85%", "수강 후 이직 성공 사례 다수"
        </p>
      </div>

      {edgeCandidates.length === 0 && (
        <p className="text-sm text-slate-400 italic mb-3">아직 입력된 소구점이 없습니다.</p>
      )}

      <div className="space-y-2 mb-3">
        {edgeCandidates.map((e, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              className="input-field flex-1 text-sm"
              value={e}
              onChange={(ev) => updateEdge(i, ev.target.value)}
            />
            <button
              onClick={() => removeEdge(i)}
              className="text-slate-400 hover:text-red-500 px-2 transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1 text-sm"
          placeholder="소구점 직접 추가 (Enter)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addEdge()}
        />
        <button className="btn-secondary text-sm px-4" onClick={addEdge}>
          + 추가
        </button>
      </div>

      <div className="flex justify-between mt-8">
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext}>기획안 생성 →</button>
      </div>
    </div>
  );
}
