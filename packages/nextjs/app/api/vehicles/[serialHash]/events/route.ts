import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/utils/supabaseClient"; // Use ~ for alias if configured, otherwise adjust path

export async function POST(
  req: NextRequest,
  { params }: { params: { serialHash: string } },
) {
  try {
    const { serialHash } = params;
    const { description, actor } = await req.json();

    if (!description || !actor) {
      return NextResponse.json({ message: "Missing required fields: description and actor" }, { status: 400 });
    }

    // Fetch the existing vehicle
    const { data: existingVehicles, error: fetchError } = await supabase
      .from("vehicles")
      .select("history")
      .eq("serial_hash", serialHash);

    if (fetchError) throw fetchError;
    if (!existingVehicles || existingVehicles.length === 0) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    const currentHistory = existingVehicles[0].history;

    const newMaintenanceEvent = {
      type: "MAINTENANCE",
      timestamp: new Date().toISOString(),
      actor: actor,
      data: { notes: description },
    };

    const updatedHistory = [...currentHistory, newMaintenanceEvent];

    // Update the vehicle's history in Supabase
    const { data, error: updateError } = await supabase
      .from("vehicles")
      .update({ history: updatedHistory })
      .eq("serial_hash", serialHash)
      .select();

    if (updateError) throw updateError;

    return NextResponse.json(data[0], { status: 200 });
  } catch (error: any) {
    console.error("Error adding maintenance record:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
