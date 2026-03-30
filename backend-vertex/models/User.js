const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// 1. DEFINE THE SCHEMA (The Blueprint)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true, // CS Fundamental: Unique Index
    lowercase: true,
    trim: true,
  },
  pin: {
    type: String,
    required: [true, 'A secret PIN is required'],
    minlength: [4, 'PIN must be at least 4 digits'],
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  movements: {
    type: [Number],
    default: [], // <--- THIS IS THE KEY
  },
  movementsDates: {
    type: [String],
    default: [], // <--- AND THIS
  },
  balance: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
    select: false, // Hide this from API outputs by default
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});
userSchema.pre('save', async function () {
  if (!this.isModified('pin')) return; // Just return, don't call next

  this.pin = await bcrypt.hash(this.pin, 12);
  // No next() needed here because it's an async function!
});
userSchema.pre(/^find/, function () {
  // 'this' points to the current query
  // We only want users where active is NOT equal to false
  this.find({ active: { $ne: false } });
  // next();
});
userSchema.methods.correctPin = async function (candidatePin, userPin) {
  // candidatePin = the plain text pin from the login form
  // userPin = the hashed pin from the database
  return await bcrypt.compare(candidatePin, userPin);
};
// 2. CREATE THE MODEL (The Constructor)
const User = mongoose.model('User', userSchema);

// 3. EXPORT
module.exports = User;
