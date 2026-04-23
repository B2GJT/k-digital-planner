import { useState, useEffect } from 'react';

// ─── 복사 버튼 ────────────────────────────────────────────────────
function CopyButton({ text, label = '복사' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
    >
      {copied ? '✓ 복사됨' : label}
    </button>
  );
}

// ─── 섹션 카드 ────────────────────────────────────────────────────
function SectionCard({ badge, badgeColor, title, copyText, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-4 cursor-pointer ${badgeColor} hover:brightness-95 transition`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white opacity-80">{badge}</span>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {copyText && <CopyButton text={copyText} />}
          <button className="text-white opacity-70 hover:opacity-100 text-sm px-2">
            {open ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {open && <div className="p-5 bg-white">{children}</div>}
    </div>
  );
}

// ─── 불렛 텍스트 렌더러 ───────────────────────────────────────────
function BulletText({ text }) {
  if (!text) return null;
  const lines = text.split('\n').filter((l) => l.trim());
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => {
        const clean = line.replace(/^[-•*]\s*/, '').trim();
        return (
          <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
            <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
            <span>{clean}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── 항목 행 ──────────────────────────────────────────────────────
function FieldRow({ label, value, highlight }) {
  const isPlaceholder = value === '직접 입력 필요' || !value;
  return (
    <div className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
      <dt className="w-32 text-xs font-semibold text-slate-500 shrink-0 pt-0.5">{label}</dt>
      <dd
        className={`text-sm flex-1 ${
          isPlaceholder
            ? 'text-amber-600 italic'
            : highlight
              ? 'text-slate-800 font-medium'
              : 'text-slate-700'
        }`}
      >
        {value || '직접 입력 필요'}
      </dd>
    </div>
  );
}

// ─── 기획안 전체 텍스트 조립 ─────────────────────────────────────
function buildFullText(plan) {
  if (!plan) return '';
  const { section00, section01, section02, section03 } = plan;
  const lines = [];

  lines.push('═══════════════════════════════════════');
  lines.push('00. 기본 정보');
  lines.push('═══════════════════════════════════════');
  lines.push(`강의명: ${section00.title}`);
  lines.push(`카테고리: ${section00.category}`);
  lines.push(`운영계획서 링크: ${section00.planLink}`);
  lines.push(`CR 링크: ${section00.crLink}`);
  lines.push(`작성자: ${section00.author}`);
  lines.push('');

  if (section01) {
    lines.push('═══════════════════════════════════════');
    lines.push('01. 시장 조사');
    lines.push('═══════════════════════════════════════');
    lines.push('[시장/트렌드 분석]');
    lines.push(section01.marketTrend || '');
    lines.push('');
    lines.push('[유사 과정 경쟁 현황]');
    lines.push(section01.competitorAnalysis || '');
    lines.push('');
    lines.push('[경쟁사 분석]');
    lines.push(section01.competitorComparison || '');
    if (section01.sources?.length) {
      lines.push('');
      lines.push('[출처]');
      section01.sources.forEach((s) => lines.push(`- ${s.title}: ${s.url}`));
    }
    lines.push('');
  }

  if (section02) {
    lines.push('═══════════════════════════════════════');
    lines.push('02. 타겟 페르소나');
    lines.push('═══════════════════════════════════════');
    const mp = section02.mainPersona;
    if (mp) {
      lines.push(`[메인 페르소나] ${mp.name}`);
      lines.push(mp.definition || '');
      lines.push(`선정 근거: ${mp.rationale || ''}`);
      lines.push('페인포인트:');
      (mp.painPoints || []).forEach((p) => lines.push(`  • ${p}`));
      lines.push(`기대 결과물: ${mp.outcomes || ''}`);
      lines.push('');
    }
    const sp = section02.subPersona;
    if (sp) {
      lines.push(`[서브 페르소나] ${sp.name}`);
      lines.push(sp.definition || '');
      lines.push('페인포인트:');
      (sp.painPoints || []).forEach((p) => lines.push(`  • ${p}`));
      lines.push('');
    }
  }

  if (section03) {
    lines.push('═══════════════════════════════════════');
    lines.push('03. 상세페이지 구성 방향');
    lines.push('═══════════════════════════════════════');
    lines.push(`AOP 링크: ${section03.aopLink}`);
    lines.push('');
    lines.push('[홍보용 과정명 후보]');
    (section03.titleCandidates || []).forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push('');
    lines.push(`강사: ${section03.instructor}`);
    lines.push(`러닝타임: ${section03.runtime}`);
    lines.push('');
    lines.push('[커리큘럼]');
    lines.push(section03.curriculum || '직접 입력 필요');
    lines.push('');
    lines.push('[파이널 프로젝트]');
    lines.push(section03.finalProject || '직접 입력 필요');
    lines.push('');
    lines.push('[메인 Edge]');
    lines.push(section03.mainEdge || '');
    lines.push('');
    lines.push('[서브 Edge]');
    (section03.subEdges || []).forEach((e, i) => lines.push(`${i + 1}. ${e}`));
  }

  return lines.join('\n');
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function Step6Output({ appData, onChange, onBack, onReset }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { generatedPlan, tokenUsage } = appData;

  // 마운트 시 아직 기획안이 없으면 자동 생성
  useEffect(() => {
    if (!generatedPlan) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setLoading(true);
    setError('');
    onChange({ generatedPlan: null, tokenUsage: null });

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: appData.basicInfo,
          crawlResult: appData.crawlResult,
          edgeCandidates: appData.edgeCandidates,
          researchResults: appData.researchResults,
          persona: appData.persona,
          detailPage: appData.detailPage,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '생성 실패');
      if (!data.success) {
        throw new Error(data.error || '기획안 생성 중 오류가 발생했습니다.\n\n' + (data.rawText || ''));
      }

      onChange({ generatedPlan: data.plan, tokenUsage: data.usage });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── 로딩 상태 ──
  if (loading) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-6">
        <svg
          className="animate-spin w-12 h-12 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">기획안 초안 생성 중...</p>
          <p className="text-sm text-slate-500 mt-1">시장조사 결과를 분석하고 초안을 작성합니다. 30~60초가 소요됩니다.</p>
        </div>
      </div>
    );
  }

  // ── 오류 상태 ──
  if (error) {
    return (
      <div className="card">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-700 mb-1">기획안 생성 실패</p>
          <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary" onClick={onBack}>
            ← 이전으로
          </button>
          <button className="btn-primary" onClick={generate}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!generatedPlan) return null;

  const { section00, section01, section02, section03 } = generatedPlan;
  const fullText = buildFullText(generatedPlan);

  return (
    <div className="space-y-4">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">기획안 초안 완성</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {section00?.title} · {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={fullText} label="전체 복사" />
          <button className="btn-secondary text-sm" onClick={generate}>
            재생성
          </button>
          <button className="btn-secondary text-sm" onClick={onReset}>
            처음부터
          </button>
        </div>
      </div>

      {/* 00. 기본 정보 */}
      <SectionCard
        badge="00"
        badgeColor="bg-slate-600"
        title="기본 정보"
        copyText={`강의명: ${section00.title}\n카테고리: ${section00.category}\n운영계획서: ${section00.planLink}\nCR: ${section00.crLink}\n작성자: ${section00.author}`}
      >
        <dl>
          <FieldRow label="강의명" value={section00.title} highlight />
          <FieldRow label="카테고리" value={section00.category} />
          <FieldRow label="운영계획서" value={section00.planLink} />
          <FieldRow label="CR 링크" value={section00.crLink} />
          <FieldRow label="작성자" value={section00.author} />
        </dl>
      </SectionCard>

      {/* 01. 시장 조사 */}
      {section01 && (
        <SectionCard
          badge="01"
          badgeColor="bg-blue-600"
          title="시장 조사"
          copyText={`[시장/트렌드 분석]\n${section01.marketTrend}\n\n[유사 과정 경쟁 현황]\n${section01.competitorAnalysis}\n\n[경쟁사 분석]\n${section01.competitorComparison}`}
        >
          <div className="space-y-5">
            <SubSection title="시장 · 트렌드 분석">
              <BulletText text={section01.marketTrend} />
            </SubSection>
            <SubSection title="국비지원 유사 과정 경쟁 현황">
              <BulletText text={section01.competitorAnalysis} />
            </SubSection>
            <SubSection title="B2C 경쟁사 분석">
              <BulletText text={section01.competitorComparison} />
            </SubSection>
            {section01.sources?.length > 0 && (
              <SubSection title="출처">
                <ul className="space-y-1">
                  {section01.sources.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline break-all"
                      >
                        {s.title || s.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </SubSection>
            )}
          </div>
        </SectionCard>
      )}

      {/* 02. 타겟 페르소나 */}
      {section02 && (
        <SectionCard
          badge="02"
          badgeColor="bg-purple-600"
          title="타겟 페르소나"
          copyText={[
            `[메인 페르소나] ${section02.mainPersona?.name}`,
            section02.mainPersona?.definition,
            `선정 근거: ${section02.mainPersona?.rationale}`,
            '페인포인트:',
            ...(section02.mainPersona?.painPoints || []).map((p) => `  • ${p}`),
            `기대 결과물: ${section02.mainPersona?.outcomes}`,
            '',
            `[서브 페르소나] ${section02.subPersona?.name}`,
            section02.subPersona?.definition,
            ...(section02.subPersona?.painPoints || []).map((p) => `  • ${p}`),
          ].join('\n')}
        >
          <div className="space-y-6">
            {/* 메인 페르소나 */}
            {section02.mainPersona && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    메인
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">
                    {section02.mainPersona.name}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">정의</p>
                    <BulletText text={section02.mainPersona.definition} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">선정 근거</p>
                    <BulletText text={section02.mainPersona.rationale} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">페인포인트</p>
                  <ul className="space-y-2">
                    {(section02.mainPersona.painPoints || []).map((p, i) => (
                      <li
                        key={i}
                        className="flex gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100"
                      >
                        <span className="text-purple-500 text-sm mt-0.5">💬</span>
                        <span className="text-sm text-purple-800 leading-relaxed">"{p}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {section02.mainPersona.outcomes && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-500 mb-1">기대 결과물</p>
                    <BulletText text={section02.mainPersona.outcomes} />
                  </div>
                )}
              </div>
            )}

            {/* 서브 페르소나 */}
            {section02.subPersona && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    서브
                  </span>
                  <h4 className="text-sm font-bold text-slate-700">
                    {section02.subPersona.name}
                  </h4>
                </div>
                <div className="mb-3"><BulletText text={section02.subPersona.definition} /></div>
                <ul className="space-y-1.5">
                  {(section02.subPersona.painPoints || []).map((p, i) => (
                    <li key={i} className="flex gap-2 p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-sm">💬</span>
                      <span className="text-sm text-slate-600">"{p}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* 03. 상세페이지 구성 방향 */}
      {section03 && (
        <SectionCard
          badge="03"
          badgeColor="bg-indigo-600"
          title="상세페이지 구성 방향"
          copyText={[
            `AOP 링크: ${section03.aopLink}`,
            '',
            '[홍보용 과정명 후보]',
            ...(section03.titleCandidates || []).map((t, i) => `${i + 1}. ${t}`),
            '',
            `강사: ${section03.instructor}`,
            `러닝타임: ${section03.runtime}`,
            '',
            '[커리큘럼]',
            section03.curriculum,
            '',
            '[파이널 프로젝트]',
            section03.finalProject,
            '',
            '[메인 Edge]',
            section03.mainEdge,
            '',
            '[서브 Edge]',
            ...(section03.subEdges || []).map((e, i) => `${i + 1}. ${e}`),
          ].join('\n')}
        >
          <div className="space-y-5">
            <FieldRow label="AOP 링크" value={section03.aopLink} />

            {/* 과정명 후보 */}
            <SubSection title="홍보용 과정명 후보 (AI 생성)">
              <ol className="space-y-2">
                {(section03.titleCandidates || []).map((t, i) => (
                  <li
                    key={i}
                    className="flex gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg"
                  >
                    <span className="text-indigo-400 font-bold text-sm shrink-0">{i + 1}</span>
                    <span className="text-sm text-indigo-900 font-medium">{t}</span>
                  </li>
                ))}
              </ol>
            </SubSection>

            {/* 인간 입력 항목 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="강사" value={section03.instructor} />
              <FieldRow label="러닝타임" value={section03.runtime} />
            </div>

            <SubSection title="커리큘럼">
              <p
                className={`text-sm whitespace-pre-wrap leading-relaxed ${
                  section03.curriculum === '직접 입력 필요'
                    ? 'text-amber-600 italic'
                    : 'text-slate-700'
                }`}
              >
                {section03.curriculum}
              </p>
            </SubSection>

            <SubSection title="파이널 프로젝트">
              <p
                className={`text-sm ${
                  section03.finalProject === '직접 입력 필요'
                    ? 'text-amber-600 italic'
                    : 'text-slate-700'
                }`}
              >
                {section03.finalProject}
              </p>
            </SubSection>

            {/* Edge */}
            <SubSection title="메인 상품 Edge (AI 생성)">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <BulletText text={section03.mainEdge} />
              </div>
            </SubSection>

            <SubSection title="서브 Edge (AI 생성)">
              <ul className="space-y-2">
                {(section03.subEdges || []).map((e, i) => (
                  <li
                    key={i}
                    className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <span className="text-slate-400 font-bold text-sm shrink-0">{i + 1}</span>
                    <span className="text-sm text-slate-700">{e}</span>
                  </li>
                ))}
              </ul>
            </SubSection>
          </div>
        </SectionCard>
      )}

      {/* 토큰 사용량 */}
      {tokenUsage && (
        <div className="flex items-center justify-center gap-6 py-3 bg-slate-100 rounded-xl text-xs text-slate-500">
          <span>📊 이번 생성 토큰 사용량</span>
          <span>입력 {tokenUsage.inputTokens?.toLocaleString()}개</span>
          <span>출력 {tokenUsage.outputTokens?.toLocaleString()}개</span>
          <span className="font-semibold text-slate-700">
            합계 {tokenUsage.totalTokens?.toLocaleString()}개
          </span>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex justify-between pt-2">
        <button className="btn-secondary" onClick={onBack}>
          ← 내용 수정
        </button>
        <button className="btn-primary" onClick={generate}>
          기획안 재생성
        </button>
      </div>
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}
