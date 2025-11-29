import { useContext } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    sendEmailVerification,
    updateProfile,
    UserCredential as FirebaseUserCredential,
    FacebookAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "../../components/auth/AuthProvider";

export const useAuth = () => {
    const { user, loading } = useContext(AuthContext);

    // Email + password login
    const signIn = async (email: string, password: string): Promise<FirebaseUserCredential> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    }

    // Email + password signup
    const signUp = async (email: string, password: string, username?: string): Promise<FirebaseUserCredential> => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Set username as displayName
        if (username) {
            await updateProfile(userCredential.user, {
                displayName: username
            });
        }

        await sendEmailVerification(userCredential.user);
        return userCredential;
    }

    // Google OAuth login
    const signInWithGoogle = async (): Promise<FirebaseUserCredential> => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential;
    }

    // Facebook OAuth login
    const signInWithFacebook = async (): Promise<FirebaseUserCredential> => {
        const provider = new FacebookAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential;
    }

    // Sign out
    const logOut = async () => {
        return signOut(auth);
    };

    return {
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithFacebook,
        logOut,
    };
};
