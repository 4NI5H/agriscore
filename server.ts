import express from "express";
import { createServer as createViteServer } from "vite";
import db, { initDb } from "./src/backend/database.ts";
import { seedData } from "./src/backend/seed.ts";
import { calculateAgriScore, getLoanRecommendation } from "./src/backend/scoring.ts";
import { generateAgriScoreExplanation } from "./src/backend/ai.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Initialize DB and Seed
  initDb();
  await seedData();

  // API Routes
  app.get("/api/farmers", (req, res) => {
    const farmers = db.prepare(`
      SELECT f.*, s.score, s.risk_category 
      FROM farmers f 
      LEFT JOIN agri_scores s ON f.id = s.farmer_id 
      ORDER BY f.created_at DESC
    `).all();
    res.json(farmers);
  });

  app.post("/api/farmers", (req, res) => {
    const { farmer, land, crop, weather, market, financial, credit } = req.body;
    
    const insertFarmer = db.prepare(`
      INSERT INTO farmers (name, aadhaar_number, phone, village, district, state)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertFarmer.run(
      farmer.name, farmer.aadhaar_number, farmer.phone, 
      farmer.village, farmer.district, farmer.state
    );
    const farmerId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO land_details (farmer_id, latitude, longitude, land_size_acres, soil_type, ownership_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(farmerId, land.latitude, land.longitude, land.land_size_acres, land.soil_type, land.ownership_status);

    db.prepare(`
      INSERT INTO crop_data (farmer_id, crop_type, farming_season, irrigation_type, avg_yield_last_3_seasons)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, crop.crop_type, crop.farming_season, crop.irrigation_type, crop.avg_yield_last_3_seasons);

    db.prepare(`
      INSERT INTO weather_data (farmer_id, historical_rainfall, drought_probability, flood_risk, seasonal_rainfall_pattern)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, weather.historical_rainfall, weather.drought_probability, weather.flood_risk, weather.seasonal_rainfall_pattern);

    db.prepare(`
      INSERT INTO market_data (farmer_id, avg_crop_price, price_volatility)
      VALUES (?, ?, ?)
    `).run(farmerId, market.avg_crop_price, market.price_volatility);

    db.prepare(`
      INSERT INTO financial_data (farmer_id, annual_income, existing_loans, repayment_history, assets_owned)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, financial.annual_income, financial.existing_loans, financial.repayment_history, financial.assets_owned);

    db.prepare(`
      INSERT INTO credit_data (farmer_id, cibil_score, cooperative_bank_loans, microfinance_loans)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, credit.cibil_score, credit.cooperative_bank_loans, credit.microfinance_loans);

    res.json({ id: farmerId });
  });

  app.get("/api/farmers/:id", (req, res) => {
    const farmerId = req.params.id;
    const farmer = db.prepare("SELECT * FROM farmers WHERE id = ?").get(farmerId);
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });

    const land = db.prepare("SELECT * FROM land_details WHERE farmer_id = ?").get(farmerId);
    const crop = db.prepare("SELECT * FROM crop_data WHERE farmer_id = ?").get(farmerId);
    const weather = db.prepare("SELECT * FROM weather_data WHERE farmer_id = ?").get(farmerId);
    const market = db.prepare("SELECT * FROM market_data WHERE farmer_id = ?").get(farmerId);
    const financial = db.prepare("SELECT * FROM financial_data WHERE farmer_id = ?").get(farmerId);
    const credit = db.prepare("SELECT * FROM credit_data WHERE farmer_id = ?").get(farmerId);
    const score = db.prepare("SELECT * FROM agri_scores WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 1").get(farmerId) as any;
    if (score && score.breakdown) {
      score.breakdown = JSON.parse(score.breakdown);
    }
    const recommendation = db.prepare("SELECT * FROM loan_recommendations WHERE farmer_id = ?").get(farmerId);

    res.json({ farmer, land, crop, weather, market, financial, credit, score, recommendation });
  });

  app.post("/api/farmers/:id/score", async (req, res) => {
    const farmerId = req.params.id;
    const farmerData = db.prepare("SELECT * FROM farmers WHERE id = ?").get(farmerId);
    if (!farmerData) return res.status(404).json({ error: "Farmer not found" });

    const land = db.prepare("SELECT * FROM land_details WHERE farmer_id = ?").get(farmerId);
    const crop = db.prepare("SELECT * FROM crop_data WHERE farmer_id = ?").get(farmerId);
    const weather = db.prepare("SELECT * FROM weather_data WHERE farmer_id = ?").get(farmerId);
    const market = db.prepare("SELECT * FROM market_data WHERE farmer_id = ?").get(farmerId);
    const financial = db.prepare("SELECT * FROM financial_data WHERE farmer_id = ?").get(farmerId);
    const credit = db.prepare("SELECT * FROM credit_data WHERE farmer_id = ?").get(farmerId);

    const scoringInput = { land, crop, weather, market, financial, credit };
    const { score, riskCategory, breakdown } = calculateAgriScore(scoringInput);
    
    // Generate AI explanation
    const explanation = await generateAgriScoreExplanation(scoringInput, score, riskCategory);

    // Save score
    db.prepare(`
      INSERT INTO agri_scores (farmer_id, score, risk_category, explanation, breakdown)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, score, riskCategory, explanation, JSON.stringify(breakdown));

    // Generate recommendation
    const recommendation = getLoanRecommendation(score, land.land_size_acres, financial.annual_income);
    
    db.prepare(`
      INSERT INTO loan_recommendations (farmer_id, recommended_amount, interest_rate, tenure_months)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, recommendation.recommendedAmount, recommendation.interestRate, recommendation.tenureMonths);

    res.json({ score, riskCategory, breakdown, explanation, recommendation });
  });

  app.get("/api/dashboard", (req, res) => {
    const totalFarmers = db.prepare("SELECT COUNT(*) as count FROM farmers").get().count;
    const avgScore = db.prepare("SELECT AVG(score) as avg FROM agri_scores").get().avg || 0;
    const riskDistribution = db.prepare(`
      SELECT risk_category, COUNT(*) as count 
      FROM agri_scores 
      GROUP BY risk_category
    `).all();
    
    const recentScores = db.prepare(`
      SELECT f.name, s.score, s.risk_category, s.created_at
      FROM agri_scores s
      JOIN farmers f ON s.farmer_id = f.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `).all();

    const dailyTrends = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count, AVG(score) as avg_score
      FROM agri_scores
      WHERE created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();

    res.json({ 
      totalFarmers, 
      avgScore: Math.round(avgScore), 
      riskDistribution, 
      recentScores,
      dailyTrends 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
