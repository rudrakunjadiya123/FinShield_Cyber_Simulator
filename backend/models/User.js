const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'cybersecurity', 'analyst', 'employee'],
    default: 'employee'
  },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  points: { type: Number, default: 0 },
  employee_id: { type: String, unique: true, sparse: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});



userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
