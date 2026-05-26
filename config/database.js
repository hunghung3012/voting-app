const mongoose = require('mongoose');
const mongoDB = 'mongodb://127.0.0.1:27017/BlockVotes';

mongoose.connect(mongoDB, { useNewUrlParser: true })
    .then(() => console.log('Connected to Local MongoDB (Port 27017)'))
    .catch(err => console.error('Local MongoDB Connection Error:', err));

mongoose.Promise = global.Promise;
module.exports = mongoose;