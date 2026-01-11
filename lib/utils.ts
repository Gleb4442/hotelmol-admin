// lib/utils.ts

/**
 * Converts a File object to a Base64 encoded string, without the data URL prefix.
 * @param file The file to convert.
 * @returns A promise that resolves with the Base64 string.
 */
export const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});
