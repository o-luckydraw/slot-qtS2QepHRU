import React, { useState, useEffect, useCallback } from 'react';
import { useDrawStore } from '../store/useDrawStore';
import ShippingFormModal from './ShippingFormModal';
import type { DrawResultItem } from './DrawPage';

const animations = `
.scratch-overlay {
  clip-path: inset(0% 0% 0% 0%);
  transition: clip-path 0.7s cubic-bezier(0.65, 0, 0.35, 1);
}

.scratch-overlay.revealing {
  clip-path: inset(0% 0% 0% 100%);
}

.fade-in {
  opacity: 0;
  animation: fadeInUp 0.8s ease-out forwards;
  animation-delay: calc(var(--fade-index, 0) * 0.5s);
  animation-fill-mode: forwards;
  overflow: hidden;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translate3d(0, 30%, 0);
  }
  to {
    opacity: 1;
    transform: translateZ(0);
  }
}

.pulse {
  animation: pulse 1s infinite;
}

.pulse span {
  animation: pulseOpacity 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes pulseOpacity {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
`;

interface ResultRevealProps {
  results: DrawResultItem[];
  onFinish: () => void;
  onHighRankReveal?: () => void;
}

const ResultReveal: React.FC<ResultRevealProps> = ({ results, onFinish, onHighRankReveal }) => {
  const { displayMode } = useDrawStore();
  const [revealed, setRevealed] = useState<number[]>([]);
  const [currentIndex, _setCurrentIndex] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [showShippingModal, setShowShippingModal] = useState<boolean>(false);
  const [currentScratching, setCurrentScratching] = useState<number | null>(null);

  const isHighRank = (item: DrawResultItem) => item.rank === 1 || item.rank === 2;

  const groupedResults = results.reduce((acc: Record<string, DrawResultItem>, item) => {
    const key = `${item.rank}-${item.name}`;
    if (!acc[key]) acc[key] = { ...item, count: 1 };
    else acc[key].count = (acc[key].count || 1) + 1;
    return acc;
  }, {});

  const summary = Object.values(groupedResults).sort((a, b) => a.rank - b.rank);
  const needsShipping = summary.some((r) => r.requiresShipping);

  const renderLabel = (item: DrawResultItem) => {
    if (displayMode === 'rank') return `${item.rank}등`;
    if (displayMode === 'prize') return `${item.name}`;
    return `${item.rank}등 - ${item.name}`;
  };

  const handleReveal = useCallback((index: number) => {
    const item = results[index];

    if (isHighRank(item)) {
      if (onHighRankReveal) onHighRankReveal();
      setCurrentScratching(index);

      setTimeout(() => {
        setRevealed((prev) => [...prev, index]);
        setCurrentScratching(null);
      }, 700);
    } else {
      setRevealed((prev) => [...prev, index]);
    }
  }, [results, onHighRankReveal]);

  useEffect(() => {
    if (currentIndex < results.length) {
      if (!isHighRank(results[currentIndex])) handleReveal(currentIndex);
    }
  }, [currentIndex, results, handleReveal]);

  const getWidthClass = () => {
    if (results.length === 1) return 'w-full';
    if (results.length === 2) return 'w-[calc((100%-10px)/2)]';
    return 'w-[calc((100%-20px)/3)]';
  };

  return (
    <div className="w-full flex flex-col items-center">
      <style>{animations}</style>

      {!showSummary ? (
        <div className="w-full flex flex-col items-center">
          <h2 className="text-base font-bold text-gray-800 mb-5">당첨 결과</h2>

          <ul className="w-full flex flex-wrap justify-center gap-2.5 mb-6 max-h-[190px] overflow-y-auto scrollbar-hide">
            {results.map((r, i) => {
              const isHigh = isHighRank(r);
              const isRevealed = revealed.includes(i);
              const isScratching = currentScratching === i;

              return (
                <li
                  key={i}
                  className={`fade-in relative ${getWidthClass()} h-10 flex items-center justify-center text-sm font-medium rounded-btn transition-colors overflow-hidden ${
                    isHigh
                      ? ((isRevealed || isScratching) ? 'bg-high text-high-text' : 'bg-gray-100 cursor-pointer')
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                  style={{ ['--fade-index' as any]: i }}
                  onClick={() => {
                    if (isHigh && !isRevealed && !isScratching) handleReveal(i);
                  }}
                >
                  <span
                    className={`truncate px-2 transition-opacity duration-300 ${
                      (isHigh && !isRevealed && !isScratching) ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {renderLabel(r)}
                  </span>

                  {isHigh && !isRevealed && (
                    <div
                      className={`scratch-overlay absolute inset-0 w-full h-full flex items-center justify-center bg-gray-400 text-white rounded-btn ${
                        isScratching ? 'revealing' : 'pulse'
                      }`}
                    >
                      {!isScratching && (
                        <span className="text-white text-sm font-semibold tracking-wide">♥</span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            onClick={() => setShowSummary(true)}
            className="w-full h-10 bg-primary text-primary-text rounded-btn font-bold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all tracking-wide"
          >
            전체 결과 보기
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <h2 className="text-base font-bold text-gray-800 mb-5">전체 결과</h2>
          <ul className="w-full bg-white rounded-xl p-3 mb-6 flex flex-col gap-2 max-h-[50vh] overflow-y-auto scrollbar-hide border border-gray-200">
            {summary.map((r, i) => (
              <li
                key={i}
                className="flex justify-between items-center text-sm font-medium text-gray-700 border-b border-gray-200 last:border-0 pb-2.5 last:pb-0"
              >
                <span>{renderLabel(r)}</span>
                <span className="bg-white border border-gray-200 px-2.5 py-0.5 rounded-full text-sm">
                  {r.count}개
                </span>
              </li>
            ))}
          </ul>

          <div className="w-full flex flex-col gap-2.5">
            {needsShipping && (
              <button
                onClick={() => setShowShippingModal(true)}
                className="w-full h-10 bg-high text-high-text rounded-btn font-bold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all tracking-wide"
              >
                배송 정보 입력하기
              </button>
            )}

            <button
              onClick={onFinish}
              className="w-full h-10 bg-primary text-primary-text rounded-btn font-bold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all tracking-wide"
            >
              처음으로 돌아가기
            </button>
          </div>
        </div>
      )}

      {showShippingModal && (
        <ShippingFormModal prizes={summary} onClose={() => setShowShippingModal(false)} />
      )}
    </div>
  );
};

export default ResultReveal;