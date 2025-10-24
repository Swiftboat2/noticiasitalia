
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { type FirestorePermissionError } from '@/firebase/errors';

/**
 * A client component that listens for Firestore permission errors and throws them,
 * allowing Next.js dev overlay to catch and display them.
 * This component should be placed in the root layout.
 * It renders nothing to the DOM.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Throwing the error here will cause it to be picked up by
      // the Next.js development error overlay.
      // NOTE: This will not be caught by React Error Boundaries.
      // This is intentional. We want the full-screen dev overlay.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
