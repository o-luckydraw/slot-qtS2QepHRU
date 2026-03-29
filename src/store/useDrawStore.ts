import { create } from 'zustand';
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { Prize } from '../types';
import config from '../config.json';

export interface DrawnPrize {
  rank: number;
  name: string;
  requiresShipping: boolean;
}

interface DrawStore {
  prizes: Prize[];
  displayMode: string;
  isLocked: boolean;
  isClosed: boolean;
  isTestMode: boolean;

  setPrizes: (prizes: Prize[]) => void;
  setDisplayMode: (mode: string) => void;
  setLocked: (locked: boolean) => void;
  setClosed: (closed: boolean) => void;
  setTestMode: (testMode: boolean) => void;

  addPrize: () => void;
  updatePrize: (index: number, updated: Partial<Prize>) => void;
  deletePrize: (index: number) => void;

  saveToFirebase: () => Promise<void>;
  loadFromFirebase: () => Promise<void>;
  listenToFirebase: () => () => void;

  drawWithTransaction: (drawCount: number) => Promise<DrawnPrize[]>;
}

const makePrizeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `prize_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const normalizePrize = (raw: any, index: number): Prize => {
  const quantity = Math.max(0, Number(raw?.quantity) || 0);
  const rawRemaining = Number(raw?.remaining);
  const remaining = Number.isFinite(rawRemaining)
    ? Math.max(0, Math.min(quantity, rawRemaining))
    : quantity;

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : makePrizeId(),
    rank: index + 1,
    name: typeof raw?.name === 'string' ? raw.name : '',
    quantity,
    remaining,
    requiresShipping: !!raw?.requiresShipping,
  };
};

const normalizePrizeList = (items: any[]): Prize[] => {
  return Array.isArray(items) ? items.map((item, index) => normalizePrize(item, index)) : [];
};

// 1. 기본 설정할 5개의 상품 목록을 선언합니다.
const defaultPrizes: Prize[] = [
  { id: makePrizeId(), rank: 1, name: '테스트 상품 1', quantity: 10, remaining: 10, requiresShipping: false },
  { id: makePrizeId(), rank: 2, name: '테스트 상품 2', quantity: 100, remaining: 100, requiresShipping: false },
  { id: makePrizeId(), rank: 3, name: '테스트 상품 3', quantity: 100, remaining: 100, requiresShipping: false },
  { id: makePrizeId(), rank: 4, name: '테스트 상품 4', quantity: 100, remaining: 100, requiresShipping: false },
  { id: makePrizeId(), rank: 5, name: '테스트 상품 5', quantity: 100, remaining: 100, requiresShipping: false },
];

export const useDrawStore = create<DrawStore>((set, get) => ({
  prizes: defaultPrizes, // 빈 배열([])에서 defaultPrizes로 변경
  displayMode: 'both',
  isLocked: false,
  isClosed: false,
  isTestMode: true,

  setPrizes: (prizes) => set({ prizes }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setLocked: (isLocked) => set({ isLocked }),
  setClosed: (isClosed) => set({ isClosed }),
  setTestMode: (isTestMode) => set({ isTestMode }),

  addPrize: () => {
    const { prizes } = get();

    const newPrize: Prize = {
      id: makePrizeId(),
      rank: prizes.length + 1,
      name: '',
      quantity: 1,
      remaining: 1,
      requiresShipping: false,
    };

    set({ prizes: [...prizes, newPrize] });
  },

  updatePrize: (index, updated) => {
    const { prizes } = get();
    const newPrizes = [...prizes];
    newPrizes[index] = {
      ...newPrizes[index],
      ...updated,
      rank: index + 1,
    };
    set({ prizes: newPrizes });
  },

  deletePrize: (index) => {
    const { prizes } = get();
    const newPrizes = prizes
      .filter((_, i) => i !== index)
      .map((p, i) => ({
        ...p,
        rank: i + 1,
      }));

    set({ prizes: newPrizes });
  },

  saveToFirebase: async () => {
    const { prizes, displayMode, isLocked, isClosed, isTestMode } = get();
    const docRef = doc(db, config.siteId, 'settings', 'prizes', 'data');

    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);

        const remoteData = snap.exists() ? snap.data() : {};
        const remoteRawItems = Array.isArray(remoteData.items) ? remoteData.items : [];
        const remoteItems = normalizePrizeList(remoteRawItems);

        const mergedItems: Prize[] = prizes.map((localPrize, index) => {
          const safeLocalQuantity = Math.max(0, Number(localPrize.quantity) || 0);

          const remotePrize =
            remoteItems.find((item) => item.id === localPrize.id) ||
            remoteItems.find((item) => item.rank === index + 1);

          if (!remotePrize) {
            return {
              ...localPrize,
              rank: index + 1,
              quantity: safeLocalQuantity,
              remaining: safeLocalQuantity,
              requiresShipping: !!localPrize.requiresShipping,
            };
          }

          const prevQuantity = Math.max(0, Number(remotePrize.quantity) || 0);
          const prevRemaining = Math.max(0, Number(remotePrize.remaining) || 0);
          const quantityDelta = safeLocalQuantity - prevQuantity;

          const nextRemaining = Math.max(
            0,
            Math.min(safeLocalQuantity, prevRemaining + quantityDelta)
          );

          return {
            ...localPrize,
            id: remotePrize.id || localPrize.id,
            rank: index + 1,
            quantity: safeLocalQuantity,
            remaining: nextRemaining,
            requiresShipping: !!localPrize.requiresShipping,
          };
        });

        transaction.set(docRef, {
          items: mergedItems,
          displayMode,
          isLocked,
          isClosed,
          isTestMode,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error('Firebase 저장 실패:', error);
      throw error;
    }
  },

  loadFromFirebase: async () => {
    try {
      const docRef = doc(db, config.siteId, 'settings', 'prizes', 'data');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          prizes: normalizePrizeList(data.items || []),
          displayMode: data.displayMode || 'both',
          isLocked: data.isLocked || false,
          isClosed: data.isClosed || false,
          isTestMode: data.isTestMode || false,
        });
      } else {
        // 데이터가 없을 때 기본 상품 및 리허설 모드 세팅
        set({
          prizes: defaultPrizes,
          displayMode: 'both',
          isLocked: false,
          isClosed: false,
          isTestMode: true, 
        });
      }
    } catch (error) {
      console.error('Firebase 로드 실패:', error);
    }
  },

  listenToFirebase: () => {
    const docRef = doc(db, config.siteId, 'settings', 'prizes', 'data');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          prizes: normalizePrizeList(data.items || []),
          displayMode: data.displayMode || 'both',
          isLocked: data.isLocked || false,
          isClosed: data.isClosed || false,
          isTestMode: data.isTestMode || false,
        });
      } else {
        // 데이터가 없을 때 기본 상품 및 리허설 모드 세팅
        set({
          prizes: defaultPrizes,
          displayMode: 'both',
          isLocked: false,
          isClosed: false,
          isTestMode: true, 
        });
      }
    });

    return unsubscribe;
  },

  drawWithTransaction: async (drawCount: number) => {
    const docRef = doc(db, config.siteId, 'settings', 'prizes', 'data');

    const txResult = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);

      if (!snap.exists()) {
        throw new Error('추첨 설정이 없습니다.');
      }

      const data = snap.data();
      const items = normalizePrizeList(data.items || []);
      const isClosed = data.isClosed === true;
      const isTestMode = data.isTestMode === true;
      const displayMode = data.displayMode || 'both';
      const isLocked = data.isLocked === true;

      if (isClosed) {
        throw new Error('럭키드로우가 마감되었습니다.');
      }

      const totalRemaining = items.reduce((sum, p) => sum + (p.remaining || 0), 0);

      if (totalRemaining < drawCount) {
        throw new Error('남은 상품 수량보다 더 많이 뽑을 수 없습니다.');
      }

      const pool: string[] = [];
      items.forEach((prize) => {
        const remaining = Math.max(0, prize.remaining || 0);
        for (let i = 0; i < remaining; i += 1) {
          pool.push(prize.id);
        }
      });

      const results: DrawnPrize[] = [];

      for (let i = 0; i < drawCount; i += 1) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const selectedId = pool[randomIndex];

        pool.splice(randomIndex, 1);

        const target = items.find((p) => p.id === selectedId);

        if (!target) {
          throw new Error('상품 정보를 찾을 수 없습니다.');
        }

        results.push({
          rank: target.rank,
          name: target.name,
          requiresShipping: !!target.requiresShipping,
        });

        if (!isTestMode) {
          target.remaining = Math.max(0, (target.remaining || 0) - 1);
        }
      }

      if (!isTestMode) {
        transaction.update(docRef, {
          items,
          updatedAt: serverTimestamp(),
        });
      }

      return {
        results,
        items,
        displayMode,
        isLocked,
        isClosed,
        isTestMode,
      };
    });

    set({
      prizes: txResult.items,
      displayMode: txResult.displayMode,
      isLocked: txResult.isLocked,
      isClosed: txResult.isClosed,
      isTestMode: txResult.isTestMode,
    });

    return txResult.results;
  },
}));