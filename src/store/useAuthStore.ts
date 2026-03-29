import { create } from 'zustand';
import { auth } from '../firebase/firebaseConfig';
import config from '../config.json';
import {
  browserLocalPersistence,
  onIdTokenChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

interface AuthStore {
  user: User | null;
  isAdmin: boolean;
  authInitialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  listenAuthState: () => () => void;
}

const canAccessAdminFromClaims = (claims: Record<string, unknown>) => {
  console.log('AUTH CLAIMS', claims);

  return (
    claims.isSuperAdmin === true ||
    (claims.isAdmin === true && claims.siteId === config.siteId)
  );
};

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAdmin: false,
  authInitialized: false,

  login: async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await userCred.user.getIdTokenResult(true);

      console.log('LOGIN CLAIMS', tokenResult.claims);

      const canAccessAdmin = canAccessAdminFromClaims(tokenResult.claims);

      if (!canAccessAdmin) {
        await signOut(auth);
        set({ user: null, isAdmin: false, authInitialized: true });
        return false;
      }

      set({
        user: userCred.user,
        isAdmin: true,
        authInitialized: true,
      });

      return true;
    } catch (e) {
      console.error('LOGIN ERROR', e);
      set({ user: null, isAdmin: false, authInitialized: true });
      return false;
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, isAdmin: false, authInitialized: true });
  },

  listenAuthState: () =>
    onIdTokenChanged(auth, async (user) => {
      try {
        if (!user) {
          set({ user: null, isAdmin: false, authInitialized: true });
          return;
        }

        const tokenResult = await user.getIdTokenResult(true);
        console.log('LISTENER CLAIMS', tokenResult.claims);

        const canAccessAdmin = canAccessAdminFromClaims(tokenResult.claims);

        set({
          user,
          isAdmin: canAccessAdmin,
          authInitialized: true,
        });
      } catch (e) {
        console.error('AUTH LISTENER ERROR', e);
        set({ user: null, isAdmin: false, authInitialized: true });
      }
    }),
}));

export default useAuthStore;