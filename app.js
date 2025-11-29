// ==============================
// Event CRUD - Matches Specific Route Table
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
    eventName: { type: String, required: true },
    client: { type: String, required: true },
    type: { type: String, required: true },
    venue: { type: String, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    year: { type: Number, required: true },
    startTime: { type: String, required: true }, 
    pax: { type: Number, required: true }
  }, 
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

// ====== Routes (Based on Table) ======

// Root
app.get('/', (req, res) => {
  res.send('✅ Event CRUD API is running!');
});

// 1. GET /api/v1/events (Returns all events)
app.get('/api/v1/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ year: 1, month: 1, day: 1, startTime: 1 });
    res.status(200).json({ message: "Events retrieved successfully", events: events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. GET /api/v1/events/:id (Return one specific event)
app.get('/api/v1/events/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ eventID: parseInt(req.params.id) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event retrieved successfully", event: event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. GET /api/v1/events/month/:month
app.get('/api/v1/events/month/:month', async (req, res) => {
  try {
    const monthEvents = await Event.find({ month: parseInt(req.params.month) });
    if (monthEvents.length === 0) return res.status(404).json({ message: "No events for this month" });
    res.status(200).json({ message: "Specific month events retrieved successfully", events: monthEvents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. GET /api/v1/events/client/:client
app.get('/api/v1/events/client/:client', async (req, res) => {
  try {
    const clientEvents = await Event.find({ client: req.params.client });
    if (clientEvents.length === 0) return res.status(404).json({ message: "No events listed for this client" });
    res.status(200).json({ message: "Client events retrieved successfully", events: clientEvents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. POST /api/v1/events/events (Adds a new event)
app.post('/api/v1/events/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ message: "Event added successfully", event: event });
  } catch (err) {
    if (err.code === 11000) res.status(400).json({ message: "Event ID already exists" });
    else res.status(400).json({ message: err.message });
  }
});

// 6. PUT /api/v1/events/:id 
app.put('/api/v1/events/:id', async (req, res) => {
  try {
    const urlId = parseInt(req.params.id);
    const { eventID } = req.body; // Basic check, full validation handled by Schema
    if (parseInt(eventID) !== urlId) return res.status(400).json({ message: "eventID in body must match URL ID" });

    const event = await Event.findOneAndUpdate({ eventID: urlId }, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event updated successfully", event: event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 7. PATCH /api/v1/events/:id 
app.patch('/api/v1/events/:id', async (req, res) => {
  try {
    const urlId = parseInt(req.params.id);
    const event = await Event.findOneAndUpdate({ eventID: urlId }, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event successfully patched", event: event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 8. DELETE /api/v1/events/:id 
app.delete('/api/v1/events/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ eventID: parseInt(req.params.id) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event deleted successfully" });
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