export default function Step5DetailPage({
  data,
  onChange,
  onNext,
  onBack,
}) {
  function handleChange(field, value) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <span className="section-badge bg-indigo-100 text-indigo-700">4</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">상세페이지 구성 방향</h2>
          <p className="text-sm text-slate-500">
            사람이 직접 입력하는 항목입니다. 빈 칸은 기획안에 "직접 입력 필요"로 표시됩니다.
          </p>
        </div>
      </div>

      {/* 안내 박스 */}
      <div className="mb-5 p-3 bg-slate-100 rounded-lg">
        <p className="text-xs text-slate-600">
          <strong>사람이 입력하는 항목:</strong> AOP 링크, 강사, 러닝타임, 커리큘럼, 파이널 프로젝트
          <br />
          <strong>AI가 생성하는 항목:</strong> 홍보용 과정명 후보 3개, 상품 Edge 문구 (입력된 소구점 기반)
        </p>
      </div>

      <div className="space-y-5">
        {/* AOP 링크 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">AOP 강의 링크</label>
          <input
            type="url"
            className="input-field"
            placeholder="https://..."
            value={data.aopLink}
            onChange={(e) => handleChange('aopLink', e.target.value)}
          />
        </div>

        {/* 강사 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">강사 이력 · 소개</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="강사명, 주요 경력, 보유 자격증 등을 입력해주세요 (직접 작성)"
            value={data.instructor}
            onChange={(e) => handleChange('instructor', e.target.value)}
          />
        </div>

        {/* 러닝타임 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">러닝타임</label>
          <input
            type="text"
            className="input-field"
            placeholder="예: 총 40시간 (동영상 35h + Q&A 5h)"
            value={data.runtime}
            onChange={(e) => handleChange('runtime', e.target.value)}
          />
        </div>

        {/* 커리큘럼 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            커리큘럼 구성 (챕터 · 모듈)
          </label>
          <textarea
            rows={5}
            className="input-field resize-none text-sm"
            placeholder={`Chapter 1. 파이썬 기초 (4h)\n  - 데이터 타입, 조건문, 반복문\nChapter 2. 데이터 분석 입문 (6h)\n  - pandas, numpy 활용`}
            value={data.curriculum}
            onChange={(e) => handleChange('curriculum', e.target.value)}
          />
        </div>

        {/* 파이널 프로젝트 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            파이널 프로젝트
          </label>
          <textarea
            rows={2}
            className="input-field resize-none"
            placeholder="수강생이 최종적으로 만들어내는 결과물을 입력해주세요"
            value={data.finalProject}
            onChange={(e) => handleChange('finalProject', e.target.value)}
          />
        </div>

        {/* 기획 메모 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            기획 메모 / 특이 사항 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <textarea
            rows={2}
            className="input-field resize-none"
            placeholder="상세페이지 기획 시 특별히 강조하고 싶은 방향, 경쟁사 대비 포지셔닝 등"
            value={data.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
          />
        </div>
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
