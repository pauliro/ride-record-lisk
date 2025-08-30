"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { keccak256 } from "viem/utils"; // You might need to install viem if not already available

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
    onBlockConfirmation: async (txnReceipt) => {
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register Vehicle</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
              VIN/Serial Number
            </label>
            <input
              type="text"
              id="vin"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={vin}
              onChange={e => setVin(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              Make
            </label>
            <input
              type="text"
              id="make"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={make}
              onChange={e => setMake(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Model
            </label>
            <input
              type="text"
              id="model"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={model}
              onChange={e => setModel(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="number"
              id="year"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={year}
              onChange={e => setYear(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="odometer" className="block text-sm font-medium text-gray-700">
              Odometer (km)
            </label>
            <input
              type="number"
              id="odometer"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
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
