import { useState } from 'react';

export default function Step2Edges({ edgeCandidates, onChange, onNext, onBack }) {
  const [inputText, setInputText] = useState('');

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
        <span className="section-badge bg-indigo-100 text-indigo-700">2</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">상품 Edge 후보 입력</h2>
          <p className="text-sm text-slate-500">
            기존 강의의 소구점·강점 문구를 입력해주세요. AI가 K-디지털 버전으로 재구성합니다.
            <span className="text-slate-400 ml-1">(없으면 건너뛰기 가능)</span>
          </p>
        </div>
      </div>

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
          placeholder="소구점 입력 후 Enter 또는 추가 버튼"
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
        <button className="btn-primary" onClick={onNext}>다음 단계 →</button>
      </div>
    </div>
  );
}
