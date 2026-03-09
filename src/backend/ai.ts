import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateAgriScoreExplanation(input: any, score: number, riskCategory: string) {
  const prompt = `
    You are an AI Credit Analyst for AgriScore, a fintech platform for farmers.
    Based on the following farmer data, explain why they received an AgriScore of ${score}/100 (${riskCategory}).
    
    Farmer Data:
    - Land Size: ${input.land.land_size_acres} acres
    - Soil Type: ${input.land.soil_type}
    - Ownership: ${input.land.ownership_status}
    - Historical Rainfall: ${input.weather.historical_rainfall} mm
    - Drought Probability: ${input.weather.drought_probability}
    - Flood Risk: ${input.weather.flood_risk}
    - Irrigation Type: ${input.crop.irrigation_type}
    - Avg Yield: ${input.crop.avg_yield_last_3_seasons} units/acre
    - Price Volatility: ${input.market.price_volatility}
    - Annual Income: ₹${input.financial.annual_income}
    - Existing Loans: ₹${input.financial.existing_loans}
    - Repayment History: ${input.financial.repayment_history}
    - CIBIL Score: ${input.credit.cibil_score}

    Provide a structured report in Markdown format including:
    1. Summary of why the score was given.
    2. Key strengths.
    3. Key risks.
    4. Suggested improvements for the farmer to improve their creditworthiness.
    
    IMPORTANT: Return ONLY the raw markdown text. Do NOT wrap the response in \`\`\`markdown code blocks.
    Keep it professional, concise, and empathetic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.replace(/```markdown\n/gi, '').replace(/```\n?/g, '').trim() || "No explanation generated.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Unable to generate AI explanation at this time.";
  }
}
