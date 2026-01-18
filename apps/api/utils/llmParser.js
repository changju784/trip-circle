import { GoogleGenerativeAI } from "@google/generative-ai";
import { StopCategoryEnum } from '../schema/const/TripConstants.js';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parses raw OCR text into a structured JSON object for TripCircle.
 * @param {string} rawText - The text extracted by Tesseract.
 * @returns {Promise<Object>} - Structured travel data.
 */
export async function parseDocumentText(rawText) {
    // We use Gemini 1.5 Flash for speed and cost-efficiency
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        // This forces the model to output a valid JSON string
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    You are a specialized travel document parser for the 'TripCircle' app. 
    Your task is to transform messy OCR text into structured JSON that perfectly pre-fills a Trip Stop modal.

    OCR TEXT TO PARSE:
    """
    ${rawText}
    """

    REQUIRED JSON STRUCTURE:
    {
        "category": "Must be exactly one of: [${StopCategoryEnum.join(', ')}]",
        "vendor": "Name of the provider (airline, hotel, restaurant). Use this as the 'Title' of the stop.",
        "amount": "The total cost as a Number. Omit all currency symbols and commas.",
        "currency": "The 3-letter ISO currency code (e.g., USD, KRW, EUR).",
        "date": "The primary travel or purchase date in ISO 8601 format (YYYY-MM-DD).",
        "time": "The specific start time in 24-hour format (HH:mm). If not found, default to '12:00'.",
        "location": {
            "name": "The venue name, airport name, or city.",
            "address": "The full physical street address for Google Maps integration. If unavailable, return null."
        },
        "description": "A concise 1-sentence summary (e.g., 'Dinner at Momofuku' or 'Flight to London').",
        "metadata": {
            "confNumber": "The confirmation, reservation, or ticket number.",
            "flightNumber": "For airlines: the flight number (e.g., AA123). Otherwise null.",
            "seatOrRoom": "Seat number or Room type/number if visible."
        }
    }

    STRICT RULES:
    1. CATEGORY MAPPING:
       - If it's a Flight/Train/Bus ticket -> 'transit'.
       - If it's a Hotel/Airbnb/Hostel confirmation -> 'lodging'.
       - If it's a Restaurant/Cafe receipt -> 'dining'.
       - If it's a Museum/Tour/Concert ticket -> 'activity'.
    2. DATA INTEGRITY:
       - Return null for any missing field (except 'time' which defaults to '12:00').
       - Ensure 'amount' is a pure Number, not a String.
    3. OUTPUT:
       - Return ONLY valid JSON. Do not include any conversational text or markdown blocks.
`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the string into a JavaScript object
        return JSON.parse(responseText);
    } catch (error) {
        console.error("LLM Parsing Error:", error);
        // Fallback: return an empty structure so the service doesn't crash
        return {
            category: 'none',
            vendor: null,
            amount: null,
            currency: null,
            date: null,
            location: { name: null, address: null },
            description: "Parsing failed",
            metadata: {}
        };
    }
}