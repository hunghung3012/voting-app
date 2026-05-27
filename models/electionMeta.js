const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ElectionMetaSchema = new Schema({
    election_address: { type: String, required: true, unique: true },
    is_ended: { type: Boolean, default: false },
    winner_name: { type: String, default: '' },
    winner_votes: { type: Number, default: 0 },
    ended_at: { type: Date }
});

module.exports = mongoose.model('ElectionMeta', ElectionMetaSchema);
