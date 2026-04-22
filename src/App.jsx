import { useState } from 'react';
import StepIndicator from './components/StepIndicator.jsx';
import Step1BasicInfo from './components/steps/Step1BasicInfo.jsx';
import Step2Edges from './components/steps/Step2Edges.jsx';
import Step3MarketResearch from './components/steps/Step3MarketResearch.jsx';
import Step4Persona from './components/steps/Step4Persona.jsx';
import Step5DetailPage from './components/steps/Step5DetailPage.jsx';
import Step6Output from './components/steps/Step6Output.jsx';

const INITIAL_STATE = {
  basicInfo: { title: '', category: '', planLink: '', crLink: '', author: '' },
  edgeCandidates: [],
  marketResearch: '',
  persona: { mainPersona: '', subPersona: '', painPoints: '' },
  detailPage: {
    aopLink: '', instructor: '', runtime: '',
    curriculum: '', finalProject: '', direction: '',
    edgeCandidates: [],
  },
  generatedPlan: null,
  tokenUsage: null,
};

const STEPS = [
  { num: 1, label: '기본 정보' },
  { num: 2, label: 'Edge 후보' },
  { num: 3, label: '시장조사' },
  { num: 4, label: '타겟 페르소나' },
  { num: 5, label: '구성 방향' },
  { num: 6, label: '기획안 초안' },
];

export default function App() {
  const [step, setStep] = useState(1);
  const [appData, setAppData] = useState(INITIAL_STATE);

  function updateAppData(partial) {
    setAppData((prev) => ({ ...prev, ...partial }));
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, 6));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetAll() {
    setAppData(INITIAL_STATE);
    setStep(1);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-700">K-디지털 기획안 생성기</h1>
            <p className="text-xs text-slate-500 mt-0.5">K-디지털 기초역량 훈련 과정 기획안 초안 자동 생성</p>
          </div>
          {step > 1 && (
            <button onClick={resetAll} className="text-xs text-slate-400 hover:text-slate-600 underline">
              처음부터
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator steps={STEPS} currentStep={step} />

        <div className="mt-8">
          {step === 1 && (
            <Step1BasicInfo
              data={appData.basicInfo}
              onChange={(v) => updateAppData({ basicInfo: v })}
              onNext={goNext}
            />
          )}
          {step === 2 && (
            <Step2Edges
              edgeCandidates={appData.edgeCandidates}
              onChange={(v) => updateAppData(v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <Step3MarketResearch
              basicInfo={appData.basicInfo}
              marketResearch={appData.marketResearch}
              onChange={(v) => updateAppData(v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <Step4Persona
              data={appData.persona}
              onChange={(v) => updateAppData({ persona: v })}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <Step5DetailPage
              data={appData.detailPage}
              edgeCandidatesFromCrawl={appData.edgeCandidates}
              onChange={(v) => updateAppData({ detailPage: v })}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 6 && (
            <Step6Output
              appData={appData}
              onChange={(v) => updateAppData(v)}
              onBack={goBack}
              onReset={resetAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}
