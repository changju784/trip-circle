import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Receipt, Upload, Eye, Trash2, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { TripDocument, Trip } from "@/lib/trips/trips-api";
import { useTripsContext } from "@/contexts/TripsContext";

interface DocumentsProps {
    tripId: string;
    documents: TripDocument[];
    onDocumentsChange: (updatedTrip: Trip) => void;
    onSuggestionReview: (doc: TripDocument) => void; // New prop for Auto-Fill
}

export default function Documents({ tripId, documents, onDocumentsChange, onSuggestionReview }: DocumentsProps) {
    const { uploadDocument, deleteDocument, parseDocument } = useTripsContext();
    const [uploading, setUploading] = useState(false);
    const [parsingId, setParsingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const updatedTrip = await uploadDocument(tripId, file);
            onDocumentsChange(updatedTrip);
            event.target.value = "";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleParse = async (docId: string) => {
        setParsingId(docId);
        try {
            await parseDocument(tripId, docId);
        } catch (err) {
            setError("AI parsing failed. Please try again.");
        } finally {
            setParsingId(null);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm("Delete this document?")) return;
        try {
            const updatedTrip = await deleteDocument(tripId, docId);
            onDocumentsChange(updatedTrip);
        } catch (err) {
            setError("Failed to delete document");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Documents & Receipts</h3>
                    <p className="text-sm text-gray-500">Upload and AI-parse your travel documents</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}

            <div className="mb-8 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/20 text-center">
                <input id="doc-upload" type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Click to upload a new document</p>
                <Button variant="outline" disabled={uploading} onClick={() => document.getElementById("doc-upload")?.click()}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Select File"}
                </Button>
            </div>

            <div className="space-y-4">
                {documents.map((doc) => (
                    <div key={doc._id} className="flex flex-col gap-2 p-4 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="font-semibold truncate max-w-[200px]">{doc.name}</div>
                                <div className="text-xs text-gray-500">{doc.status}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(doc.status === 'uploaded' || doc.status === 'failed') && (
                                    <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleParse(doc._id)} disabled={parsingId === doc._id}>
                                        {parsingId === doc._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                                        Parse
                                    </Button>
                                )}
                                <a href={doc.url} target="_blank" className="p-2 text-gray-400" rel="noreferrer"><Eye className="w-4 h-4" /></a>
                                <button onClick={() => handleDelete(doc._id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* STEP 3: SUGGESTION RESULT LAYER */}
                        {doc.status === 'parsed' && !doc.isApplied && (
                            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 flex items-center justify-between">
                                <div className="flex gap-2 items-start">
                                    <AlertCircle className={`w-4 h-4 mt-0.5 ${(doc.extractedData?.aiInsights?.matchScore ?? 0) < 0.6 ? 'text-amber-500' : 'text-green-500'}`} />
                                    <div>
                                        <p className="text-xs font-bold text-indigo-900">AI Suggestion: {doc.extractedData?.vendor}</p>
                                        <p className="text-[10px] text-indigo-700">{doc.extractedData?.aiInsights?.reasoning}</p>
                                    </div>
                                </div>
                                <Button size="sm" className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => onSuggestionReview(doc)}>
                                    Review & Add
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}