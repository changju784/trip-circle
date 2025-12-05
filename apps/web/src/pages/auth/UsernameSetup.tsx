import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./../../auth/hook/use-auth";
import { FormField } from "./../../components/form/FormField";
import { Button } from "./../../components/ui/Button";
import { apiPut } from "@/lib/api";

export default function UsernameSetup() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { control, handleSubmit, formState } = useForm();
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (data: any) => {
        setError(null);
        try {
            if (user && user.id) {
                // Update user name on backend
                await apiPut(`/api/users/${user.id}`, {
                    name: data.username
                });
                navigate("/trip-circle/dashboard");
            } else {
                setError("No user found. Please sign in again.");
            }
        } catch (err: any) {
            setError(err?.message || "Failed to set username");
            console.error("Username Error:", err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Choose a Username</h2>
                    <p className="text-sm text-gray-600 mt-2">
                        Before you continue, please choose a unique username
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-lg text-sm">
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

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={formState.isSubmitting}
                    >
                        {formState.isSubmitting ? "Saving..." : "Continue"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

