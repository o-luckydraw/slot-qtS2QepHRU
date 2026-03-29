import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import config from '../config.json';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

interface ShippingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShippingListModal: React.FC<ShippingListModalProps> = ({ isOpen, onClose }) => {
  const [shippingData, setShippingData] = useState<any[]>([]);
  const dbPath = `${config.siteId}/shippingInfo/data`;

  const exportToExcel = (data: any[]) => {
    if (!data || data.length === 0) return;

    const worksheetData = data.map((entry) => ({
      이름: entry.name,
      연락처: entry.phone,
      주소: entry.address || '',
      '상품 목록': entry.prizes.map((p: any) => `${p.rank}등 - ${p.name} (${p.count}개)`).join(', '),
      제출일: new Date(entry.createdAt.seconds * 1000).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '배송정보');
    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), '배송정보.xlsx');
  };

  const deleteAllShippingData = async () => {
    const confirm = await Swal.fire({
      title: '전체 삭제하시겠습니까?',
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
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

    if (!confirm.isConfirmed) return;

    const snapshot = await getDocs(collection(db, dbPath));
    await Promise.all(snapshot.docs.map((docItem) => deleteDoc(doc(db, dbPath, docItem.id))));
    setShippingData([]);
    Swal.fire({
      title: '삭제를 완료하였습니다.',
      confirmButtonText: '확인',
      confirmButtonColor: '#e11d48',
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-html',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      }
    })
  };

  useEffect(() => {
    if (!isOpen) return;
    getDocs(collection(db, dbPath)).then((snap) =>
      setShippingData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [isOpen, dbPath]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-950/60 md:flex-row md:items-start md:justify-between">

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">배송 정보 목록</h1>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/40">
                개인정보 반드시 삭제
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              ※ 개인정보 보호를 위해 배송이 완료된 후, 수집된 이름·연락처·주소 정보는 반드시 삭제해 주세요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
              onClick={deleteAllShippingData}
            >
              전체 삭제
            </button>

            <button
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300"
              onClick={() => exportToExcel(shippingData)}
            >
              엑셀 다운로드
            </button>

            <button
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-zinc-200 bg-white px-5 py-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">총 제출 건수</div>
            <div className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">
              {shippingData.length}건
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">배송 필요 상품 수</div>
            <div className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">
              {shippingData.reduce(
                (acc, entry) => acc + entry.prizes.reduce((sum: number, p: any) => sum + (p.count || 0), 0),
                0
              )}
              개
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">상태</div>
            <div className="mt-1 text-base font-bold text-indigo-600 dark:text-indigo-400">
              {shippingData.length > 0 ? '확인 필요' : '제출 없음'}
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-auto bg-white dark:bg-zinc-900">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
              <tr>
                <th className="border-b border-zinc-200 px-4 py-4 text-left text-xs font-bold tracking-wide dark:border-zinc-800">
                  이름
                </th>
                <th className="border-b border-zinc-200 px-4 py-4 text-left text-xs font-bold tracking-wide dark:border-zinc-800">
                  연락처
                </th>
                <th className="border-b border-zinc-200 px-4 py-4 text-left text-xs font-bold tracking-wide dark:border-zinc-800">
                  주소
                </th>
                <th className="min-w-[260px] border-b border-zinc-200 px-4 py-4 text-left text-xs font-bold tracking-wide dark:border-zinc-800">
                  상품 목록
                </th>
                <th className="border-b border-zinc-200 px-4 py-4 text-left text-xs font-bold tracking-wide dark:border-zinc-800">
                  제출일
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {shippingData.map((entry) => (
                <tr key={entry.id} className="align-top transition hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20">
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{entry.name}</div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="font-semibold text-zinc-700 dark:text-zinc-200">{entry.phone}</div>
                  </td>

                  <td className="min-w-[280px] px-4 py-4">
                    <div className="leading-6 text-zinc-700 dark:text-zinc-200">{entry.address}</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {entry.prizes.map((p: any, i: number) => (
                        <div key={i} className="font-semibold text-indigo-700 dark:text-indigo-300">{p.rank}등 - {p.name} {p.count}개</div>
                      ))}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {new Date(entry.createdAt.seconds * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}

              {shippingData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/30 dark:text-zinc-400">
                      제출된 배송 정보가 없습니다.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShippingListModal;