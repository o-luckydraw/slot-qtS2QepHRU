import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Swal from 'sweetalert2';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const navigate = useNavigate();

  const login = useAuthStore((s) => s.login);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const authInitialized = useAuthStore((s) => s.authInitialized);

  useEffect(() => {
    if (authInitialized && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authInitialized, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await login(email, pw);

    if (success) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      await Swal.fire({
        title: '접근 불가',
        text: '로그인 실패 또는 관리자 권한 없음',
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        confirmButtonColor: '#6366f1',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title',
          htmlContainer: 'swal-html',
          confirmButton: 'swal-confirm-btn',
          cancelButton: 'swal-cancel-btn',
        },
        buttonsStyling: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center font-sans">
        <div className="w-full rounded-3xl border border-zinc-200 bg-white/95 p-7 shadow-[0_18px_60px_rgba(24,24,27,0.10)] backdrop-blur-sm sm:p-8">
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
              <ShieldCheck size={26} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-zinc-900">관리자 로그인</h1>
              <p className="text-sm leading-6 text-zinc-500">
                럭키 드로우 운영 설정과 배송 정보를 관리하려면 로그인해주세요.
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-500">이메일</span>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  required
                  className={`${inputClass} pl-11`}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-500">비밀번호</span>
              <div className="relative">
                <LockKeyhole
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={pw}
                  required
                  className={`${inputClass} pl-11`}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPw(e.target.value)}
                />
              </div>
            </label>

            <button
              type="submit"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.28)] transition-all hover:bg-indigo-500 active:scale-[0.99]"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;