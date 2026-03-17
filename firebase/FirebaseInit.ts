
import { initializeApp } from 'firebase/app';
// @ts-ignore -- getReactNativePersistence exists in the RN build of firebase/auth but is missing from TS types
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './FirebaseConfig';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

//serviço de autenticação (Authentication) com persistência via AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

//serviço de banco de dados (Firestore)
export const firestore = getFirestore(app);

// serviço de armazenamento (Storage)
export const storage = getStorage(app);