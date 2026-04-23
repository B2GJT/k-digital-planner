import { useState } from 'react';

export default function Step4Persona({ data, basicInfo, marketResearch, onChange, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generatePersona() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suggest-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: basicInfo.title,
          category: basicInfo.category,
          marketResearch,
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
      onChange({ ...data, ...result });
    } catch (e) {
      setError('생성 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <span className="section-badge bg-indigo-100 text-indigo-700">3</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">타겟 페르소나</h2>
          <p className="text-sm text-slate-500">
            AI가 초안을 자동 생성하거나, 직접 입력 후 수정해주세요.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          className="btn-primary"
          onClick={generatePersona}
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
          ) : 'AI 페르소나 자동 생성'}
        </button>
        {(data.mainPersona || data.subPersona || data.painPoints) && (
          <button
            className="btn-secondary text-sm"
            onClick={() => onChange({ mainPersona: '', subPersona: '', painPoints: '' })}
          >
            초기화
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            메인 페르소나
          </label>
          <p className="text-xs text-slate-500 mb-2">
            직군, 연차, 현재 디지털 역량 수준, 왜 이 과정이 필요한지 간략히 적어주세요.
          </p>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="예: 30대 초반 비IT 마케터, 엑셀은 기초 함수 정도만 가능, 회사에서 데이터 분석 업무가 늘어나는데 도구를 모름"
            value={data.mainPersona}
            onChange={(e) => handleChange('mainPersona', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            서브 페르소나 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <textarea
            rows={2}
            className="input-field resize-none"
            placeholder="예: 50대 사무직 재직자, 디지털 전환으로 업무 방식이 바뀌는 것에 불안감을 느끼는 분"
            value={data.subPersona}
            onChange={(e) => handleChange('subPersona', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            핵심 페인포인트 힌트 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            수강생이 겪고 있는 어려움이나 니즈를 키워드 또는 문장으로 적어주세요.
          </p>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="예: 데이터 분석 툴 어려움, 경쟁사 대비 역량 불안, 팀 내 디지털 업무 처리 속도 차이"
            value={data.painPoints}
            onChange={(e) => handleChange('painPoints', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>AI 생성 항목:</strong> 페르소나 정의 문장, 선정 근거, 구체적 페인포인트
          1인칭 문장, 기대 결과물은 최종 기획안 생성 시 자동으로 만들어집니다.
          여기서는 방향성 힌트만 입력하면 됩니다.
        </p>
      </div>

      <div className="flex justify-between mt-8">
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext}>다음 단계 →</button>
      </div>
    </div>
  );
}
