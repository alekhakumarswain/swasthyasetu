const mongoose = require('mongoose');

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
  // ... rest of the Blood schema fields
});

module.exports = mongoose.model("Blood", BloodSchema);