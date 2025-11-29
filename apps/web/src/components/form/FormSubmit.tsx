import { Button } from "../ui/Button";

export function FormSubmit({ label, isSubmitting }: any) {
    return (
        <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
        >
            {isSubmitting ? "Processing..." : label}
        </Button>
    );
}
