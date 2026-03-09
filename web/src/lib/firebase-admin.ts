import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    null
  );
}

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  return raw ? raw.replace(/\\n/g, "\n") : null;
}

function createApp(): App {
  const projectId = getProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? null;
  const privateKey = getPrivateKey();

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  if (projectId) {
    return initializeApp({ projectId });
  }

  return initializeApp();
}

const app = getApps()[0] ?? createApp();

export const firestore = getFirestore(app);
export const firebaseAuth = getAuth(app);
