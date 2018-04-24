const mongoose = require( 'mongoose' );

const taskSchema = new mongoose.Schema({
  workerId: String,
  hitId: String,
  assignmentId: String,
  completionCode: String,
  sessionId: String,
  created: { type: Date, default: Date.now },
  studyName: String,
});

let Task = module.exports = mongoose.model('Task', taskSchema);
