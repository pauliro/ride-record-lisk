# Product Requirements Document: RideRecords

**Version:** 1.0 (Hackathon MVP)

## 1. Overview

### 1.1. One-Liner

**RideRecords** — the “Carfax on-chain” for LATAM. A decentralized & tamper-evident history of a used vehicle, built on Base, to reduce fraud and boost trust in P2P transactions.

### 1.2. Core Problem

The used car market suffers from information asymmetry and fraud (e.g., odometer rollbacks, hidden accident history). Buyers lack a trusted, single source of truth for a vehicle's history.

### 1.3. Solution (MVP)

A web application that allows users to create a permanent, on-chain identity for a vehicle. Key events like registration and ownership transfer are anchored to the Base Sepolia blockchain, creating an immutable audit trail. The history is presented in a clean, easy-to-read timeline.

---

## 2. Technical Architecture (Hackathon Stack)

| Component | Technology/Service | Rationale |
| :--- | :--- | :--- |
| **Blockchain** | **Base Sepolia** | EVM-compatible, fast, low-cost. Allows use of the sample repo's tooling. |
| **Blockchain Middleware** | **MultiBaas** | Handles contract deployment, indexing, and provides a simple SDK for interaction. **Crucial for speed.** |
| **Frontend** | **React** | Provided by the sample repository. Modern, component-based UI development. |
| **Backend** | **AWS Lambda (Serverless)** | Provided by the sample repository. Scalable, fast to deploy new endpoints. |
| **Database** | **In-Memory JSON / LowDB** | Simplest possible DB for a hackathon. No setup required. Can be a simple `db.json` file managed by the Lambda functions. |
| **File Storage** | **Local Server Storage** | Fastest way to implement evidence uploads. A `/uploads` directory on the backend. |
| **Wallet Interaction** | **`@base-org/account`** | Provided by the sample repository. Connects to MetaMask and other wallets seamlessly. |

---

## 3. Core User Stories & Functionality (MVP)

### US-1: Onboarding

> **As a user, I want to connect my wallet or enter a demo mode, so I can start using the application quickly.**

**Acceptance Criteria:**
- The welcome screen has two buttons: "Connect Wallet" and "Enter Demo Mode".
- "Connect Wallet" prompts the user with MetaMask to connect to Base Sepolia.
- Once connected, the UI shows a truncated wallet address (e.g., `0xAB...12`).
- "Demo Mode" allows access to the app's features using mock data, without requiring a wallet.

### US-2: Vehicle Registration

> **As a vehicle owner, I want to register my vehicle by providing its core details and anchoring its existence on the blockchain.**

**Acceptance Criteria:**
- A form allows input for: VIN/Serial, Make, Model, Year, and Odometer.
- The VIN is **hashed** on the frontend before being sent to the backend.
- On submission, the frontend calls the `registerVehicle` smart contract function via MetaMask, including the current odometer.
- After the transaction is sent, the frontend calls the backend API with the form data and the resulting `txHash`.
- The backend saves the vehicle details and the `txHash` to the database.
- The user is redirected to the "Vehicle Detail" page.

### US-3: Vehicle History View

> **As a potential buyer, I want to view the complete, chronological history of a vehicle to verify its provenance.**

**Acceptance Criteria:**
- A "Vehicle Detail" page displays the vehicle's summary (Make, Model, Year).
- A timeline view lists all events associated with the vehicle.
- Events are fetched from the MultiBaas Events API, ensuring both on-chain and off-chain events are shown.
- On-chain events (like "Registered" and "Transferred") display a verifiable link to the transaction on a Base Sepolia block explorer, including the odometer reading at the time of the event.

### US-4: Add Maintenance Record

> **As a vehicle owner, I want to add maintenance records to my vehicle's history to prove I've taken good care of it.**

**Acceptance Criteria:**
- On the "Vehicle Detail" page, there is an "Add Maintenance" button.
- A simple form allows the user to enter a description (e.g., "Oil Change") and upload an optional evidence file (e.g., a receipt).
- This is an **off-chain** event. The backend saves the maintenance record to the database, associated with the vehicle.
- The timeline on the "Vehicle Detail" page updates immediately to show the new maintenance record.

### US-5: Ownership Transfer

> **As a vehicle owner, I want to transfer ownership to another person on-chain, creating an immutable record of the transaction.**

**Acceptance Criteria:**
- On the "Vehicle Detail" page, there is a "Transfer Ownership" button (visible only to the current owner).
- A form asks for the recipient's wallet address and the current odometer reading.
- On submission, the frontend calls the `transferVehicle` smart contract function via MetaMask, including the new owner's address and the current odometer.
- After the transaction is sent, the frontend calls the backend API with the new owner's address, `txHash`, and odometer.
- The backend updates the `currentOwner` in the database and adds a "Transfer Completed" event.
- The timeline updates to show the transfer event with a link to the transaction and the odometer reading at the time of transfer.

---

## 4. Data & Contract Models

### 4.1. Smart Contract (`RideRecords.sol`)

A minimal contract focused on anchoring key events.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error VehicleAlreadyRegistered(bytes32 serialHash);
error OnlyOwnerCanTransfer(bytes32 serialHash, address currentOwner, address caller);
error CannotTransferToZeroAddress(bytes32 serialHash);

contract RideRecords {
    // Mapping from the hashed vehicle serial number to its current owner
    mapping(bytes32 => address) public vehicleOwners;

    // Event for when a new vehicle is registered
    event VehicleRegistered(
        bytes32 indexed serialHash,
        address indexed owner,
        uint256 odometer
    );

    // Event for when a vehicle is transferred
    event VehicleTransferred(
        bytes32 indexed serialHash,
        address indexed from,
        address indexed to,
        uint256 odometer
    );

    /**
     * @notice Registers a new vehicle, anchoring it on-chain.
     * @param serialHash The keccak256 hash of the vehicle's VIN/serial number.
     * @param odometer The current odometer reading of the vehicle.
     */
    function registerVehicle(bytes32 serialHash, uint256 odometer) public {
        if (vehicleOwners[serialHash] != address(0)) {
            revert VehicleAlreadyRegistered(serialHash);
        }
        vehicleOwners[serialHash] = msg.sender;
        emit VehicleRegistered(serialHash, msg.sender, odometer);
    }

    /**
     * @notice Transfers ownership of a vehicle to a new address.
     * @param serialHash The keccak256 hash of the vehicle's VIN/serial number.
     * @param to The address of the new owner.
     * @param odometer The current odometer reading of the vehicle.
     */
    function transferVehicle(bytes32 serialHash, address to, uint256 odometer) public {
        address currentOwner = vehicleOwners[serialHash];
        if (currentOwner == address(0)) {
            revert VehicleAlreadyRegistered(serialHash);
        }
        if (currentOwner != msg.sender) {
            revert OnlyOwnerCanTransfer(serialHash, currentOwner, msg.sender);
        }
        if (to == address(0)) {
            revert CannotTransferToZeroAddress(serialHash);
        }
        
        address from = msg.sender;
        vehicleOwners[serialHash] = to;
        emit VehicleTransferred(serialHash, from, to, odometer);
    }

    /**
     * @notice Gets the current owner of a vehicle.
     * @param serialHash The keccak256 hash of the vehicle's VIN/serial number.
     * @return The address of the current owner.
     */
    function getVehicleOwner(bytes32 serialHash) public view returns (address) {
        return vehicleOwners[serialHash];
    }
}
```

### 4.2. Database Model (`db.json`)

A simple JSON file to act as our database.

```json
{
  "vehicles": [
    {
      "id": "uuid-1",
      "serialHash": "0xabc...",
      "vinMasked": "...1234",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "odometer": 100000,
      "currentOwner": "0x...",
      "history": [
        {
          "type": "REGISTERED",
          "timestamp": "2023-10-27T10:00:00Z",
          "actor": "0x...",
          "odometer": 100000,
          "chain": {
            "network": "Base Sepolia",
            "txHash": "0x123..."
          }
        },
        {
          "type": "MAINTENANCE",
          "timestamp": "2023-11-15T14:30:00Z",
          "actor": "0x...",
          "data": {
            "notes": "Oil change and tire rotation.",
            "evidenceUri": "/uploads/receipt-1.pdf"
          }
        },
        {
          "type": "TRANSFER_COMPLETED",
          "timestamp": "2023-12-01T11:00:00Z",
          "actor": "0x...", // previous owner
          "to": "0x...", // new owner
          "odometer": 105000,
          "chain": {
            "network": "Base Sepolia",
            "txHash": "0x456..."
          }
        }
      ]
    }
  ]
}
```

---

## 5. Hackathon Execution Plan (Incremental Steps)

This plan is designed to build the project slice by slice, ensuring we always have a demonstrable feature.

**Phase 0: Setup (Est: 1-2 hours)**
1.  Clone the MultiBaas sample application repository.
2.  Run `npm install` in both `frontend` and `backend` directories.
3.  Create a MultiBaas account and a new deployment targeting **Base Sepolia**.
4.  Configure the backend with your MultiBaas credentials.
5.  Get the sample app running locally to confirm the setup is correct.

**Phase 1: The First On-Chain Event (Est: 2-3 hours)**
1.  **Contract:** Write the `RideRecords.sol` contract (as defined above), including `odometer` in `VehicleRegistered` events and `registerVehicle` function.
2.  **Deploy:** Deploy the contract to Base Sepolia using the MultiBaas dashboard. This will automatically generate the ABI and make it available to the SDK.
3.  **Backend:** Create a new Lambda function `POST /vehicles`. This function will:
    -   Receive `serialHash`, `odometer`, and vehicle data from the frontend.
    -   Use the MultiBaas SDK to call the `registerVehicle` contract function with the `serialHash` and `odometer`.
    -   Save the vehicle data, `txHash`, and `odometer` into the `db.json` file's history.
4.  **Frontend:**
    -   Create the "Register Vehicle" form with an odometer input.
    -   Implement the logic to hash the VIN.
    -   On submit, call the new backend endpoint.
    -   **Goal:** Successfully register a vehicle and see the record in `db.json` with a `txHash` and odometer.

**Phase 2: Viewing History (Est: 2 hours)**
1.  **Backend:** Create a Lambda function `GET /vehicles/:serialHash`. This function will:
    -   Find the vehicle in `db.json`.
    -   Use the MultiBaas `EventQueriesApi` to fetch all `VehicleRegistered` and `VehicleTransferred` events for that `serialHash`, including `odometer`.
    -   Combine the DB history (for maintenance) with the on-chain events and return a sorted timeline.
2.  **Frontend:**
    -   Create the "Vehicle Detail" page.
    -   Fetch data from the `GET /vehicles/:serialHash` endpoint.
    -   Render the timeline, adding a link to a block explorer for on-chain events and displaying the odometer.
    -   **Goal:** See a timeline with the "Registered" event from Phase 1, including its odometer.

**Phase 3: Adding Off-Chain Data (Est: 1.5 hours)**
1.  **Backend:** Create a Lambda function `POST /vehicles/:serialHash/events` for adding maintenance.
    -   Implement a simple file upload handler to save files to a local `/uploads` directory.
    -   Add the new maintenance event to the vehicle's history array in `db.json`.
2.  **Frontend:**
    -   Build the "Add Maintenance" form.
    -   On submit, call the new backend endpoint and refresh the timeline.
    -   **Goal:** Add a maintenance record and see it appear instantly in the vehicle's history.

**Phase 4: The Second On-Chain Event (Est: 2 hours)**
1.  **Backend:** Create a Lambda function `POST /vehicles/:serialHash/transfer`. This function will:
    -   This function will use the MultiBaas SDK to call the `transferVehicle` contract function with the `serialHash`, new owner, and `odometer`.
    -   On success, it will update the `currentOwner` and add a `TRANSFER_COMPLETED` event to the history in `db.json`, including the `odometer`.
2.  **Frontend:**
    -   Build the "Transfer Ownership" UI with an odometer input.
    -   On submit, trigger the backend transfer logic.
    -   **Goal:** Transfer a vehicle to a new owner and see the "Transfer Completed" event appear in the timeline with a new `txHash` and odometer.

**Phase 5: Final Polish (Est: 1 hour)**
1.  Implement the "Demo Mode" toggle on the frontend.
2.  Clean up the UI and ensure the user flow is smooth.
3.  Prepare the 90-second demo script.

---

## 6. Stretch Goals (If Time Permits)

-   **IPFS Integration:** Replace the local file storage with uploads to IPFS via a pinning service like Pinata.
-   **Public Search:** Implement a search page to find vehicles by their `serialHash`.
-   **Enhanced UI:** Add loading spinners, error messages, and success notifications.
-   **Two-Step Transfer:** Implement the `initiate/accept` transfer flow for a better UX.

---

## 7. Demo Script (90-Second Pitch)

1.  **(5s) Intro:** "This is RideRecords, a Carfax on-chain to fight fraud in the used car market."
2.  **(15s) Connect & Register:** "As a seller, I connect my wallet using Scaffold-Lisk's RainbowKit integration. I'll register my car by entering its details, including the current odometer. The VIN is hashed for privacy, and we use Scaffold-Lisk's `useScaffoldContractWrite` hook to anchor it to the Base blockchain." (Show MetaMask popup, then success).
3.  **(20s) View History:** "Now, any potential buyer can see the vehicle's history. Here's the registration event, immutably stored on-chain with its odometer reading, fetched using Scaffold-Lisk's `useScaffoldEventHistory` hook." (Point to the timeline and the block explorer link). "I'll add a quick maintenance record, like an oil change, which is added to its off-chain history." (Explain that off-chain history is managed by a separate backend API).
4.  **(20s) Transfer:** "When I sell the car, I can transfer ownership directly on-chain using Scaffold-Lisk's `useScaffoldContractWrite` hook. I'll enter the buyer's address and the current odometer..." (Show MetaMask popup for transfer). "The timeline instantly updates with the new owner, another on-chain proof, and the odometer reading at the time of transfer."
5.  **(10s) Conclusion:** "By combining a fast off-chain database with the security of on-chain anchors, powered by Scaffold-Lisk's robust tooling, RideRecords creates a trusted, transparent, and fraud-resistant history for every vehicle. Thank you."