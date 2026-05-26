# Database Schema — BlockChainVoting

**Database:** MongoDB
**Connection:** `mongodb://localhost/BlockVotes` (defined in `config/database.js`)
**ODM:** Mongoose ^5.5.1

---

## Collection: `companylists`

**Model Name:** `CompanyList`
**Source:** `models/company.js`

| Field | Type | Required | Unique | Default | Description |
|---|---|---|---|---|---|
| `email` | String | Yes | No* | — | Company email address used for login |
| `password` | String | Yes | No | — | bcrypt-hashed password (saltRounds=10) |
| `_id` | ObjectId | Auto | Yes | Auto | MongoDB auto-generated ID |

*Note: Uniqueness is enforced at the application level (controller checks `findOne` before create), NOT at the schema level.

### Pre-save Hook
```javascript
CompanySchema.pre('save', function(cb) {
    this.password = bcrypt.hashSync(this.password, saltRounds);
    cb();
});
```
Password is hashed every time the document is saved — including updates, which could double-hash.

---

## Collection: `voterlists`

**Model Name:** `VoterList`
**Source:** `models/voter.js`

| Field | Type | Required | Unique | Default | Description |
|---|---|---|---|---|---|
| `email` | String | Yes | No* | — | Voter email (also used as initial password value) |
| `password` | String | Yes | No | — | bcrypt-hashed. Initial value = voter's email, then hashed |
| `election_address` | String | Yes | No | — | Ethereum address of the Election contract |
| `_id` | ObjectId | Auto | Yes | Auto | MongoDB auto-generated ID |

*Uniqueness is checked at application level: duplicate = same email + same election_address.

### Pre-save Hook
```javascript
VoterSchema.pre('save', function(cb) {
    this.password = bcrypt.hashSync(this.password, saltRounds);
    cb();
});
```

### Important Notes on Voter Auth
1. Voter password is initially set to the voter's email (line 23 of `controllers/voter.js`):
   ```javascript
   password: req.body.email
   ```
2. The password is then bcrypt-hashed by the pre-save hook
3. **BUG in voter authenticate**: The `authenticate` function queries by raw `{email, password}` match, but the stored password is hashed. This means voter login with the raw email-as-password will NOT match the hashed value. The voter would need to know the bcrypt hash to login.

---

## Database Connection

**File:** `config/database.js`
```javascript
const mongoose = require('mongoose');
const mongoDB = 'mongodb://localhost/BlockVotes';
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
module.exports = mongoose;
```

- No authentication configured (local dev only)
- Database name: `BlockVotes`
- Default port: 27017
- No connection pool configuration
- No retry logic
