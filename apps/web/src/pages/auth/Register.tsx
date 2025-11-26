import { useForm } from "react-hook-form";
import FormContainer from "./../../components/form/FormContainer";
import { FormField } from "./../../components/form/FormField";
import { FormSubmit } from "./../../components/form/FormSubmit";

export default function SignupPage() {
    const { control, handleSubmit, watch, formState } = useForm();

    const onSubmit = async (data: any) => {
        console.log("Signup:", data);
    };

    return (
        <FormContainer
            title="Create Account"
            subtitle="Join TripCircle and start planning together"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <FormField
                    control={control}
                    name="name"
                    label="Name"
                    placeholder="John Doe"
                    rules={{ required: "Name is required" }}
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
                    placeholder="********"
                    rules={{ required: "Password is required" }}
                />

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
