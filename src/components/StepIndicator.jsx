export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="w-full">
      {/* 데스크탑: 가로 스텝 바 */}
      <div className="hidden sm:flex items-center">
        {steps.map((s, i) => {
          const isCompleted = s.num < currentStep;
          const isActive = s.num === currentStep;
          return (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isCompleted
                      ? 'bg-indigo-600 text-white'
                      : isActive
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`mt-1 text-xs font-medium whitespace-nowrap ${
                    isActive ? 'text-indigo-700' : isCompleted ? 'text-indigo-500' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 ${
                    s.num < currentStep ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 모바일: 현재 스텝 텍스트 */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-700">
            Step {currentStep} / {steps.length} — {steps[currentStep - 1]?.label}
          </span>
          <span className="text-xs text-slate-500">{Math.round(((currentStep - 1) / steps.length) * 100)}% 완료</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
