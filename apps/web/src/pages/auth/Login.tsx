import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FormContainer from "./../../components/form/FormContainer";
import { FormField } from "./../../components/form/FormField";
import { FormSubmit } from "./../../components/form/FormSubmit";
import { useAuth } from "./../../auth/hook/use-auth";
import { Button } from "./../../components/ui/Button";
import GoogleLogo from "./../../assets/google.svg";

export default function LoginPage() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const { control, handleSubmit, formState } = useForm();
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (data: any) => {
        setError(null);
        try {
            await signIn(data.email, data.password);
            navigate("/trip-circle/dashboard");
        } catch (err: any) {
            const errorMessage = err?.message || "Login failed. Please try again.";
            setError(errorMessage);
            console.error("Login Error:", err);
        }
    };

    return (
        <FormContainer
            title="Welcome Back"
            subtitle="Login to access your travel plans"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <FormField
                    control={control}
                    name="email"
                    label="Email"
                    placeholder="you@example.com"
                    rules={{
                        required: "Email is required",
                        pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
                    }}
                />

                <FormField
                    control={control}
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="********"
                    rules={{ required: "Password is required" }}
                />

                <FormSubmit
                    label="Login"
                    isSubmitting={formState.isSubmitting}
                />

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <SignInWithGoogleButton />
            </form>
        </FormContainer>
    );
}

function SignInWithGoogleButton() {
    const { signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = () => {
        setLoading(true);
        setError(null);
        try {
            // This redirects to backend, which will handle OAuth and redirect back with token
            signInWithGoogle();
        } catch (err: any) {
            const errorMessage = err?.message || "Google sign-in failed. Please try again.";
            setError(errorMessage);
            console.error("Google Sign-In Error:", err);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            {error && (
                <div className="p-2 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
                    {error}
                </div>
            )}
            <Button
                type="button"
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
            >
                <img src={GoogleLogo} alt="Google Logo" className="w-5 h-5" />
                {loading ? "Signing in..." : "Continue with Google"}
            </Button>
        </div>
    );
}
