import { GoogleGenAI } from "@google/genai";
import { Transaction, Product } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateBusinessInsights = async (
  transactions: Transaction[],
  products: Product[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "AI configuration missing. Please check API Key.";

  // Prepare data summary for the AI to avoid token limits with raw JSON
  const salesSummary = transactions.slice(0, 50).map(t => ({
    date: new Date(t.timestamp).toLocaleDateString(),
    total: t.totalAmount,
    items: t.items.map(i => i.name).join(", ")
  }));

  const inventorySummary = products.filter(p => p.stock < 10).map(p => ({
    name: p.name,
    stock: p.stock
  }));

  const prompt = `
    You are a senior business analyst for an auto repair shop.
    Here is a summary of recent sales transactions (last 50):
    ${JSON.stringify(salesSummary)}

    Here is a list of low stock items:
    ${JSON.stringify(inventorySummary)}

    Please provide a concise business insight report (max 150 words).
    1. Identify the top performing product or service category.
    2. Highlight any critical stock issues.
    3. Suggest a marketing action based on sales trends.
    
    Format the output as simple HTML with <strong> tags for emphasis. Do not use markdown code blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this moment.";
  }
};

export const analyzeProductPricing = async (product: Product): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "AI unavailable.";

    const margin = ((product.sellingPrice - product.buyingPrice) / product.sellingPrice) * 100;

    const prompt = `
      Product: ${product.name}
      Category: ${product.category}
      Buying Price: $${product.buyingPrice}
      Selling Price: $${product.sellingPrice}
      Current Margin: ${margin.toFixed(2)}%

      Briefly evaluate this pricing strategy for an auto repair shop. Is the margin healthy? (Target is usually 30-50% for parts).
      Provide a 1-sentence recommendation.
    `;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text || "No analysis available.";
      } catch (error) {
        return "Analysis failed.";
      }
}
