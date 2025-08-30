import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
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

export async function GET(req: NextRequest, { params }: { params: { serialHash: string } }) {
  try {
    const { serialHash } = params;
    const db = readDb();
    const vehicle = db.vehicles.find(v => v.serialHash === serialHash);

    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
