import { Controller } from "react-hook-form";
import { Input } from "../ui/Input";

export function FormField({
    control,
    name,
    label,
    type = "text",
    placeholder,
    rules = {},
}: any) {
    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field, fieldState }) => (
                <div className="space-y-1">
                    <label className="text-sm font-medium">{label}</label>

                    <Input
                        {...field}
                        type={type}
                        placeholder={placeholder}
                        className={fieldState.error ? "border-destructive" : ""}
                    />

                    {fieldState.error && (
                        <p className="text-destructive text-sm">{fieldState.error.message}</p>
                    )}
                </div>
            )}
        />
    );
}
