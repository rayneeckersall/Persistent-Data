// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// ----- MIDDLEWARE -----
app.use(cors());
app.use(express.json());

// If your HTML/CSS/JS are in a "public" folder, keep this:
app.use(express.static(path.join(__dirname, "public")));

// If they are in the same folder as server.js instead, use this instead:
// app.use(express.static(__dirname));

// ----- DATABASE CONNECTION -----
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// ----- SCHEMA & MODEL -----
const dreamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  story: { type: String, required: true },
  tags: [String],
  emotionLevel: { type: Number, min: 1, max: 5, default: 3 },
  recurring: { type: Boolean, default: false },
  nightmare: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Dream = mongoose.model("Dream", dreamSchema);

// ----- ROUTES -----

// health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET all dreams (newest first)
app.get("/api/dreams", async (req, res) => {
  try {
    const dreams = await Dream.find().sort({ createdAt: -1 });
    res.json(dreams);
  } catch (err) {
    console.error("Error fetching dreams:", err);
    res.status(500).json({ error: "Failed to fetch dreams" });
  }
});

// GET one dream by ID
app.get("/api/dreams/:id", async (req, res) => {
  try {
    const dream = await Dream.findById(req.params.id);
    if (!dream) {
      return res.status(404).json({ success: false, message: "Dream not found" });
    }
    res.json(dream);
  } catch (err) {
    console.error("Error fetching dream:", err);
    res.status(500).json({ success: false, message: "Failed to fetch dream" });
  }
});

// CREATE a new dream
app.post("/api/dreams", async (req, res) => {
  try {
    const dream = await Dream.create({
      title: req.body.title,
      story: req.body.story,
      tags: req.body.tags || [],
      emotionLevel: req.body.emotionLevel ?? 3,
      recurring: !!req.body.recurring,
      nightmare: !!req.body.nightmare
    });

    res.status(201).json(dream);
  } catch (err) {
    console.error("Error creating dream:", err);
    res.status(400).json({ error: "Failed to create dream" });
  }
});

// TOGGLE favorite
app.patch("/api/dreams/:id/favorite", async (req, res) => {
  try {
    const dream = await Dream.findById(req.params.id);
    if (!dream) {
      return res.status(404).json({ error: "Dream not found" });
    }

    dream.favorite = !dream.favorite;
    await dream.save();
    res.json(dream);
  } catch (err) {
    console.error("Error toggling favorite:", err);
    res.status(400).json({ error: "Failed to update dream" });
  }
});

// DELETE a dream
app.delete("/api/dreams/:id", async (req, res) => {
  try {
    const deleted = await Dream.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Dream not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting dream:", err);
    res.status(500).json({ success: false, message: "Failed to delete dream" });
  }
});



// ----- START SERVER -----
const PORT = process.env.PORT || 4000;

// UPDATE an existing dream
app.put("/api/dreams/:id", async (req, res) => {
  try {
    const updated = await Dream.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        story: req.body.story,
        tags: req.body.tags,
        emotionLevel: req.body.emotionLevel,
        recurring: req.body.recurring,
        nightmare: req.body.nightmare
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Dream not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating dream:", err);
    res.status(500).json({ error: "Failed to update dream" });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
