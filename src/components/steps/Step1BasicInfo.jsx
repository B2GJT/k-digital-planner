const CATEGORIES = [
  'AI/머신러닝',
  '데이터 분석',
  '업무 자동화',
  '디지털 마케팅',
  '클라우드/인프라',
  '웹 개발',
  '사무 자동화 (Excel/PPT/Word)',
  '영상 편집/콘텐츠 제작',
  '사이버보안',
  'UX/UI 디자인',
  '기타',
];

export default function Step1BasicInfo({ data, onChange, onNext }) {
  function handleChange(field, value) {
    onChange({ ...data, [field]: value });
  }

  const isValid = data.title.trim() && data.category.trim();

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <span className="section-badge bg-indigo-100 text-indigo-700">1</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">기본 정보 입력</h2>
          <p className="text-sm text-slate-500">기획안의 기초가 되는 과정 정보를 입력해주세요.</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            강의명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="예: AICE Associate 자격증 대비반 with Python"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <select
            className="input-field"
            value={data.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">카테고리 선택</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              운영계획서 링크
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://..."
              value={data.planLink}
              onChange={(e) => handleChange('planLink', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">CR 링크</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://..."
              value={data.crLink}
              onChange={(e) => handleChange('crLink', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">작성자</label>
          <input
            type="text"
            className="input-field"
            placeholder="이름 또는 팀명"
            value={data.author}
            onChange={(e) => handleChange('author', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button className="btn-primary" disabled={!isValid} onClick={onNext}>
          다음 단계 →
        </button>
      </div>
    </div>
  );
}
