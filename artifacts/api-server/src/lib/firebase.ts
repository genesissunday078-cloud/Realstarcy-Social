import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let app: App;

function getFirebaseApp(): App {
  if (!app) {
    const existing = getApps();
    if (existing.length > 0) {
      app = existing[0]!;
      return app;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase credentials: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY must be set",
      );
    }

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: `${projectId}.firebasestorage.app`,
    });
  }
  return app;
}

export function getBucket() {
  return getStorage(getFirebaseApp()).bucket();
}
