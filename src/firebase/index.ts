'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }
  
  // When not in a production Firebase App Hosting environment, we need to
  // use the config object.
  const isProductionAppHosting = process.env.NEXT_PUBLIC_FIREBASE_APP_HOSTING_URL;
  
  let firebaseApp;
  if (isProductionAppHosting) {
    // In production on App Hosting, initialize without config.
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      // If auto-init fails even on App Hosting, fall back to config.
      console.warn('Automatic initialization failed on App Hosting. Falling back to firebase config object.', e);
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    // In dev or other environments, initialize with the config object.
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';