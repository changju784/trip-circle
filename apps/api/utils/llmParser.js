import { GoogleGenerativeAI } from "@google/generative-ai";
import { StopCategoryEnum } from '../schema/const/TripConstants.js';
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-2.5-flash";

/**
 * Parses a travel document directly from an image using Gemini Vision.
 */
export async function parseDocumentVision(imageUrl, tripContext) {
    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: { responseMimeType: "application/json" }
    });

    try {
        // 1. Fetch image and convert to Base64
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = response.headers.get("content-type") || "image/png";

        // 2. Multimodal prompt (using your requested structure)
        const prompt = `
    You are a specialized travel document parser for the 'TripCircle' app. 
    Your task is to transform messy OCR text into structured JSON that perfectly pre-fills a Trip Stop modal.

    TRIP CONTEXT:
    - Trip Title: ${tripContext.title}
    - Destinations: ${tripContext.destinations.map(d => d.label).join(', ')}

    REQUIRED JSON STRUCTURE:
    {
        "category": "Must be exactly one of: [${Object.values(StopCategoryEnum).join(', ')}]",
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
        "aiInsights": {
            "matchScore": 0.0 to 1.0, 
            "reasoning": "Explain if the date/location matches the trip context."
        },
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

        // 3. Send multimodal request (Text + Image)
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType } }
        ]);

        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("LLM Vision Parsing Error:", error);
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