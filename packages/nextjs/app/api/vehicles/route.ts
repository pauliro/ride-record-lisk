import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabase } from "~/utils/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerAddress = searchParams.get("owner");

    let query = supabase.from("vehicles").select("*");

    if (ownerAddress) {
      query = query.eq("current_owner", ownerAddress.toLowerCase());
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { serialHash, vinMasked, brand, model, year, odometer, txHash, currentOwner } = await req.json();

    if (
      !serialHash ||
      !vinMasked ||
      !brand ||
      !model ||
      !year ||
      odometer === undefined ||
      odometer === null ||
      !txHash ||
      !currentOwner
    ) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newVehicle = {
      id: nanoid(),
      serial_hash: serialHash,
      vin_masked: vinMasked,
      brand: brand,
      model: model,
      year: year,
      odometer: odometer,
      current_owner: currentOwner,
      history: [
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
