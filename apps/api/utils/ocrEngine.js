import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

/**
 * Pre-processes an image buffer to maximize OCR accuracy.
 */
async function preprocessImage(buffer) {
    return await sharp(buffer)
        .grayscale() // Remove color distractions
        .normalize() // Stretch contrast
        .threshold(160) // Convert to sharp black and white
        .toBuffer();
}

/**
 * Main OCR function: Handles source fetching, processing, and recognition.
 */
export async function extractText(source) {
    const worker = await createWorker('eng');

    try {
        let imageBuffer = source;

        if (typeof source === 'string' && source.startsWith('http')) {
            const response = await fetch(source);
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        }

        const cleanBuffer = await preprocessImage(imageBuffer);

        await worker.setParameters({
            tessedit_pageseg_mode: '3',
        });

        const { data: { text } } = await worker.recognize(cleanBuffer);
        await worker.terminate();

        return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
        if (worker) await worker.terminate();
        console.error("OCR Extraction Error:", error);
        throw error;
    }
}