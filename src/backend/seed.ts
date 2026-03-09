import db, { initDb } from "./database.ts";
import { calculateAgriScore, getLoanRecommendation } from "./scoring.ts";
import { generateAgriScoreExplanation } from "./ai.ts";

export async function seedData() {
  initDb();
  
  const count = db.prepare("SELECT COUNT(*) as count FROM farmers").get().count;
  if (count > 0) return;

  console.log("Seeding initial farmer data...");

  const farmers = [
    { name: "Rajesh Kumar", village: "Hapur", district: "Ghaziabad", state: "UP", income: 350000, land: 4.5, crop: "Wheat", daysAgo: 25 },
    { name: "Sunita Devi", village: "Mandi", district: "Kullu", state: "HP", income: 280000, land: 2.1, crop: "Apples", daysAgo: 18 },
    { name: "Amit Singh", village: "Bhiwani", district: "Hisar", state: "Haryana", income: 520000, land: 8.0, crop: "Cotton", daysAgo: 12 },
    { name: "Lakshmi Rao", village: "Guntur", district: "Amaravati", state: "AP", income: 410000, land: 5.2, crop: "Chilli", daysAgo: 5 },
    { name: "Suresh Patil", village: "Satara", district: "Pune", state: "Maharashtra", income: 600000, land: 10.5, crop: "Sugarcane", daysAgo: 1 }
  ];

  for (const f of farmers) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - f.daysAgo);
    const dateStr = createdAt.toISOString();

    const farmerId = db.prepare(`
      INSERT INTO farmers (name, aadhaar_number, phone, village, district, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(f.name, "123456789012", "9876543210", f.village, f.district, f.state, dateStr).lastInsertRowid;

    db.prepare(`
      INSERT INTO land_details (farmer_id, latitude, longitude, land_size_acres, soil_type, ownership_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(farmerId, 28.6139 + (Math.random() - 0.5), 77.2090 + (Math.random() - 0.5), f.land, "Alluvial", "Owned");

    db.prepare(`
      INSERT INTO crop_data (farmer_id, crop_type, farming_season, irrigation_type, avg_yield_last_3_seasons)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, f.crop, "Kharif", "Borewell", 8 + Math.random() * 5);

    db.prepare(`
      INSERT INTO weather_data (farmer_id, historical_rainfall, drought_probability, flood_risk, seasonal_rainfall_pattern)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, 800 + Math.random() * 400, 0.1, 0.05, "Stable");

    db.prepare(`
      INSERT INTO market_data (farmer_id, avg_crop_price, price_volatility)
      VALUES (?, ?, ?)
    `).run(farmerId, 2000, 0.15);

    db.prepare(`
      INSERT INTO financial_data (farmer_id, annual_income, existing_loans, repayment_history, assets_owned)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, f.income, 50000, "Good", "Tractor, Cattle");

    db.prepare(`
      INSERT INTO credit_data (farmer_id, cibil_score, cooperative_bank_loans, microfinance_loans)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, 720 + Math.floor(Math.random() * 100), 0, 0);

    // Calculate score
    const scoringInput = {
      land: { land_size_acres: f.land, soil_type: "Alluvial", ownership_status: "Owned" },
      weather: { historical_rainfall: 1000, drought_probability: 0.1, flood_risk: 0.05 },
      crop: { irrigation_type: "Borewell", avg_yield_last_3_seasons: 10 },
      market: { price_volatility: 0.15 },
      financial: { annual_income: f.income, existing_loans: 50000, repayment_history: "Good" },
      credit: { cibil_score: 750 }
    };
    
    const { score, riskCategory, breakdown } = calculateAgriScore(scoringInput);
    
    // Generate real explanation for seeded data
    let explanation = `
### AgriScore Assessment Summary
The farmer has been assigned a score of **${score}/100** (${riskCategory}). This score reflects a comprehensive analysis of their agronomic practices, financial stability, and environmental risk factors.

#### Key Strengths
* **Consistent Yields:** The farmer has demonstrated stable crop yields over the past 3 seasons.
* **Financial Discipline:** A strong repayment history on previous micro-loans indicates high reliability.
* **Land Ownership:** Full ownership of the land provides strong collateral value.

#### Key Risks
* **Climate Vulnerability:** High dependence on rainfed irrigation makes the farm susceptible to erratic monsoon patterns.
* **Market Volatility:** The primary crop is subject to moderate price fluctuations in the local mandi.

#### Recommendations for Improvement
1. **Adopt Micro-Irrigation:** Transitioning to drip irrigation could improve water efficiency and reduce climate risk.
2. **Crop Diversification:** Introducing a secondary cash crop could stabilize income against market volatility.
3. **Formal Credit Integration:** Leveraging cooperative bank loans could reduce the cost of capital compared to informal lenders.
`;
    try {
      const aiExplanation = await generateAgriScoreExplanation(scoringInput, score, riskCategory);
      if (aiExplanation && aiExplanation.length > 50) {
        explanation = aiExplanation;
      }
    } catch (e) {
      console.error("Failed to generate seed explanation:", e);
    }

    db.prepare(`
      INSERT INTO agri_scores (farmer_id, score, risk_category, explanation, breakdown, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(farmerId, score, riskCategory, explanation, JSON.stringify(breakdown), dateStr);

    const recommendation = getLoanRecommendation(score, f.land, f.income);
    db.prepare(`
      INSERT INTO loan_recommendations (farmer_id, recommended_amount, interest_rate, tenure_months)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, recommendation.recommendedAmount, recommendation.interestRate, recommendation.tenureMonths);
  }
  console.log("Seeding complete.");

  // Migration: Update existing placeholder explanations
  const placeholders = db.prepare("SELECT farmer_id, score, risk_category FROM agri_scores WHERE explanation = 'Initial seed score.'").all();
  if (placeholders.length > 0) {
    console.log(`Updating ${placeholders.length} placeholder explanations...`);
    for (const row of placeholders as any[]) {
      const farmerId = row.farmer_id;
      const land = db.prepare("SELECT * FROM land_details WHERE farmer_id = ?").get(farmerId);
      const crop = db.prepare("SELECT * FROM crop_data WHERE farmer_id = ?").get(farmerId);
      const weather = db.prepare("SELECT * FROM weather_data WHERE farmer_id = ?").get(farmerId);
      const market = db.prepare("SELECT * FROM market_data WHERE farmer_id = ?").get(farmerId);
      const financial = db.prepare("SELECT * FROM financial_data WHERE farmer_id = ?").get(farmerId);
      const credit = db.prepare("SELECT * FROM credit_data WHERE farmer_id = ?").get(farmerId);
      
      const scoringInput = { land, crop, weather, market, financial, credit };
      try {
        const explanation = await generateAgriScoreExplanation(scoringInput, row.score, row.risk_category);
        db.prepare("UPDATE agri_scores SET explanation = ? WHERE farmer_id = ?").run(explanation, farmerId);
      } catch (e) {
        console.error(`Failed to update explanation for farmer ${farmerId}:`, e);
      }
    }
    console.log("Migration complete.");
  }
}
