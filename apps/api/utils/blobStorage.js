import { put, del } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob Storage
 * @param {Buffer} fileBuffer - The file data as a buffer
 * @param {string} filename - The name of the file
 * @param {string} contentType - The MIME type of the file
 * @returns {Promise<{url: string, pathname: string}>} The uploaded file URL and pathname
 */
export async function uploadToBlob(fileBuffer, filename, contentType) {
    try {
        const blob = await put(filename, fileBuffer, {
            access: 'public',
            contentType,
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        return {
            url: blob.url,
            pathname: blob.pathname,
        };
    } catch (error) {
        console.error('Blob upload error:', error);
        throw new Error('Failed to upload file to blob storage');
    }
}

/**
 * Delete a file from Vercel Blob Storage
 * @param {string} url - The URL of the file to delete
 * @returns {Promise<void>}
 */
export async function deleteFromBlob(url) {
    try {
        await del(url, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
    } catch (error) {
        console.error('Blob deletion error:', error);
        throw new Error('Failed to delete file from blob storage');
    }
}
