import React, { createContext, useContext, useEffect, useState } from 'react';
import app, { auth } from './firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';

type User = {
    uid: string;
    email: string | null;
    displayName?: string | null;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    signup: (email: string, password: string, name?: string) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

function mapUser(u: FirebaseUser | null): User | null {
    if (!u) return null;
    return { uid: u.uid, email: u.email, displayName: u.displayName };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(mapUser(u));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    async function login(email: string, password: string) {
        if (!auth) throw new Error('Firebase not configured');
        const res = await signInWithEmailAndPassword(auth, email, password);
        const mapped = mapUser(res.user);
        setUser(mapped);
        return mapped as User;
    }

    async function signup(email: string, password: string) {
        if (!auth) throw new Error('Firebase not configured');
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const mapped = mapUser(res.user);
        setUser(mapped);
        return mapped as User;
    }

    async function logout() {
        if (!auth) return;
        await firebaseSignOut(auth);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
