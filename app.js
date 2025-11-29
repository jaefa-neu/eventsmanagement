// ==============================
// Simple Event CRUD (One File) - Updated with Time
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
    // Date Fields
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    year: { type: Number, required: true },
    // Time Field (New)
    startTime: { type: String, required: true }, // Stores "14:30" or "02:30 PM"
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

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Create an event
app.post('/api/v1/events', async (req, res) => {
  try {
    // Mongoose will automatically check for startTime because it is in the schema
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({
      message: "Event added successfully",
      event: event
    });
  } catch (err) {
    if (err.code === 11000) { // Duplicate key error
      res.status(400).json({ message: "Event ID already exists" });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
});

// Read all events
app.get('/api/v1/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
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

// Read events by client
app.get('/api/v1/events/client/:client', async (req, res) => {
  try {
    const clientEvents = await Event.find({ client: req.params.client });
    if (clientEvents.length === 0) {
      return res.status(404).json({ message: "No events listed for this client" });
    }
    res.status(200).json({
      message: "Client events retrieved successfully",
      events: clientEvents
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Read events by month
app.get('/api/v1/events/month/:month', async (req, res) => {
  try {
    const monthEvents = await Event.find({ month: parseInt(req.params.month) });
    if (monthEvents.length === 0) {
      return res.status(404).json({ message: "No events for this month" });
    }
    res.status(200).json({
      message: "Specific month events retrieved successfully",
      events: monthEvents
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update event (full update)
app.put('/api/v1/events/:id', async (req, res) => {
  try {
    const urlId = parseInt(req.params.id);
    // Added startTime to destructuring
    const { eventID, client, type, month, day, year, pax, startTime } = req.body;
    
    // Added startTime to validation check
    if (!eventID || !client || !type || !month || !day || !year || !pax || !startTime) {
      return res.status(400).json({
        message: "Update must have eventID, client, type, date fields, time, and pax"
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

// Partial update event (Date or Time)
app.patch('/api/v1/events/:id', async (req, res) => {
  try {
    const urlId = parseInt(req.params.id);
    const { month, day, year, startTime } = req.body;
    
    // Allow update if either Date parts OR Time is present
    const isDateUpdate = (month && day && year);
    if (!isDateUpdate && !startTime) {
      return res.status(400).json({
        message: "Must include date (month, day, year) or startTime to update"
      });
    }

    const event = await Event.findOneAndUpdate({ eventID: urlId }, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({
      message: "Event schedule successfully updated",
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