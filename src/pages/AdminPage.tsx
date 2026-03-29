import React, { useEffect, useState } from 'react';
import { useDrawStore } from '../store/useDrawStore';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Trash2, Home } from 'lucide-react';
import Swal from 'sweetalert2';
import ShippingListModal from './ShippingListModal';

const AdminPage: React.FC = () => {
  const {
    prizes,
    displayMode,
    isLocked,
    isClosed,
    isTestMode,
    addPrize,
    updatePrize,
    deletePrize,
    setDisplayMode,
    setLocked,
    setClosed,
    setTestMode,
    saveToFirebase,
    loadFromFirebase,
    listenToFirebase,
  } = useDrawStore();

  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const MAX_PRIZES = 100;

  useEffect(() => {
    loadFromFirebase();
    const unsub = typeof listenToFirebase === 'function' ? listenToFirebase() : undefined;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [loadFromFirebase, listenToFirebase]);

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const totalQuantity = prizes.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalRemaining = prizes.reduce((sum, p) => sum + (p.remaining || 0), 0);

  const btnBase =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const btnPrimary = `${btnBase} bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-sm`;
  const btnDanger = `${btnBase} bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm`;
  const btnSecondary =
    `${btnBase} bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800`;
  const btnSoft = `${btnBase} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100`;

  return (
    <div className="w-full min-h-screen bg-zinc-50 text-sm text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full px-4 py-4 md:px-6 md:py-6 lg:px-8 max-w-[1920px] mx-auto">
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">관리자 페이지</h1>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/40">
                  변경 후 반드시 저장
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                ※ 상품 추가/삭제 및 결과 표시 방식, 운영 모드 변경 후에는 ‘저장하기’를 눌러야 반영됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className={`${btnSecondary} px-3`} onClick={() => navigate('/')} title="메인으로">
                <Home size={16} />
              </button>

              <button className={btnSoft} onClick={() => setShowModal(true)}>
                배송 정보 보기
              </button>

              <button className={btnSecondary} onClick={handleLogout}>
                로그아웃
              </button>

              <button
                className={isClosed ? btnSoft : btnDanger}
                onClick={async () => {
                  const result = await Swal.fire({
                    title: isClosed ? '다시 여시겠습니까?' : '정말로 마감하시겠습니까?',
                    showCancelButton: true,
                    confirmButtonText: isClosed ? '다시 열기' : '마감하기',
                    cancelButtonText: '취소',
                    confirmButtonColor: '#4f46e5',
                    customClass: {
                      popup: 'swal-popup',
                      title: 'swal-title',
                      htmlContainer: 'swal-html',
                      confirmButton: 'swal-confirm-btn',
                      cancelButton: 'swal-cancel-btn',
                    },
                    buttonsStyling: false,
                  });

                  if (!result.isConfirmed) return;

                  try {
                    const newClosed = !isClosed;
                    setClosed(newClosed);
                    await saveToFirebase();

                    await Swal.fire({
                      title: newClosed ? '마감되었습니다.' : '다시 열었습니다.',
                      confirmButtonColor: '#4f46e5',
                      confirmButtonText: '확인',
                      cancelButtonText: '취소',
                      customClass: {
                        popup: 'swal-popup',
                        title: 'swal-title',
                        htmlContainer: 'swal-html',
                        confirmButton: 'swal-confirm-btn',
                        cancelButton: 'swal-cancel-btn',
                      },
                      buttonsStyling: false,
                    });
                  } catch (error) {
                    await Swal.fire({
                      title: '저장 실패',
                      text: '행사 상태 저장 중 오류가 발생했습니다.',
                      confirmButtonColor: '#4f46e5',
                      confirmButtonText: '확인',
                      customClass: {
                        popup: 'swal-popup',
                        title: 'swal-title',
                        htmlContainer: 'swal-html',
                        confirmButton: 'swal-confirm-btn',
                      },
                      buttonsStyling: false,
                    });
                  }
                }}
              >
                {isClosed ? '행사 다시열기' : '행사 마감하기'}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">등수</th>
                  <th className="min-w-[220px] px-4 py-3 text-left font-semibold">상품명</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">전체 수량</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">남은 수량</th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">삭제</th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">배송 필요</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {prizes.map((prize, index) => (
                  <tr
                    key={prize.id}
                    className="transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                  >
                    <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {prize.rank}등
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={prize.name}
                        disabled={isLocked}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900"
                        onChange={(e) => updatePrize(index, { name: e.target.value })}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={prize.quantity}
                        disabled={isLocked}
                        className="w-24 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:disabled:bg-zinc-900"
                        onChange={(e) => {
                          const quantity = Math.max(0, parseInt(e.target.value) || 0);
                          updatePrize(index, { quantity });
                        }}
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                      {prize.remaining}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 dark:hover:bg-rose-950/20"
                        disabled={isLocked}
                        onClick={async () => {
                          const result = await Swal.fire({
                            title: `${prize.rank}등 [${prize.name}] 상품을 삭제하시겠습니까?`,
                            showCancelButton: true,
                            confirmButtonText: '삭제',
                            cancelButtonText: '취소',
                            confirmButtonColor: '#4f46e5',
                            customClass: {
                              popup: 'swal-popup',
                              title: 'swal-title',
                              htmlContainer: 'swal-html',
                              confirmButton: 'swal-confirm-btn',
                              cancelButton: 'swal-cancel-btn',
                            },
                            buttonsStyling: false,
                          });

                          if (result.isConfirmed) deletePrize(index);
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={prize.requiresShipping || false}
                        disabled={isLocked}
                        className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800"
                        onChange={(e) => updatePrize(index, { requiresShipping: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="flex flex-wrap gap-2">
              <button className={btnSecondary} onClick={() => setLocked(!isLocked)}>
                {isLocked ? '설정 잠금 해제' : '설정 잠금'}
              </button>

              <button
                className={btnSecondary}
                onClick={addPrize}
                disabled={isLocked || prizes.length >= MAX_PRIZES}
              >
                상품 추가
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span>
                전체: <strong className="text-zinc-900 dark:text-zinc-100">{totalQuantity}</strong>개
              </span>
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <span>
                남은 수량:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">{totalRemaining}</strong>개
              </span>
            </div>
          </div>
        </div>

        <div className="mb-24 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 border-b border-zinc-100 pb-3 text-base font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
              결과 표시 방식
            </h2>

            <div className="flex flex-col gap-3">
              {[
                { val: 'rank', label: '등수만' },
                { val: 'prize', label: '상품명만' },
                { val: 'both', label: '둘 다 표시' },
              ].map((opt) => (
                <label
                  key={opt.val}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20"
                >
                  <input
                    type="radio"
                    value={opt.val}
                    checked={displayMode === opt.val}
                    disabled={isLocked}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    onChange={(e) => setDisplayMode(e.target.value)}
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 shadow-sm transition-colors ${
              isTestMode
                ? 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
            }`}
          >
            <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">운영 모드</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  isTestMode
                    ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}
              >
                {isTestMode ? '리허설 모드' : '실제 운영중'}
              </span>
            </div>

            <div className="mb-4 flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20">
                <input
                  type="radio"
                  checked={!isTestMode}
                  disabled={isLocked}
                  className="h-4 w-4 text-indigo-600"
                  onChange={() => setTestMode(false)}
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  실제 운영 (재고 차감됨)
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20">
                <input
                  type="radio"
                  checked={isTestMode}
                  disabled={isLocked}
                  className="h-4 w-4 text-indigo-600"
                  onChange={() => setTestMode(true)}
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  리허설 모드 (재고 차감 안됨)
                </span>
              </label>
            </div>

            {isTestMode && (
              <p className="rounded-xl border border-amber-200 bg-amber-100/70 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                현재 리허설 모드입니다. 추첨을 해도 재고가 줄어들지 않습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 z-40 w-full border-t border-zinc-200 bg-white/90 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex w-full justify-end">
          <button
            className={`${btnPrimary} w-full px-10 py-3 md:w-auto`}
            onClick={async () => {
              const result = await Swal.fire({
                title: '저장하시겠습니까?',
                showCancelButton: true,
                confirmButtonText: '저장',
                cancelButtonText: '취소',
                confirmButtonColor: '#4f46e5',
                customClass: {
                  popup: 'swal-popup',
                  title: 'swal-title',
                  htmlContainer: 'swal-html',
                  confirmButton: 'swal-confirm-btn',
                  cancelButton: 'swal-cancel-btn',
                },
                buttonsStyling: false,
              });

              if (!result.isConfirmed) return;

              try {
                await saveToFirebase();

                await Swal.fire({
                  title: '저장되었습니다!',
                  confirmButtonColor: '#4f46e5',
                  confirmButtonText: '확인',
                  cancelButtonText: '취소',
                  customClass: {
                    popup: 'swal-popup',
                    title: 'swal-title',
                    htmlContainer: 'swal-html',
                    confirmButton: 'swal-confirm-btn',
                    cancelButton: 'swal-cancel-btn',
                  },
                  buttonsStyling: false,
                });
              } catch (error) {
                await Swal.fire({
                  title: '저장 실패',
                  text: '변경사항 저장 중 오류가 발생했습니다.',
                  confirmButtonColor: '#4f46e5',
                  confirmButtonText: '확인',
                  customClass: {
                    popup: 'swal-popup',
                    title: 'swal-title',
                    htmlContainer: 'swal-html',
                    confirmButton: 'swal-confirm-btn',
                  },
                  buttonsStyling: false,
                });
              }
            }}
          >
            변경사항 저장하기
          </button>
        </div>
      </div>

      <ShippingListModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default AdminPage;