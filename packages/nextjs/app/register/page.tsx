"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { keccak256 } from "viem/utils";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

// You might need to install viem if not already available

const RegisterVehiclePage = () => {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [odometer, setOdometer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { writeAsync: registerVehicle } = useScaffoldContractWrite({
    contractName: "RideRecords",
    functionName: "registerVehicle",
    args: [undefined, undefined], // Placeholder for serialHash and odometer
    value: undefined,
    onBlockConfirmation: async txnReceipt => {
      console.log("📦 Transaction blockHash and receipt:", txnReceipt.blockHash, txnReceipt);
      // Now that we have the full receipt, we can send data to the backend API
      try {
        if (!txnReceipt || !txnReceipt.from) {
          throw new Error("Transaction receipt or sender address not found in onBlockConfirmation.");
        }

        const currentOwner = txnReceipt.from;
        const txHash = txnReceipt.transactionHash;
        const serialHash = keccak256(Buffer.from(vin)); // Re-derive serialHash if needed, or pass it from handleSubmit scope

        const response = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serialHash,
            vinMasked: vin.slice(-4),
            make,
            model,
            year: parseInt(year),
            odometer: parseInt(odometer),
            currentOwner,
            txHash,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to register vehicle in backend");

        router.push(`/vehicle/${serialHash}`); // Navigate to detail page after backend update
      } catch (err: any) {
        console.error("Error sending data to backend after block confirmation:", err);
        setError(err.message || "Failed to update backend after transaction.");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Hash the VIN
      const serialHash = keccak256(Buffer.from(vin));

      // 2. Call the registerVehicle smart contract function
      // The onBlockConfirmation callback will handle the backend API call and navigation
      await registerVehicle({
        args: [serialHash, BigInt(odometer)],
      });
    } catch (err: any) {
      console.error("Error registering vehicle:", err);
      setError(err.message || "Failed to register vehicle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg text-white">
      <div className="card-bg p-8 rounded-xl shadow-lg border border-gris-neutro w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-aqua">Register Your Vehicle</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gris-neutro">
              VIN/Serial Number
            </label>
            <input
              type="text"
              id="vin"
              className="mt-1 block w-full border border-gris-neutro bg-transparent rounded-md shadow-sm p-2 text-white focus:ring-aqua focus:border-aqua"
              value={vin}
              onChange={e => setVin(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gris-neutro">
              Make
            </label>
            <input
              type="text"
              id="make"
              className="mt-1 block w-full border border-gris-neutro bg-transparent rounded-md shadow-sm p-2 text-white focus:ring-aqua focus:border-aqua"
              value={make}
              onChange={e => setMake(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gris-neutro">
              Model
            </label>
            <input
              type="text"
              id="model"
              className="mt-1 block w-full border border-gris-neutro bg-transparent rounded-md shadow-sm p-2 text-white focus:ring-aqua focus:border-aqua"
              value={model}
              onChange={e => setModel(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gris-neutro">
              Year
            </label>
            <input
              type="number"
              id="year"
              className="mt-1 block w-full border border-gris-neutro bg-transparent rounded-md shadow-sm p-2 text-white focus:ring-aqua focus:border-aqua"
              value={year}
              onChange={e => setYear(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="odometer" className="block text-sm font-medium text-gris-neutro">
              Odometer (km)
            </label>
            <input
              type="number"
              id="odometer"
              className="mt-1 block w-full border border-gris-neutro bg-transparent rounded-md shadow-sm p-2 text-white focus:ring-aqua focus:border-aqua"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-aqua text-blue-900 font-bold py-3 px-8 rounded-full transition-transform transform hover:bg-opacity-80 disabled:bg-aqua disabled:bg-opacity-50"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterVehiclePage;
