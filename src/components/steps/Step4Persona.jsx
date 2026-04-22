export default function Step4Persona({ data, onChange, onNext, onBack }) {
  function handleChange(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <span className="section-badge bg-indigo-100 text-indigo-700">4</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">타겟 페르소나</h2>
          <p className="text-sm text-slate-500">
            AI가 구체적인 페르소나 문서를 생성할 수 있도록 기초 정보를 입력해주세요.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 메인 페르소나 */}
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

        {/* 서브 페르소나 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            서브 페르소나 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            메인 외에 잠재 수강생이 될 수 있는 다른 유형을 간략히 적어주세요.
          </p>
          <textarea
            rows={2}
            className="input-field resize-none"
            placeholder="예: 50대 사무직 재직자, 디지털 전환으로 업무 방식이 바뀌는 것에 불안감을 느끼는 분"
            value={data.subPersona}
            onChange={(e) => handleChange('subPersona', e.target.value)}
          />
        </div>

        {/* 페인포인트 힌트 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            핵심 페인포인트 힌트 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            수강생이 겪고 있는 어려움이나 니즈를 키워드 또는 문장으로 적어주세요.
            AI가 구체적인 1인칭 문장으로 확장해 줍니다.
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

      {/* 안내 박스 */}
      <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>💡 AI 생성 항목:</strong> 페르소나 정의 문장, 선정 근거, 구체적 페인포인트
          1인칭 문장, 기대 결과물은 AI가 자동으로 생성합니다.
          여기서는 방향성 힌트만 입력하면 됩니다.
        </p>
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between mt-8">
        <button className="btn-secondary" onClick={onBack}>
          ← 이전
        </button>
        <button className="btn-primary" onClick={onNext}>
          다음 단계 →
        </button>
      </div>
    </div>
  );
}
