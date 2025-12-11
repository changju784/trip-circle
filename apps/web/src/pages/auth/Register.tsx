import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FormContainer from "./../../components/form/FormContainer";
import { FormField } from "./../../components/form/FormField";
import { FormSubmit } from "./../../components/form/FormSubmit";
import { useAuth } from "./../../auth/hook/use-auth";

function PasswordStrengthIndicator({ password }: { password: string }) {
    if (!password) return null;

    const getStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 6) strength++;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
        return strength;
    };

    const strength = getStrength(password);
    const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
    const strengthColors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-yellow-500",
        "bg-blue-500",
        "bg-green-500"
    ];

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                            i < strength ? strengthColors[strength - 1] : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium">{strengthLabels[strength - 1] || "Too short"}</span>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
                <li className={password.length >= 6 ? "text-green-600" : ""}>
                    {password.length >= 6 ? "✓" : "○"} At least 6 characters
                </li>
                <li className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
                    {password.length >= 8 ? "✓" : "○"} 8+ characters (recommended)
                </li>
                <li className={/\d/.test(password) ? "text-green-600" : "text-gray-500"}>
                    {/\d/.test(password) ? "✓" : "○"} Contains a number
                </li>
                <li className={(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? "text-green-600" : "text-gray-500"}>
                    {(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? "✓" : "○"} Mixed case letters
                </li>
            </ul>
        </div>
    );
}

export default function SignupPage() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const { control, handleSubmit, watch, formState } = useForm();
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (data: any) => {
        setError(null);
        try {
            await signUp(data.email, data.password, data.username);
            navigate("/trip-circle/dashboard");
        } catch (err: any) {
            const errorMessage = err?.message || "Sign up failed. Please try again.";
            setError(errorMessage);
            console.error("Sign Up Error:", err);
        }
    };

    return (
        <FormContainer
            title="Create Account"
            subtitle="Join TripCircle and start planning together"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <FormField
                    control={control}
                    name="username"
                    label="Username"
                    placeholder="johndoe"
                    rules={{
                        required: "Username is required",
                        minLength: {
                            value: 3,
                            message: "Username must be at least 3 characters"
                        },
                        pattern: {
                            value: /^[a-zA-Z0-9_]+$/,
                            message: "Username can only contain letters, numbers, and underscores"
                        }
                    }}
                />

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
                    placeholder="Minimum 6 characters"
                    rules={{
                        required: "Password is required",
                        minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters"
                        }
                    }}
                />

                <PasswordStrengthIndicator password={watch("password")} />

                <FormField
                    control={control}
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    placeholder="********"
                    rules={{
                        validate: (v: any) =>
                            v === watch("password") || "Passwords do not match",
                    }}
                />

                <FormSubmit
                    label="Sign Up"
                    isSubmitting={formState.isSubmitting}
                />
            </form>
        </FormContainer>
    );
}
