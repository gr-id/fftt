"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function isConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.appId &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId,
  );
}

export function getFirebaseClientApp() {
  if (!isConfigured()) {
    throw new Error("Firebase client config is missing.");
  }

  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function hasFirebaseClientConfig() {
  return isConfigured();
}
