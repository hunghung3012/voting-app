const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VoteRecordSchema = new Schema({
    voter_email: { type: String, required: true },
    voter_name: { type: String, default: '' },
    election_address: { type: String, required: true },
    candidate_id: { type: Number, required: true },
    candidate_name: { type: String, default: '' },
    voted_at: { type: Date, default: Date.now },
});

// Đảm bảo mỗi cử tri chỉ có 1 bản ghi duy nhất per election
VoteRecordSchema.index({ voter_email: 1, election_address: 1 }, { unique: true });

module.exports = mongoose.model('VoteRecord', VoteRecordSchema);
