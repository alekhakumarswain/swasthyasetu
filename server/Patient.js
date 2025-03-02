const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Multer setup for file uploads
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
}).fields([
  { name: 'insuranceFile', maxCount: 1 },
  { name: 'bloodReport', maxCount: 1 },
  { name: 'imagingReport', maxCount: 1 },
]);

// MongoDB Schema for Patient EHR
const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  bloodType: { type: String, required: true },
  phone: { type: String, required: true },
  emergencyName: { type: String, required: true },
  emergencyPhone: { type: String, required: true },
  address: { type: String },
  occupation: { type: String },
  insuranceProvider: { type: String },
  insurancePolicyNumber: { type: String },
  insuranceFile: { type: String }, // Store file path
  lastDonationDate: { type: Date },
  totalDonations: { type: Number, default: 0 },
  eligibleForDonation: { type: Boolean, default: true },
  bloodPressure: { type: String },
  weight: { type: Number },
  height: { type: Number },
  chronicConditions: [{ type: String }],
  surgeries: { type: Boolean, default: false },
  surgeryDetails: { type: String },
  medicationAllergies: [{ type: String }],
  otherAllergies: { type: String },
  familyHistory: [{ type: String }],
  otherFamilyHistory: { type: String },
  currentMeds: { type: Boolean, default: false },
  medsList: [{ type: String }],
  pastMeds: { type: String },
  ongoingTherapies: [{ type: String }],
  ongoingTherapiesOthers: { type: String },
  bloodReport: { type: String }, // Store file path
  imagingReport: { type: String }, // Store file path
  geneticOrBiopsyTest: { type: Boolean, default: false },
  polioVaccine: { type: Boolean, default: false },
  tetanusShot: { type: Date },
  covidVaccine: { type: String },
  covidBooster: { type: Boolean, default: false },
  smokingStatus: { type: String },
  cigarettesPerDay: { type: Number },
  exerciseFrequency: { type: String },
  sleepHours: { type: Number },
  dietType: [{ type: String }],
  dietTypeOther: { type: String },
  alcoholConsumption: { type: String },
  alcoholFrequency: { type: String },
  primarySymptoms: { type: String },
  initialDiagnosis: { type: String },
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Patient = mongoose.model("Patient", patientSchema);

// Middleware to handle file uploads for POST and PUT routes
const handleUploads = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Routes for Patient EHR

// Create a new patient record with file uploads
router.post("/patients", handleUploads, async (req, res) => {
  const patientData =	req.body;

  // Parse array fields if they are sent as JSON strings
  if (typeof patientData.chronicConditions === "string") patientData.chronicConditions = JSON.parse(patientData.chronicConditions || "[]");
  if (typeof patientData.medicationAllergies === "string") patientData.medicationAllergies = JSON.parse(patientData.medicationAllergies || "[]");
  if (typeof patientData.familyHistory === "string") patientData.familyHistory = JSON.parse(patientData.familyHistory || "[]");
  if (typeof patientData.medsList === "string") patientData.medsList = JSON.parse(patientData.medsList || "[]");
  if (typeof patientData.ongoingTherapies === "string") patientData.ongoingTherapies = JSON.parse(patientData.ongoingTherapies || "[]");
  if (typeof patientData.dietType === "string") patientData.dietType = JSON.parse(patientData.dietType || "[]");

  // Handle file uploads and store paths
  if (req.files) {
    if (req.files.insuranceFile) patientData.insuranceFile = `/uploads/patients/insurance/${req.files.insuranceFile[0].filename}`;
    if (req.files.bloodReport) patientData.bloodReport = `/uploads/patients/blood/${req.files.bloodReport[0].filename}`;
    if (req.files.imagingReport) patientData.imagingReport = `/uploads/patients/imaging/${req.files.imagingReport[0].filename}`;
  }

  // Handle boolean and number fields
  patientData.eligibleForDonation = patientData.eligibleForDonation === "true" || patientData.eligibleForDonation === true;
  patientData.surgeries = patientData.surgeries === "true" || patientData.surgeries === true;
  patientData.geneticOrBiopsyTest = patientData.geneticOrBiopsyTest === "true" || patientData.geneticOrBiopsyTest === true;
  patientData.polioVaccine = patientData.polioVaccine === "true" || patientData.polioVaccine === true;
  patientData.covidBooster = patientData.covidBooster === "true" || patientData.covidBooster === true;
  patientData.currentMeds = patientData.currentMeds === "true" || patientData.currentMeds === true;
  patientData.followUpRequired = patientData.followUpRequired === "true" || patientData.followUpRequired === true;
  patientData.totalDonations = parseInt(patientData.totalDonations) || 0;
  patientData.weight = parseFloat(patientData.weight) || 0;
  patientData.height = parseFloat(patientData.height) || 0;
  patientData.cigarettesPerDay = parseInt(patientData.cigarettesPerDay) || 0;
  patientData.sleepHours = parseFloat(patientData.sleepHours) || 0;

  // Handle date fields
  if (patientData.dob) patientData.dob = new Date(patientData.dob);
  if (patientData.lastDonationDate) patientData.lastDonationDate = new Date(patientData.lastDonationDate);
  if (patientData.tetanusShot) patientData.tetanusShot = new Date(patientData.tetanusShot);
  if (patientData.followUpDate) patientData.followUpDate = new Date(patientData.followUpDate);

  try {
    const newPatient = new Patient(patientData);
    await newPatient.save();
    res.status(201).json({ message: "Patient registered successfully", patient: newPatient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Get all patients
router.get("/patients", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get a specific patient by ID
router.get("/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a patient record with file uploads
router.put("/patients/:id", handleUploads, async (req, res) => {
  const patientData = req.body;

  // Parse array fields if they are sent as JSON strings
  if (typeof patientData.chronicConditions === "string") patientData.chronicConditions = JSON.parse(patientData.chronicConditions || "[]");
  if (typeof patientData.medicationAllergies === "string") patientData.medicationAllergies = JSON.parse(patientData.medicationAllergies || "[]");
  if (typeof patientData.familyHistory === "string") patientData.familyHistory = JSON.parse(patientData.familyHistory || "[]");
  if (typeof patientData.medsList === "string") patientData.medsList = JSON.parse(patientData.medsList || "[]");
  if (typeof patientData.ongoingTherapies === "string") patientData.ongoingTherapies = JSON.parse(patientData.ongoingTherapies || "[]");
  if (typeof patientData.dietType === "string") patientData.dietType = JSON.parse(patientData.dietType || "[]");

  // Handle file uploads and store paths
  if (req.files) {
    if (req.files.insuranceFile) patientData.insuranceFile = `/uploads/patients/insurance/${req.files.insuranceFile[0].filename}`;
    if (req.files.bloodReport) patientData.bloodReport = `/uploads/patients/blood/${req.files.bloodReport[0].filename}`;
    if (req.files.imagingReport) patientData.imagingReport = `/uploads/patients/imaging/${req.files.imagingReport[0].filename}`;
  }

  // Handle boolean and number fields
  patientData.eligibleForDonation = patientData.eligibleForDonation === "true" || patientData.eligibleForDonation === true;
  patientData.surgeries = patientData.surgeries === "true" || patientData.surgeries === true;
  patientData.geneticOrBiopsyTest = patientData.geneticOrBiopsyTest === "true" || patientData.geneticOrBiopsyTest === true;
  patientData.polioVaccine = patientData.polioVaccine === "true" || patientData.polioVaccine === true;
  patientData.covidBooster = patientData.covidBooster === "true" || patientData.covidBooster === true;
  patientData.currentMeds = patientData.currentMeds === "true" || patientData.currentMeds === true;
  patientData.followUpRequired = patientData.followUpRequired === "true" || patientData.followUpRequired === true;
  patientData.totalDonations = parseInt(patientData.totalDonations) || 0;
  patientData.weight = parseFloat(patientData.weight) || 0;
  patientData.height = parseFloat(patientData.height) || 0;
  patientData.cigarettesPerDay = parseInt(patientData.cigarettesPerDay) || 0;
  patientData.sleepHours = parseFloat(patientData.sleepHours) || 0;

  // Handle date fields
  if (patientData.dob) patientData.dob = new Date(patientData.dob);
  if (patientData.lastDonationDate) patientData.lastDonationDate = new Date(patientData.lastDonationDate);
  if (patientData.tetanusShot) patientData.tetanusShot = new Date(patientData.tetanusShot);
  if (patientData.followUpDate) patientData.followUpDate = new Date(patientData.followUpDate);

  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...patientData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json({ message: "Patient updated successfully", patient: updatedPatient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Delete a patient record
router.delete("/patients/:id", async (req, res) => {
  try {
    const deletedPatient = await Patient.findByIdAndDelete(req.params.id);
    if (!deletedPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;