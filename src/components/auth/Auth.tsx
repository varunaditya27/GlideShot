"use client";

import React, { useMemo, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(email);
    const passOk = password.length >= 6;
    return emailOk && passOk;
  }, [email, password]);

  function mapFirebaseError(err: FirebaseError): string {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email or password.';
      case 'auth/user-not-found':
        return 'No account found for this email.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      default:
        return err.message ?? 'Authentication error.';
    }
  }

  async function applyPersistence() {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await applyPersistence();
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const fbErr = err as FirebaseError;
      setError(mapFirebaseError(fbErr));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await applyPersistence();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const fbErr = err as FirebaseError;
      setError(mapFirebaseError(fbErr));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await applyPersistence();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const fbErr = err as FirebaseError;
      setError(mapFirebaseError(fbErr));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!/.+@.+\..+/.test(email)) {
      setError('Enter your email to receive a reset link.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent. Please check your inbox.');
    } catch (err) {
      const fbErr = err as FirebaseError;
      setError(mapFirebaseError(fbErr));
    } finally {
      setLoading(false);
    }
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '360px',
    margin: 'auto',
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: 'white',
  };

  const buttonPrimary: React.CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'linear-gradient(90deg, oklch(0.398_0.07_227.392), oklch(0.828_0.189_84.429))',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 700 as React.CSSProperties['fontWeight']
  };

  const buttonSecondary: React.CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.12)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600 as React.CSSProperties['fontWeight']
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#333' }}>
      <form style={formStyle} onSubmit={mode === 'login' ? handleLogin : handleSignUp}>
        <h2 style={{ color: 'white', marginBottom: 6 }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={() => setMode('login')} style={{ ...buttonSecondary, opacity: mode === 'login' ? 1 : 0.7 }}>Login</button>
          <button type="button" onClick={() => setMode('signup')} style={{ ...buttonSecondary, opacity: mode === 'signup' ? 1 : 0.7 }}>Sign Up</button>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={inputStyle}
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            style={{ ...inputStyle, width: '100%' }}
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} style={{ position: 'absolute', right: 10, top: 8, background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading || !canSubmit} style={{ ...buttonPrimary, opacity: loading || !canSubmit ? 0.6 : 1 }}>
          {loading ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : (mode === 'login' ? 'Log In' : 'Sign Up')}
        </button>
        <button type="button" onClick={handleGoogle} disabled={loading} style={buttonSecondary}>
          Continue with Google
        </button>
        <button type="button" onClick={handleResetPassword} disabled={loading} style={buttonSecondary}>
          Forgot password?
        </button>
      </form>
    </div>
  );
}
