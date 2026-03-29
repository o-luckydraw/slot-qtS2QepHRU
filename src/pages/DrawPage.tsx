import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDrawStore, type DrawnPrize } from '../store/useDrawStore';
import useAuthStore from '../store/useAuthStore';
import ResultReveal from './ResultReveal';
import { Plus, Minus } from 'lucide-react';
import Confetti from 'react-confetti';
import Swal from 'sweetalert2';
import config from '../config.json';

export interface DrawResultItem extends DrawnPrize {
  count?: number;
}

const DrawPage: React.FC = () => {
  const {
    prizes,
    isClosed,
    isTestMode,
    loadFromFirebase,
    listenToFirebase,
    drawWithTransaction,
  } = useDrawStore();

  const { isAdmin, authInitialized } = useAuthStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawCount, setDrawCount] = useState<number>(1);
  const [results, setResults] = useState<DrawResultItem[]>([]);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      await loadFromFirebase();
      setIsLoading(false);
    };

    init();

    const unsub = listenToFirebase();
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [loadFromFirebase, listenToFirebase]);

  const totalRemaining = prizes.reduce((sum, p) => sum + (p.remaining || 0), 0);
  const isFinished = totalRemaining === 0;
  const isUnavailable = isFinished || isClosed;

  const draw = async () => {
    if (!authInitialized) return;

    if (!isAdmin) {
      await Swal.fire({
        title: '관리자 로그인 필요',
        text: 'DRAW 버튼은 관리자만 사용할 수 있습니다.',
        confirmButtonText: '로그인하러 가기',
        confirmButtonColor: '#4f46e5',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-html',
          confirmButton: 'swal-confirm-btn',
        },
        buttonsStyling: false,
      });

      navigate('/admin/login');
      return;
    }

    if (isDrawing) return;

    try {
      setIsDrawing(true);

      const fullResults = await drawWithTransaction(drawCount);

      setResults(fullResults);
      setShowResult(true);
    } catch (error) {
      await Swal.fire({
        title: '추첨 실패',
        text: error instanceof Error ? error.message : '추첨 중 오류가 발생했습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#4f46e5',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-html',
          confirmButton: 'swal-confirm-btn',
        },
        buttonsStyling: false,
      });
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col items-center gap-5">
      {showConfetti && (
        <Confetti
          className="no-capture !fixed inset-0 z-50 w-full h-full pointer-events-none"
          numberOfPieces={150}
          gravity={0.3}
        />
      )}

      <div className="w-full bg-box rounded-box p-box shadow-sm transition-all duration-300 flex flex-col items-center border border-gray-100 mt-[160px]">
        {isTestMode && !isUnavailable && (
          <div className="bg-yellow-50 text-yellow-700 text-xs font-medium px-4 py-3 rounded-lg mb-6 w-full text-center border border-yellow-200">
            현재 리허설 모드입니다. 추첨해도 실제 재고는 차감되지 않습니다.
          </div>
        )}

        {isLoading ? (
          <div className="animate-pulse h-24 w-full bg-gray-100 rounded-xl"></div>
        ) : showResult ? (
          <ResultReveal
            results={results}
            onFinish={() => {
              setShowConfetti(false);
              setShowResult(false);
              setResults([]);
              setDrawCount(1);
            }}
            onHighRankReveal={() => setShowConfetti(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 w-[260px]">
            {isUnavailable ? (
              <div className="text-base font-semibold text-gray-500 py-8 text-center">
                럭키드로우가 마감되었습니다.
              </div>
            ) : (
              <>
                {totalRemaining <= 50 && (
                  <div className="text-red-500 font-semibold text-sm bg-red-50 px-4 py-1.5 rounded-full">
                    럭키 드로우가 {totalRemaining}개 남았습니다
                  </div>
                )}

                <div className="flex items-center bg-white px-2 h-10 rounded-btn w-full justify-between border border-gray-200">
                  <button
                    className="w-10 h-10 flex items-center justify-center bg-transparent text-gray-600"
                    onClick={() => setDrawCount((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus size={18} />
                  </button>

                  <input
                    type="number"
                    className="w-16 text-center bg-transparent text-sm font-bold outline-none border-none text-gray-800"
                    value={drawCount}
                    onChange={(e) =>
                      setDrawCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))
                    }
                  />

                  <button
                    className="w-10 h-10 flex items-center justify-center bg-transparent text-gray-600"
                    onClick={() => setDrawCount((prev) => Math.min(100, prev + 1))}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex gap-2 w-full justify-center">
                  {[1, 5, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setDrawCount(num)}
                      className="flex-1 h-10 bg-white hover:bg-gray-50 text-gray-600 rounded-btn border border-gray-200 transition-colors text-sm font-medium"
                    >
                      {num}개
                    </button>
                  ))}
                </div>

                <button
                  onClick={draw}
                  disabled={!authInitialized || !isAdmin || isDrawing}
                  className="w-full h-10 bg-primary text-primary-text rounded-btn font-bold text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-wide"
                >
                  {isDrawing ? 'DRAWING...' : 'DRAW!'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="text-white/20 text-xs no-capture text-center absolute bottom-5 right-5">
        Copyright 2025. Dingdongsun. All rights reserved.
      </div>

      <Link
        to={authInitialized && isAdmin ? '/admin/dashboard' : '/admin/login'}
        className="no-capture text-xs font-medium hover:opacity-70 transition-opacity"
        style={{ color: config.theme.adminLinkColor }}
      >
        {authInitialized && isAdmin ? '관리자 페이지로 이동' : '관리자로 로그인'}
      </Link>
    </div>
  );
};

export default DrawPage;