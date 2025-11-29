// ==============================
// Simple Event CRUD (One File) - Updated with Venue & Sorting
// Node.js + Express + MongoDB Atlas
// ==============================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== Middleware ======
app.use(cors());
app.use(express.json());

// ====== Mongoose Schema & Model ======
const eventSchema = new mongoose.Schema(
  {
    eventID: { type: Number, required: true, unique: true },
    client: { type: String, required: true },
    type: { type: String, required: true },
    venue: { type: String, required: true }, // NEW FIELD
    // Date Fields
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    year: { type: Number, required: true },
    // Time Field
    startTime: { type: String, required: true }, 
    pax: { type: Number, required: true }
  }, 
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

// ====== Routes ======

// Root
app.get('/', (req, res) => {
  res.send('✅ Event CRUD API is running!');
});

// Create an event
app.post('/api/v1/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({
      message: "Event added successfully",
      event: event
    });
  } catch (err) {
    if (err.code === 11000) { 
      res.status(400).json({ message: "Event ID already exists" });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
});

// Read all events (SORTED BY DATE)
app.get('/api/v1/events', async (req, res) => {
  try {
    // Sort Ascending: Year > Month > Day > Time
    const events = await Event.find().sort({ year: 1, month: 1, day: 1, startTime: 1 });
    res.status(200).json({
      message: "Events retrieved successfully",
      events: events
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Read single event by ID
app.get('/api/v1/events/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ eventID: parseInt(req.params.id) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({
      message: "Event retrieved successfully",
      event: event
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update event (full update)
app.put('/api/v1/events/:id', async (req, res) => {
  try {
    const urlId = parseInt(req.params.id);
    // Added venue to destructuring
    const { eventID, client, type, venue, month, day, year, pax, startTime } = req.body;
    
    // Added venue to validation
    if (!eventID || !client || !type || !venue || !month || !day || !year || !pax || !startTime) {
      return res.status(400).json({
        message: "Update must have eventID, client, type, venue, date, startTime, and pax"
      });
    }
    if (parseInt(eventID) !== urlId) {
      return res.status(400).json({
        message: "eventID in body must match URL ID"
      });
    }
    const event = await Event.findOneAndUpdate({ eventID: urlId }, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({
      message: "Event updated successfully",
      event: event
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete event
app.delete('/api/v1/events/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ eventID: parseInt(req.params.id) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({
      message: "Event deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ====== Connect to MongoDB Atlas ======
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

startServer();