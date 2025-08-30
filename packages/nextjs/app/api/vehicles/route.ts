import { NextRequest, NextResponse } from "next/server";

import { nanoid } from "nanoid";
import { supabase } from "~/utils/supabaseClient"; // Use ~ for alias if configured, otherwise adjust path

interface VehicleData {
  id: string;
  serialHash: string;
  vinMasked: string;
  brand: string;
  model: string;
  year: number;
  odometer: number;
  currentOwner: string;
  history: any[]; // This will be stored as JSONB in Supabase
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerAddress = searchParams.get("owner");

    let query = supabase.from("vehicles").select("*");

    if (ownerAddress) {
      // Supabase column names are snake_case as per our schema
      query = query.eq("current_owner", ownerAddress.toLowerCase());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Supabase returns snake_case, you might need to transform to camelCase for frontend consistency
    // For now, we'll return as is, but keep this in mind.
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { serialHash, vinMasked, brand, model, year, odometer, txHash, currentOwner } = await req.json();

    if (!serialHash || !vinMasked || !brand || !model || !year || odometer === undefined || odometer === null || !txHash || !currentOwner) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newVehicle = {
      id: nanoid(), // Keep using nanoid for client-side ID generation
      serial_hash: serialHash, // Maps to serial_hash in Supabase
      vin_masked: vinMasked,   // Maps to vin_masked in Supabase
      brand: brand,
      model: model,
      year: year,
      odometer: odometer,
      current_owner: currentOwner, // Maps to current_owner in Supabase
      history: [ // Initial history entry
        {
          type: "REGISTERED",
          timestamp: new Date().toISOString(),
          actor: currentOwner,
          odometer: odometer,
          chain: { network: "Base Sepolia", txHash: txHash },
        },
      ],
    };

    const { data, error } = await supabase.from("vehicles").insert([newVehicle]).select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    console.error("Error registering vehicle:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
