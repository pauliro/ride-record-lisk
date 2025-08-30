import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";

const dbPath = path.resolve(process.cwd(), "db.json");

interface VehicleData {
  id: string;
  serialHash: string;
  vinMasked: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  currentOwner: string;
  history: any[];
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerAddress = searchParams.get("owner");
    const db = readDb();

    let vehicles = db.vehicles;

    if (ownerAddress) {
      vehicles = vehicles.filter(vehicle => vehicle.currentOwner.toLowerCase() === ownerAddress.toLowerCase());
    }

    return NextResponse.json(vehicles, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// Helper to write to the database
function writeDb(data: DbContent) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const { serialHash, vinMasked, make, model, year, odometer, txHash, currentOwner } = await req.json();

    if (!serialHash || !vinMasked || !make || !model || !year || !odometer || !txHash || !currentOwner) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const db = readDb();

    const newVehicle: VehicleData = {
      id: nanoid(),
      serialHash,
      vinMasked,
      make,
      model,
      year,
      odometer,
      currentOwner,
      history: [
        {
          type: "REGISTERED",
          timestamp: new Date().toISOString(),
          actor: currentOwner,
          odometer,
          chain: { network: "Base Sepolia", txHash },
        },
      ],
    };

    db.vehicles.push(newVehicle);
    writeDb(db);

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error: any) {
    console.error("Error registering vehicle:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
