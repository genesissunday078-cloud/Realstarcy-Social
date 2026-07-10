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

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret");
    }

    let serviceAccount: { project_id: string; client_email: string; private_key: string };
    const trimmed = raw.trim();
    const candidates = [
      trimmed,
      trimmed.startsWith("{") ? trimmed : `{${trimmed}`,
      trimmed.endsWith("}") ? trimmed : `${trimmed}}`,
      !trimmed.startsWith("{") && !trimmed.endsWith("}") ? `{${trimmed}}` : null,
    ].filter((c): c is string => c !== null);

    let parsed: unknown;
    for (const candidate of candidates) {
      try {
        parsed = JSON.parse(candidate);
        break;
      } catch {
        // try next candidate
      }
    }

    if (!parsed) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
    serviceAccount = parsed as typeof serviceAccount;

    const projectId = serviceAccount.project_id;
    const clientEmail = serviceAccount.client_email;
    const privateKey = serviceAccount.private_key;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id, client_email, or private_key",
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
