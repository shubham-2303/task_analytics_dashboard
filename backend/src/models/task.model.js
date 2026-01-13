const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  taskId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  assignee: { type: String, required: true },
  status: { type: String, enum: ['todo', 'in-progress', 'completed'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
  estimatedHours: { type: Number, required: true },
  actualHours: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  category: { type: String, required: true },
  notes: { type: String },
  efficiencyScore: { type: Number },
  delayDays: { type: Number }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);