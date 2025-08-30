import { NextRequest, NextResponse } from "next/server";
import { supabase } from "~/utils/supabaseClient"; // Use ~ for alias if configured, otherwise adjust path

export async function GET(
  req: NextRequest,
  { params }: { params: { serialHash: string } },
) {
  try {
    const { serialHash } = params;

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("serial_hash", serialHash)
      .single(); // Use .single() to get a single record

    if (error) {
      if (error.code === "PGRST116") { // No rows found
        return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
      }
      throw error;
    }

    if (!data) {
        return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching vehicle by serialHash:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
