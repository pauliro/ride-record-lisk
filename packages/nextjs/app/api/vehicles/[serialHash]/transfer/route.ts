import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "db.json");

interface HistoryEvent {
  type: "REGISTERED" | "MAINTENANCE" | "TRANSFER_COMPLETED";
  timestamp: string;
  actor: string;
  odometer?: number;
  chain?: { network: string; txHash: string };
  data?: { notes?: string; evidenceUri?: string };
  to?: string;
}

interface VehicleData {
  id: string;
  serialHash: string;
  vinMasked: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  currentOwner: string;
  history: HistoryEvent[];
}

interface DbContent {
  vehicles: VehicleData[];
}

// Helper to read the database
function readDb(): DbContent {
  if (!fs.existsSync(dbPath)) {
    return { vehicles: [] };
  }
  const dbRaw = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(dbRaw);
}

// Helper to write to the database
function writeDb(data: DbContent) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest, { params }: { params: { serialHash: string } }) {
  try {
    const { serialHash } = params;
    const { newOwnerAddress, previousOwnerAddress, odometer, txHash } = await req.json();

    if (!newOwnerAddress || !previousOwnerAddress || !odometer || !txHash) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const db = readDb();
    const vehicleIndex = db.vehicles.findIndex(v => v.serialHash === serialHash);

    if (vehicleIndex === -1) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    const vehicle = db.vehicles[vehicleIndex];

    // Update current owner
    vehicle.currentOwner = newOwnerAddress;

    // Add transfer event to history
    const newTransferEvent: HistoryEvent = {
      type: "TRANSFER_COMPLETED",
      timestamp: new Date().toISOString(),
      actor: previousOwnerAddress, // The one who initiated the transfer
      to: newOwnerAddress,
      odometer,
      chain: { network: "Base Sepolia", txHash },
    };
    vehicle.history.push(newTransferEvent);

    writeDb(db);

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error: any) {
    console.error("Error transferring vehicle ownership:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
