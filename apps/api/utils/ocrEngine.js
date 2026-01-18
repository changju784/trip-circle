import { createWorker } from 'tesseract.js';

/**
 * Extracts raw text from an image buffer or URL.
 * @param {Buffer|String} source - The file buffer from Multer or a URL string.
 * @returns {Promise<string>} - The extracted raw text.
 */
export async function extractText(source) {
    // Create a worker instance
    const worker = await createWorker('eng'); // Initializing for English

    try {
        // Perform OCR on the source (buffer or URL)
        const { data: { text } } = await worker.recognize(source);

        // Terminate worker to free up server memory
        await worker.terminate();

        // Basic normalization: remove excessive newlines and trim
        return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
        // Ensure worker is terminated even on failure
        if (worker) await worker.terminate();

        console.error("OCR Extraction Error:", error);
        throw new Error("Could not read text from the uploaded document.");
    }
}