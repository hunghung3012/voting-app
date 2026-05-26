# API Routes — BlockChainVoting

All routes are Express.js endpoints. Next.js pages are rendered via SSR.

## Express API Endpoints

### Company Routes (mounted at `/company`)

| Method | Path | Handler | Request Body | Response | Description |
|---|---|---|---|---|---|
| POST | `/company/register` | `controllers/company.create` | `email`, `password` | `{status, message, data: {id}}` | Register new company. Checks for duplicate email. Password bcrypt-hashed on save. |
| POST | `/company/authenticate` | `controllers/company.authenticate` | `email`, `password` | `{status, message, data: {id, email}}` | Login. Compares bcrypt hash. Returns company info. |

### Voter Routes (mounted at `/voter`)

| Method | Path | Handler | Request Body | Response | Description |
|---|---|---|---|---|---|
| POST | `/voter/register` | `controllers/voter.create` | `email`, `election_address`, `election_name`, `election_description` | `{status, message}` | Add voter. Password auto-set to email (then hashed). Sends credentials via Nodemailer. |
| POST | `/voter/authenticate` | `controllers/voter.authenticate` | `email`, `password` | `{status, message, data: {id, election_address}}` | Voter login. Finds by email+password match. |
| POST | `/voter/` | `controllers/voter.getAll` | `election_address` | `{status, message, data: {voters: [{id, email}]}, count}` | List all voters for an election. |
| PUT | `/voter/:voterId` | `controllers/voter.updateById` | `email`, `election_name`, `election_description` | `{status, message}` | Update voter email. Re-hashes password. Sends new credentials. |
| DELETE | `/voter/:voterId` | `controllers/voter.deleteById` | (none) | `{status, message}` | Remove voter from DB. |
| POST | `/voter/resultMail` | `controllers/voter.resultMail` | `election_address`, `election_name`, `candidate_email`, `winner_candidate` | `{status, message}` | Email election results to all voters + winner candidate. |

### Candidate Routes (mounted at `/candidate`)

| Method | Path | Handler | Request Body | Response | Description |
|---|---|---|---|---|---|
| POST | `/candidate/registerCandidate` | `controllers/candidate.register` | `email`, `election_name` | `{status, message}` | Send registration notification email to candidate. |

## Next.js Page Routes (defined in `routes.js`)

| URL Pattern | Page Component | Description |
|---|---|---|
| `/homepage` | `pages/homepage.js` | Landing page |
| `/company_login` | `pages/company_login.js` | Company auth page |
| `/voter_login` | `pages/voter_login.js` | Voter auth page |
| `/election/:address/company_dashboard` | `pages/election/company_dashboard.js` | Admin dashboard |
| `/election/:address/voting_list` | `pages/election/voting_list.js` | Voter management |
| `/election/:address/addcand` | `pages/election/addcand.js` | Add candidate (route defined but no page file — may be legacy) |
| `/election/:address/vote` | `pages/election/vote.js` | Voter voting page |
| `/election/:address/candidate_list` | `pages/election/candidate_list.js` | Candidate management |

### Additional Routes (defined in `server.js`)

| Method | Path | Handler | Description |
|---|---|---|---|
| GET | `/` | `res.sendFile(pages/homepage.js)` | Root route — serves homepage file directly |

## Response Format

All API responses follow this JSON structure:
```json
{
  "status": "success" | "error",
  "message": "Human-readable message",
  "data": { ... } | null
}
```
