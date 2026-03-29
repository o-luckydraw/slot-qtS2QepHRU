import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import config from '../config.json';
import Swal from 'sweetalert2';
import type { DrawResultItem } from './DrawPage';

interface ShippingFormModalProps {
  prizes?: DrawResultItem[];
  onClose: () => void;
}

const ShippingFormModal: React.FC<ShippingFormModalProps> = ({ prizes = [], onClose }) => {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [agreed, setAgreed] = useState<boolean>(false);

  const shippingPrizes = prizes
    .filter((p) => p.requiresShipping)
    .map((p) => ({ rank: p.rank, name: p.name, count: p.count || 1 }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) return Swal.fire({
      title: '개인정보 수집 및 이용에 동의해주세요.',
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      confirmButtonColor: '#4f46e5',
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-html',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },

      // 기본 버튼 스타일 무력화 (Tailwind 클래스 적용을 위함)
      buttonsStyling: false,
    });

    try {
      const dbPath = `${config.siteId}/shippingInfo/data`;
      await addDoc(collection(db, dbPath), { ...form, prizes: shippingPrizes, createdAt: new Date() });
      await Swal.fire({
        title: '제출되었습니다!',
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

        // 기본 버튼 스타일 무력화 (Tailwind 클래스 적용을 위함)
        buttonsStyling: false,
      });
      onClose();
    } catch (err) {
      Swal.fire({
        title: '저장에 실패했습니다',
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        confirmButtonColor: '#4f46e5',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-html',
          confirmButton: 'swal-confirm-btn',
          cancelButton: 'swal-cancel-btn',
        },

        // 기본 버튼 스타일 무력화 (Tailwind 클래스 적용을 위함)
        buttonsStyling: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">배송 정보 입력</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            당첨 상품 수령을 위해 아래 정보를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-6 text-sm">
          {shippingPrizes.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <h4 className="mb-3 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                배송 대상 상품
              </h4>

              <ul className="flex flex-col gap-2">
                {shippingPrizes.map((p, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200"
                  >
                    <span>
                      {p.rank}등 - {p.name}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{p.count}개</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">이름</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="이름 (수령인)"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">연락처</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="연락처 (010-0000-0000)"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">주소</label>
            <textarea
              name="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              placeholder="주소 (상세주소 포함)"
              className="h-28 w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                개인정보 수집 및 이용 동의
              </span>
              <span className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                목적: 경품 배송 / 이벤트 종료 후 즉시 폐기됩니다.
              </span>
            </div>
          </label>

          <div className="mt-2 flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
            >
              제출하기
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              닫기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingFormModal;