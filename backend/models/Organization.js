const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  industry: { type: String, default: '' },
  size: {
    type: String,
    enum: ['1-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-50'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  departments: [{ type: String }]
}, { timestamps: true });

// Auto-generate org code from name
organizationSchema.pre('validate', function (next) {
  if (!this.code && this.name) {
    this.code = this.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6) + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);
