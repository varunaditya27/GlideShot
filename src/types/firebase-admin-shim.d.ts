// Minimal shim to appease TS when firebase-admin types are not resolved by bundler
declare module 'firebase-admin' {
  export interface AdminCredential {
    cert: (options: { projectId: string; clientEmail: string; privateKey: string }) => unknown;
  }
  export interface Admin {
    apps: unknown[];
    initializeApp: (options: unknown) => void;
    credential: AdminCredential;
    firestore: () => unknown;
    auth: () => unknown;
  }
  const admin: Admin;
  export default admin;
}
