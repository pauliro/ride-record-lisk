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
    const { description, actor } = await req.json();

    if (!description || !actor) {
      return NextResponse.json({ message: "Missing required fields: description or actor" }, { status: 400 });
    }

    const db = readDb();
    const vehicleIndex = db.vehicles.findIndex(v => v.serialHash === serialHash);

    if (vehicleIndex === -1) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    const newMaintenanceEvent: HistoryEvent = {
      type: "MAINTENANCE",
      timestamp: new Date().toISOString(),
      actor,
      data: { notes: description },
    };

    db.vehicles[vehicleIndex].history.push(newMaintenanceEvent);
    writeDb(db);

    return NextResponse.json(newMaintenanceEvent, { status: 201 });
  } catch (error: any) {
    console.error("Error adding maintenance record:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
