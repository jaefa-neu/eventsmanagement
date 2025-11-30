// ==============================
// Event CRUD - Vercel Serverless Express + Swagger
// Node.js + Express + MongoDB Atlas
// ==============================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ====== Swagger Imports ======
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();

// ====== Middleware ======
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));
app.use(express.json());

// ====== Swagger Configuration ======
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Planify API",
      version: "1.0.0",
      description: "A system that allows users to create, update, and manage events. It handles event details, scheduling, participant count, and venue assignment The API provides endpoints for managing events, attendees, organizers, and related resources to streamline event planning and coordination.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Server",
      },
    ],
  },
  // This looks for API documentation in this file
  apis: ["./app.js"], // ⚠️ IMPORTANT: Ensure your file is named 'server.js'. If not, change this string.
};

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

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

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

// ====== Swagger Component Schema ======
/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - eventID
 *         - eventName
 *         - client
 *         - type
 *         - venue
 *         - month
 *         - day
 *         - year
 *         - startTime
 *         - pax
 *       properties:
 *         eventID:
 *           type: integer
 *           description: Unique ID for the event
 *         eventName:
 *           type: string
 *           description: Name of the event
 *         client:
 *           type: string
 *           description: Name of the client
 *         type:
 *           type: string
 *           description: Type of event (Meeting, Wedding, etc.)
 *         venue:
 *           type: string
 *           description: Location of the event
 *         month:
 *           type: integer
 *         day:
 *           type: integer
 *         year:
 *           type: integer
 *         startTime:
 *           type: string
 *           description: Time in HH:MM format
 *         pax:
 *           type: integer
 *           description: Number of attendees
 *       example:
 *         eventID: 10101
 *         eventName: "Tech Conference"
 *         client: "Google"
 *         type: "Conference"
 *         venue: "Grand Hall A"
 *         month: 12
 *         day: 25
 *         year: 2025
 *         startTime: "09:00"
 *         pax: 150
 */

// ====== Routes ======

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: The Event managing API
 */

// Root
app.get('/', (req, res) => {
  res.send('✅ Event CRUD API is running on Vercel!');
});

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Returns the list of all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: The list of the events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
app.get('/api/v1/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ year: 1, month: 1, day: 1, startTime: 1 });
    res.status(200).json({ message: "Events retrieved successfully", events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get the event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: The event description by id
 *       404:
 *         description: The event was not found
 */
app.get('/api/v1/events/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ eventID: parseInt(req.params.id) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event retrieved successfully", event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/events/month/{month}:
 *   get:
 *     summary: Get events by month number
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: month
 *         schema:
 *           type: integer
 *         required: true
 *         description: The month number (1-12)
 *     responses:
 *       200:
 *         description: Events found for the month
 *       404:
 *         description: No events found
 */
app.get('/api/v1/events/month/:month', async (req, res) => {
  try {
    const monthEvents = await Event.find({ month: parseInt(req.params.month) });
    if (monthEvents.length === 0) return res.status(404).json({ message: "No events for this month" });
    res.status(200).json({ message: "Specific month events retrieved successfully", events: monthEvents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/events/client/{client}:
 *   get:
 *     summary: Get events by client name
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: client
 *         schema:
 *           type: string
 *         required: true
 *         description: The client name
 *     responses:
 *       200:
 *         description: Events found for the client
 *       404:
 *         description: No events found
 */
app.get('/api/v1/events/client/:client', async (req, res) => {
  try {
    const clientEvents = await Event.find({ client: req.params.client });
    if (clientEvents.length === 0) return res.status(404).json({ message: "No events listed for this client" });
    res.status(200).json({ message: "Client events retrieved successfully", events: clientEvents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/events/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: The event was successfully created
 *       400:
 *         description: Event ID already exists or error
 */
app.post('/api/v1/events/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ message: "Event added successfully", event });
  } catch (err) {
    if (err.code === 11000) res.status(400).json({ message: "Event ID already exists" });
    else res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/events/{id}:
 *   put:
 *     summary: Update an event completely
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: The event was updated
 *       404:
 *         description: Event not found
 */
app.put('/api/v1/events/:id', async (req, res) => {
  try {
    const urlId = parseInt(req.params.id);
    const { eventID } = req.body;
    if (parseInt(eventID) !== urlId) return res.status(400).json({ message: "eventID in body must match URL ID" });

    const event = await Event.findOneAndUpdate({ eventID: urlId }, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event updated successfully", event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/events/{id}:
 *   patch:
 *     summary: Partially update an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventName: 
 *                 type: string
 *               venue: 
 *                 type: string
 *               pax:
 *                 type: integer
 *     responses:
 *       200:
 *         description: The event was patched
 *       404:
 *         description: Event not found
 */
app.patch('/api/v1/events/:id', async (req, res) => {
  try {
    const urlId = parseInt(req.params.id);
    const event = await Event.findOneAndUpdate({ eventID: urlId }, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event successfully patched", event });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     summary: Remove the event by id
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: The event was deleted
 *       404:
 *         description: Event not found
 */
app.delete('/api/v1/events/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ eventID: parseInt(req.params.id) });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ====== Connect to MongoDB Atlas and start local server ======
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

startServer();