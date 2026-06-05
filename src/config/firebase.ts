import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyAvwm_u_HwVsgebFyu4aa1wqkgJSZDUa4o',
  authDomain:        'vendorportal-d5f23.firebaseapp.com',
  projectId:         'vendorportal-d5f23',
  storageBucket:     'vendorportal-d5f23.firebasestorage.app',
  messagingSenderId: '480500780558',
  appId:             '1:480500780558:web:7e00b5d043f3eb03f3f65f',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// experimentalForceLongPolling is required for Firebase Firestore to work in
// React Native — the default gRPC/WebChannel transport is not supported.
export const firestoreDb = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
