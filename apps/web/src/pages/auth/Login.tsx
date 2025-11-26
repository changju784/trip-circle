import { useForm } from "react-hook-form";
import FormContainer from "./../../components/form/FormContainer";
import { FormField } from "./../../components/form/FormField";
import { FormSubmit } from "./../../components/form/FormSubmit";

export default function LoginPage() {
    const { control, handleSubmit, formState } = useForm();

    const onSubmit = async (data: any) => {
        console.log("Login:", data);
    };

    return (
        <FormContainer
            title="Welcome Back"
            subtitle="Login to access your travel plans"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            </form>
        </FormContainer>
    );
}
