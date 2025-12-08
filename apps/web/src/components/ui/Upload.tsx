import { Label } from "@/components/ui/label";
import { Input } from "./Input";

interface UploadProps {
    /**
     * The text displayed above the input.
     * @default "Upload File"
     */
    label?: string;

    /**
     * Accepted file types (e.g., "image/*", ".pdf", "audio/*").
     * @default "image/*"
     */
    accept?: string;

    /**
     * Callback fired when a file is processed.
     * Returns the base64 string of the file or null on error.
     */
    onFileSelect: (base64Data: string | null, fileName: string) => void;
}

export function Upload({
    onFileSelect,
    label = "Upload File",
    accept = "image/*"
}: UploadProps) {

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        const data = await new Promise<string | null>((res) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result));
            r.onerror = () => res(null);
            r.readAsDataURL(f);
        });

        onFileSelect(data, f.name);
    };

    return (
        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="upload-file">{label}</Label>
            <Input
                id="upload-file"
                type="file"
                accept={accept}
                className="cursor-pointer bg-white"
                onChange={handleFileChange}
            />
        </div>
    );
}