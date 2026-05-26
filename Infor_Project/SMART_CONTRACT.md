# Smart Contract — Election.sol

**File:** `Ethereum/Contract/Election.sol`
**Pragma:** `^0.4.25`

This file contains TWO contracts:

---

## Contract 1: ElectionFact (Factory)

The factory contract. Deployed ONCE. Creates individual Election contracts for each company.

### State Variables

| Name | Type | Visibility | Description |
|---|---|---|---|
| `companyEmail` | `mapping(string => ElectionDet)` | internal | Maps company email to their election details |

### Structs

```solidity
struct ElectionDet {
    address deployedAddress;  // Address of the deployed Election contract
    string el_n;              // Election name
    string el_d;              // Election description
}
```

### Functions

| Function | Parameters | Returns | Access | Description |
|---|---|---|---|---|
| `createElection` | `email`, `election_name`, `election_description` | void | public | Creates new Election contract, stores address + details in mapping |
| `getDeployedElection` | `email` | `(address, string, string)` | public view | Returns election address, name, description. Returns `(0, "", "Create an election.")` if none exists |

### Key Behavior
- Each call to `createElection` deploys a NEW `Election` contract
- The factory uses `msg.sender` as the election authority
- If called again for the same email, it OVERWRITES the previous election

---

## Contract 2: Election (Per-Organization)

Created by `ElectionFact.createElection()`. One per company/election.

### State Variables

| Name | Type | Visibility | Description |
|---|---|---|---|
| `election_authority` | `address` | internal | The address that deployed/owns this election |
| `election_name` | `string` | internal | Name of the election |
| `election_description` | `string` | internal | Description of the election |
| `status` | `bool` | internal | Election status (set to `true` on creation, never changed — unused) |
| `numCandidates` | `uint8` | internal | Counter for candidates (max 255) |
| `numVoters` | `uint8` | internal | Counter for voters who have voted (max 255) |
| `candidates` | `mapping(uint8 => Candidate)` | public | Maps candidate ID to Candidate struct |
| `voters` | `mapping(string => Voter)` | internal | Maps voter email to Voter struct |

### Structs

```solidity
struct Candidate {
    string candidate_name;
    string candidate_description;
    string imgHash;        // IPFS hash of candidate image
    uint8 voteCount;       // Number of votes received (max 255)
    string email;          // Candidate email
}

struct Voter {
    uint8 candidate_id_voted;  // Which candidate they voted for
    bool voted;                // Whether they have voted
}
```

### Modifiers

| Modifier | Condition | Error Message |
|---|---|---|
| `owner` | `msg.sender == election_authority` | "Error: Access Denied." |

### Functions

| Function | Parameters | Returns | Access | Description |
|---|---|---|---|---|
| `constructor` | `authority`, `name`, `description` | — | public | Sets authority, name, description, status=true |
| `addCandidate` | `candidate_name`, `candidate_description`, `imgHash`, `email` | void | owner | Adds candidate to mapping, increments counter |
| `vote` | `candidateID`, `e` (voter email) | void | public | Records vote. Checks double-vote via `require(!voters[e].voted)`. Increments voteCount |
| `getNumOfCandidates` | — | `uint8` | public view | Returns candidate count |
| `getNumOfVoters` | — | `uint8` | public view | Returns voter count |
| `getCandidate` | `candidateID` | `(name, desc, imgHash, voteCount, email)` | public view | Returns candidate details |
| `winnerCandidate` | — | `uint8` (candidateID) | owner, view | Iterates candidates, returns ID with most votes |
| `getElectionDetails` | — | `(name, description)` | public view | Returns election name and description |

### Double-Voting Prevention

```solidity
function vote(uint8 candidateID, string e) public {
    require(!voters[e].voted, "Error:You cannot double vote");
    voters[e] = Voter(candidateID, true);
    numVoters++;
    candidates[candidateID].voteCount++;
}
```

The voter identifier is their **email string** (parameter `e`), NOT their Ethereum address. This means:
- Voting is tied to the email, not the wallet
- Anyone with the voter's email could potentially vote on their behalf
- The same wallet can vote for multiple different voter emails

### Owner Modifier (Company Ownership)

```solidity
modifier owner() {
    require(msg.sender == election_authority, "Error: Access Denied.");
    _;
}
```

Only the Ethereum address that created the election (via `ElectionFact.createElection`) can:
- Add candidates (`addCandidate`)
- Check winner (`winnerCandidate`)

### Events
**None** — the contract does not emit any events.

### Limitations
- `uint8` for counters limits to 255 candidates and 255 voters
- No election end mechanism on-chain (status bool is set but never checked)
- No way to remove candidates
- Winner determination is simple max-vote (no tie-breaking)
- Voter identity is email string, not Ethereum address
