const mongoose = require( 'mongoose' );

const taskSchema = new mongoose.Schema({
  workerId: String,
  hitId: String,
  assignmentId: String,
  sessionId: String,
  created: { type: Date, default: Date.now },
  studyName: String,
  trialId: String,
  browser: mongoose.Schema.Types.Mixed,
  ip: String,
  geo: mongoose.Schema.Types.Mixed
});


let Task = module.exports = mongoose.model('Task', taskSchema);
