import { createWorker } from 'tesseract.js';
export async function extractText(source) {
    const worker = await createWorker('eng');

    try {
        await worker.setParameters({
            tessedit_pageseg_mode: '3',
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$-.:/ ', // Restrict characters
        });

        const { data: { text } } = await worker.recognize(source);
        await worker.terminate();

        return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
        if (worker) await worker.terminate();
        console.error("OCR Extraction Error:", error);
        throw new Error("Could not read text from the uploaded document.");
    }
}