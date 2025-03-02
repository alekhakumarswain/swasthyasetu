const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/';
    if (file.fieldname === 'profilePhoto') dir += 'doctors/profile/';
    else if (file.fieldname === 'medCouncilCert') dir += 'doctors/certificates/';
    else if (file.fieldname === 'medicalLicense') dir += 'doctors/licenses/';
    else if (file.fieldname === 'digitalSignature') dir += 'doctors/signatures/';
    else if (file.fieldname === 'idProof') dir += 'doctors/idproof/';
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
      cb(new Error('Files must be PDF, JPG, or PNG'));
    }
  },
}).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'medCouncilCert', maxCount: 1 },
  { name: 'medicalLicense', maxCount: 1 },
  { name: 'digitalSignature', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
]);

// MongoDB Schema for Doctor Profile
const doctorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  whatsappNumber: { type: String },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  profilePhoto: { type: String },
  medicalRegNumber: { type: String, required: true },
  degrees: [{ degree: String, otherDegree: String }],
  yearsOfExperience: { type: Number },
  specialization: { type: String, required: true },
  subSpecialization: { type: String },
  additionalCertifications: [{ type: String }],
  medCouncilCert: { type: String },
  currentWorkplaces: [{ type: String }],
  clinicDetails: [{ name: String, address: String, yearsOfStay: Number }],
  workSchedule: [{ day: String, timeSlots: [String] }],
  consultationModes: [{ type: String }],
  languagesSpoken: [{ type: String }],
  otherLanguages: { type: String },
  consultationFeeOnline: { type: Number },
  consultationFeeOffline: { type: Number },
  feeVariesByComplexity: { type: Boolean, default: false },
  feeVariationDetails: { type: String },
  emergencyAvailability: { type: Boolean, default: false },
  availability24_7: { type: Boolean, default: false },
  onCallConsultation: { type: Boolean, default: false },
  onCallHours: { type: String },
  maxPatientsPerDay: { type: Number },
  followUpDiscount: { type: Boolean, default: false },
  followUpDiscountPercentage: { type: Number },
  referralProgram: { type: Boolean, default: false },
  referralCode: { type: String },
  connectedHospitalDatabase: { type: Boolean, default: false },
  hospitalDatabaseDetails: { type: String },
  medicalRecordAccess: { type: Boolean, default: false },
  medicalRecordAccessDetails: { type: String },
  allowPatientReviews: { type: Boolean, default: false },
  publicProfileVisibility: { type: Boolean, default: false },
  medicalLicense: { type: String },
  digitalSignature: { type: String },
  idProof: { type: String },
  agreementConsent: { type: Boolean, required: true },
  bankDetails: {
    name: { type: String },
    accountNo: { type: String },
    ifscCode: { type: String },
  },
  upiId: { type: String },
  paymentModesAccepted: [{ type: String }],
  preferredCommunication: { type: String },
  remarksForAdmin: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Doctor = mongoose.model("Doctor", doctorSchema);

// Middleware to handle file uploads
const handleUploads = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Routes for Doctor Profile
router.post("/doctors", handleUploads, async (req, res) => {
  const doctorData = req.body;

  // Basic validation for required fields
  const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'dob', 'gender', 'medicalRegNumber', 'specialization', 'agreementConsent'];
  const missingFields = requiredFields.filter(field => !doctorData[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  // Parse array and object fields
  ['degrees', 'additionalCertifications', 'currentWorkplaces', 'clinicDetails', 'workSchedule',
   'consultationModes', 'languagesSpoken', 'paymentModesAccepted']
    .forEach(field => {
      if (typeof doctorData[field] === "string") doctorData[field] = JSON.parse(doctorData[field] || "[]");
    });
  if (typeof doctorData.bankDetails === "string") doctorData.bankDetails = JSON.parse(doctorData.bankDetails || "{}");

  // Handle file uploads
  if (req.files) {
    if (req.files.profilePhoto) doctorData.profilePhoto = `/uploads/doctors/profile/${req.files.profilePhoto[0].filename}`;
    if (req.files.medCouncilCert) doctorData.medCouncilCert = `/uploads/doctors/certificates/${req.files.medCouncilCert[0].filename}`;
    if (req.files.medicalLicense) doctorData.medicalLicense = `/uploads/doctors/licenses/${req.files.medicalLicense[0].filename}`;
    if (req.files.digitalSignature) doctorData.digitalSignature = `/uploads/doctors/signatures/${req.files.digitalSignature[0].filename}`;
    if (req.files.idProof) doctorData.idProof = `/uploads/doctors/idproof/${req.files.idProof[0].filename}`;
  }

  // Process boolean and number fields
  ['feeVariesByComplexity', 'emergencyAvailability', 'availability24_7', 'onCallConsultation',
   'followUpDiscount', 'referralProgram', 'connectedHospitalDatabase', 'medicalRecordAccess',
   'allowPatientReviews', 'publicProfileVisibility', 'agreementConsent']
    .forEach(field => doctorData[field] = doctorData[field] === "true" || doctorData[field] === true);
  ['yearsOfExperience', 'consultationFeeOnline', 'consultationFeeOffline', 'maxPatientsPerDay', 'followUpDiscountPercentage']
    .forEach(field => doctorData[field] = parseFloat(doctorData[field]) || 0);
  if (doctorData.dob) doctorData.dob = new Date(doctorData.dob);

  try {
    const newDoctor = new Doctor(doctorData);
    await newDoctor.save();
    res.status(201).json({ message: "Doctor registered successfully", doctor: newDoctor });
  } catch (err) {
    console.error('Error saving doctor:', err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// Keep other routes unchanged
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/doctors/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json(doctor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/doctors/:id", handleUploads, async (req, res) => {
  const doctorData = req.body;

  // Parse array and object fields
  if (typeof doctorData.degrees === "string") doctorData.degrees = JSON.parse(doctorData.degrees || "[]");
  if (typeof doctorData.additionalCertifications === "string") doctorData.additionalCertifications = JSON.parse(doctorData.additionalCertifications || "[]");
  if (typeof doctorData.currentWorkplaces === "string") doctorData.currentWorkplaces = JSON.parse(doctorData.currentWorkplaces || "[]");
  if (typeof doctorData.clinicDetails === "string") doctorData.clinicDetails = JSON.parse(doctorData.clinicDetails || "[]");
  if (typeof doctorData.workSchedule === "string") doctorData.workSchedule = JSON.parse(doctorData.workSchedule || "[]");
  if (typeof doctorData.consultationModes === "string") doctorData.consultationModes = JSON.parse(doctorData.consultationModes || "[]");
  if (typeof doctorData.languagesSpoken === "string") doctorData.languagesSpoken = JSON.parse(doctorData.languagesSpoken || "[]");
  if (typeof doctorData.paymentModesAccepted === "string") doctorData.paymentModesAccepted = JSON.parse(doctorData.paymentModesAccepted || "[]");
  if (typeof doctorData.bankDetails === "string") doctorData.bankDetails = JSON.parse(doctorData.bankDetails || "{}");

  // Handle file uploads
  if (req.files) {
    if (req.files.profilePhoto) doctorData.profilePhoto = `/uploads/doctors/profile/${req.files.profilePhoto[0].filename}`;
    if (req.files.medCouncilCert) doctorData.medCouncilCert = `/uploads/doctors/certificates/${req.files.medCouncilCert[0].filename}`;
    if (req.files.medicalLicense) doctorData.medicalLicense = `/uploads/doctors/licenses/${req.files.medicalLicense[0].filename}`;
    if (req.files.digitalSignature) doctorData.digitalSignature = `/uploads/doctors/signatures/${req.files.digitalSignature[0].filename}`;
    if (req.files.idProof) doctorData.idProof = `/uploads/doctors/idproof/${req.files.idProof[0].filename}`;
  }

  // Process boolean and number fields
  doctorData.feeVariesByComplexity = doctorData.feeVariesByComplexity === "true" || doctorData.feeVariesByComplexity === true;
  doctorData.emergencyAvailability = doctorData.emergencyAvailability === "true" || doctorData.emergencyAvailability === true;
  doctorData.availability24_7 = doctorData.availability24_7 === "true" || doctorData.availability24_7 === true;
  doctorData.onCallConsultation = doctorData.onCallConsultation === "true" || doctorData.onCallConsultation === true;
  doctorData.followUpDiscount = doctorData.followUpDiscount === "true" || doctorData.followUpDiscount === true;
  doctorData.referralProgram = doctorData.referralProgram === "true" || doctorData.referralProgram === true;
  doctorData.connectedHospitalDatabase = doctorData.connectedHospitalDatabase === "true" || doctorData.connectedHospitalDatabase === true;
  doctorData.medicalRecordAccess = doctorData.medicalRecordAccess === "true" || doctorData.medicalRecordAccess === true;
  doctorData.allowPatientReviews = doctorData.allowPatientReviews === "true" || doctorData.allowPatientReviews === true;
  doctorData.publicProfileVisibility = doctorData.publicProfileVisibility === "true" || doctorData.publicProfileVisibility === true;
  doctorData.agreementConsent = doctorData.agreementConsent === "true" || doctorData.agreementConsent === true;
  doctorData.yearsOfExperience = parseInt(doctorData.yearsOfExperience) || 0;
  doctorData.consultationFeeOnline = parseFloat(doctorData.consultationFeeOnline) || 0;
  doctorData.consultationFeeOffline = parseFloat(doctorData.consultationFeeOffline) || 0;
  doctorData.maxPatientsPerDay = parseInt(doctorData.maxPatientsPerDay) || 0;
  doctorData.followUpDiscountPercentage = parseFloat(doctorData.followUpDiscountPercentage) || 0;

  // Handle date fields
  if (doctorData.dob) doctorData.dob = new Date(doctorData.dob);

  try {
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { ...doctorData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedDoctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json({ message: "Doctor updated successfully", doctor: updatedDoctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

router.delete("/doctors/:id", async (req, res) => {
  try {
    const deletedDoctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!deletedDoctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;