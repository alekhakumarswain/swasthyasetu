const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");
const multer = require("multer"); // Added for file uploads
const path = require("path"); // Added for file path handling
require("socket.io");

// Initialize Express server
const server = express();

// Middleware
server.use(express.json());
server.use(cors({ origin: "http://localhost:3000", credentials: true }));
server.use(express.urlencoded({ extended: true }));

// Session middleware
server.use(
  session({
    secret: process.env.SESSION_SECRET || "@smarthealthcare123",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true for production with HTTPS
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 365 * 100 // 1 year
    },
  })
);

// Multer setup for file uploads (for patient data)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/';
    if (file.fieldname === 'insuranceFile') dir += 'patients/insurance/';
    else if (file.fieldname === 'bloodReport') dir += 'patients/blood/';
    else if (file.fieldname === 'imagingReport') dir += 'patients/imaging/';
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /pdf|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Files must be PDF, JPG, or PNG');
    }
  },
});

// Serve static files from the uploads directory
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection (updated as requested)
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/SHC")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema and Model definitions

// authentication of user
const AuthSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, required: true },
});

const USER = mongoose.model("User", AuthSchema);

// authentication of doctor
const DrAuthSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialization: { type: String, required: true },
  contact: { type: String, required: true, unique: true },
  experience: { type: Number, required: true },
  currenthospital: { type: String, required: true },
  address: { type: String, required: true }
});

const DOCTOR = new mongoose.model("Doctors", DrAuthSchema);

// blood donation and req schema
const BloodSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ["Donate", "Request", "RequestCheck"] 
  },
  bloodType: { 
    type: String, 
    required: true, 
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  location: { 
    type: String, 
    required: function() { 
      return this.type === "Donate" || this.type === "Request"; 
    } 
  },
  name: { 
    type: String, 
    required: function() { 
      return this.type === "Donate" || this.type === "Request"; 
    } 
  },
  contact: { 
    type: String, 
    required: function() { 
      return this.type === "Donate" || this.type === "Request"; 
    } 
  },
  priority: { 
    type: String, 
    enum: ["Low", "Medium", "High"], 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  available: { 
    type: Boolean, 
    required: function() { 
      return this.type === "RequestCheck"; 
    },
    default: null 
  },
  checkedAt: { 
    type: Date, 
    required: function() { 
      return this.type === "RequestCheck"; 
    },
    default: null 
  },
});

const Blood = mongoose.model("Blood", BloodSchema);

// separate schema for the bloodrequest, because our original schema wasn’t working
const bloodRequestSchema = new mongoose.Schema({
  bloodType: { type: String, required: true },
  quantity: { type: Number, required: true },
  patientName: { type: String, required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  priority: { type: String, default: 'Normal' },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }
});

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

// Use patient routes for patient data and file uploads
const patientRoutes = require("./Patient");
server.use("/api", patientRoutes);

//
const doctorRoutes = require("./DoctorProfile");
server.use("/api", doctorRoutes);

// Endpoint to create a new blood request
server.post('/api/request-blood', async (req, res) => {
  try {
    const { bloodType, quantity, patientName, location, contact, priority } = req.body;

    const newRequest = new BloodRequest({
      bloodType,
      quantity,
      patientName,
      location,
      contact,
      priority,
    });

    await newRequest.save();
    res.status(201).json({ message: 'Blood request created successfully', newRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the blood request' });
  }
});

// Endpoint to get all blood requests
server.get('/api/request-blood', async (_req, res) => {
  try {
    const requests = await BloodRequest.find();
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching blood requests' });
  }
});

server.patch('/api/mark-request-accessed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      id,
      { status: 'Accessed' },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accident Schema
const accidentSchema = new mongoose.Schema({
  location: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['Pending', 'Checkout'], default: 'Pending' },
  time: { type: Date, default: Date.now },
});

const Accident = mongoose.model('Accident', accidentSchema);

// Update accident status from the doctor page
server.put('/api/accidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedAccident = await Accident.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedAccident) {
      return res.status(404).send('Accident not found');
    }

    res.json(updatedAccident);
  } catch (error) {
    console.error('Error updating accident:', error);
    res.status(500).send('Internal server error');
  }
});

// POST route to add a new accident
server.post('/api/accidents', async (req, res) => {
  const { location, description, city, state } = req.body;
  try {
    const newAccident = new Accident({ location, description, city, state });
    await newAccident.save();
    res.status(201).json(newAccident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving accident' });
  }
});

// GET route to fetch all accidents
server.get('/api/accidents', async (_req, res) => {
  try {
    const accidents = await Accident.find();
    res.json({ accidents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching accidents' });
  }
});

// Update accident status
server.put('/api/accidents/:id', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status || (status !== 'Pending' && status !== 'Checkout')) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const accident = await Accident.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!accident) {
      return res.status(404).json({ error: 'Accident not found' });
    }

    res.status(200).json(accident);
  } catch (err) {
    console.error('Error updating accident:', err);
    res.status(500).json({ error: 'Failed to update the accident' });
  }
});

// User Authentication Routes
server.post("/userAuth", async (req, res) => {
  const { name, email, password, userType } = req.body;
  try {
    if (await USER.findOne({ email })) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new USER({ name, email, password: hashedPassword, userType });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

server.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await USER.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(404).json({ error: "Invalid credentials" });
    }
    req.session.user = {
      userId: user._id,
      userEmail: user.email,
      userType: user.userType,
      userName: user.name,
    };
    console.log("User session set:", req.session);
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

server.get("/user", async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ error: "User not authenticated" });
    const user = await USER.findById(req.session.user.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ userName: user.name, userId: user._id, userEmail: user.email, userType: user.userType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Doctor Registration Route
server.post("/doctor-registration", async (req, res) => {
  try {
    const { name, email, password, specialization, contact, experience, currentHospital, address } = req.body;

    if (!name || !email || !password || !specialization || !contact || !experience || !currentHospital || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (await DOCTOR.findOne({ email })) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = new DOCTOR({
      name,
      email,
      password: hashedPassword,
      specialization,
      contact,
      experience,
      currenthospital: currentHospital,
      address,
    });

    await newDoctor.save();

    res.status(201).json({ message: "Doctor registered successfully" });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Doctor Login Route
server.post("/doctor-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const doctor = await DOCTOR.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.doctor = {
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
    };

    res.status(200).json({ message: "Login successful", doctor: req.session.doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET route to fetch doctor information (after login)
server.get("/doctor-profile", async (req, res) => {
  try {
    if (!req.session.doctor) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const doctor = await DOCTOR.findById(req.session.doctor.id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.status(200).json({
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      contact: doctor.contact,
      experience: doctor.experience,
      currentHospital: doctor.currenthospital,
      address: doctor.address,
    });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Blood Donation Route
server.post("/blood/donate", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { bloodType, quantity, location, name, contact } = req.body;

    const donationData = {
      bloodType,
      quantity,
      location,
      name: name || req.session.user.userName,
      contact: contact || req.session.user.userEmail,
    };

    const newDonation = new Blood({ type: "Donate", ...donationData });
    await newDonation.save();
    res.status(201).json({ message: "Donation recorded successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Blood Request Route
server.post('/blood/request', async (req, res) => {
  try {
    const { bloodType, quantity, name, contact, priority } = req.body;

    if (!bloodType || !quantity || !name || !contact) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newRequest = new Blood({
      type: 'Request',
      bloodType,
      quantity,
      name,
      contact,
      priority
    });

    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Blood Donation Retrieval
server.get("/blood/donations", async (_req, res) => {
  try {
    const donations = await Blood.find({ type: "Donate" });
    res.status(200).json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Blood Request Retrieval
server.get("/blood/requests", async (_req, res) => {
  try {
    const requests = await Blood.find({ type: "Request" });
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Blood Match Route (to match requests with donations)
server.get("/blood/match", async (_req, res) => {
  try {
    const matches = await Blood.aggregate([
      { $match: { type: "Request" } },
      {
        $lookup: {
          from: "bloods",
          let: { requestBloodType: "$bloodType", requestLocation: "$location" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$type", "Donate"] },
                    { $eq: ["$bloodType", "$$requestBloodType"] },
                    { $eq: ["$location", "$$requestLocation"] },
                  ],
                },
              },
            },
          ],
          as: "matches",
        },
      },
    ]);
    res.status(200).json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

server.post("/blood/request/check-availability", async (req, res) => {
  try {
    const { bloodType, quantity } = req.body;

    if (!bloodType || !quantity) {
      return res.status(400).json({ error: "Blood type and quantity are required" });
    }

    const availableDonations = await Blood.aggregate([
      { $match: { type: "Donate", bloodType: bloodType } },
      { $group: { _id: "$bloodType", totalQuantity: { $sum: "$quantity" } } },
    ]);

    const isAvailable = availableDonations.length > 0 && availableDonations[0].totalQuantity >= quantity;

    const checkRequest = new Blood({
      type: "RequestCheck",
      bloodType,
      quantity,
      checkedAt: new Date(),
      available: isAvailable,
    });

    await checkRequest.save();

    if (isAvailable) {
      return res.status(200).json({ available: true, message: "Sufficient blood available" });
    } else {
      return res.status(200).json({ available: false, message: "Insufficient blood available" });
    }
  } catch (err) {
    console.error("Error while checking availability:", err);
    res.status(500).json({ error: "Server error" });
  }
});

server.get("/blood/request/check-availability", async (req, res) => {
  try {
    const { bloodType } = req.query;

    if (!bloodType) {
      return res.status(400).json({ error: "Blood type is required" });
    }

    const checks = await Blood.find({ type: "RequestCheck", bloodType });

    if (checks.length === 0) {
      return res.status(404).json({ message: "No check records found for the specified blood type" });
    }

    res.status(200).json(checks);
  } catch (err) {
    console.error("Error while fetching check availability:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
server.listen(2000, () => console.log("Server is running on port 2000"));