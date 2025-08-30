import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/utils/supabaseClient"; // Use ~ for alias if configured, otherwise adjust path

export async function POST(
  req: NextRequest,
  { params }: { params: { serialHash: string } },
) {
  try {
    const { serialHash } = params;
    const { newOwnerAddress, previousOwnerAddress, odometer, txHash } = await req.json();

    if (!newOwnerAddress || !previousOwnerAddress || odometer === undefined || odometer === null || !txHash) {
      return NextResponse.json({ message: "Missing required fields for transfer" }, { status: 400 });
    }

    // Fetch the existing vehicle to get current history
    const { data: existingVehicles, error: fetchError } = await supabase
      .from("vehicles")
      .select("history, current_owner")
      .eq("serial_hash", serialHash);

    if (fetchError) throw fetchError;
    if (!existingVehicles || existingVehicles.length === 0) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    const currentHistory = existingVehicles[0].history;
    // You might want to add more robust checks here to ensure previousOwnerAddress matches existingVehicles[0].current_owner

    const newTransferEvent = {
      type: "TRANSFER_COMPLETED",
      timestamp: new Date().toISOString(),
      actor: previousOwnerAddress,
      to: newOwnerAddress,
      odometer: odometer,
      chain: { network: "Base Sepolia", txHash: txHash },
    };

    const updatedHistory = [...currentHistory, newTransferEvent];

    // Update the vehicle's owner and history in Supabase
    const { data, error: updateError } = await supabase
      .from("vehicles")
      .update({ current_owner: newOwnerAddress, history: updatedHistory })
      .eq("serial_hash", serialHash)
      .select();

    if (updateError) throw updateError;

    return NextResponse.json(data[0], { status: 200 });
  } catch (error: any) {
    console.error("Error transferring vehicle:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
