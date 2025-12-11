import { Label } from "@/components/ui/label";
import { Input } from "./Input";

interface UploadProps {
    label?: string;
    accept?: string;
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
            <Label htmlFor="upload-file" className="text-gray-700 dark:text-gray-200">
                {label}
            </Label>

            <Input
                id="upload-file"
                type="file"
                accept={accept}
                className="cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 file:text-gray-700 dark:file:text-gray-200 file:bg-gray-100 dark:file:bg-gray-700 file:mr-4 file:px-2 file:rounded-sm"
                onChange={handleFileChange}
            />
        </div>
    );
}
