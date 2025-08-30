"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useScaffoldEventHistory, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { formatUnits } from "viem";
import Link from "next/link";

// Helper to truncate addresses for display
const truncateAddress = (address: string) => {
  if (!address) return "";
  const start = address.substring(0, 6);
  const end = address.substring(address.length - 4);
  return `${start}...${end}`;
};

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

const VehicleDetailPage = () => {
  const { serialHash } = useParams<{ serialHash: string }>();
  const { address: connectedAddress } = useAccount();
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceDescription, setMaintenanceDescription] = useState("");
  const [transferToAddress, setTransferToAddress] = useState("");
  const [transferOdometer, setTransferOdometer] = useState("");

  // Read current owner from contract
  const { data: contractOwner, isLoading: isLoadingContractOwner } = useScaffoldContractRead({
    contractName: "RideRecords",
    functionName: "getVehicleOwner",
    args: [serialHash as `0x${string}`],
  });

  // Fetch on-chain events
  const { data: registeredEvents, isLoading: isLoadingRegisteredEvents } = useScaffoldEventHistory({
    contractName: "RideRecords",
    eventName: "VehicleRegistered",
    filters: { serialHash: serialHash as `0x${string}` },
    fromBlock: BigInt(0),
  });

  const { data: transferredEvents, isLoading: isLoadingTransferredEvents } = useScaffoldEventHistory({
    contractName: "RideRecords",
    eventName: "VehicleTransferred",
    filters: { serialHash: serialHash as `0x${string}` },
    fromBlock: BigInt(0),
  });

  console.log("VehicleDetailPage - serialHash:", serialHash);
  console.log("VehicleDetailPage - contractOwner:", contractOwner);
  console.log("VehicleDetailPage - registeredEvents:", registeredEvents);
  console.log("VehicleDetailPage - transferredEvents:", transferredEvents);

  // Write function for transferring ownership
  const { writeAsync: transferVehicle } = useScaffoldContractWrite({
    contractName: "RideRecords",
    functionName: "transferVehicle",
    args: [undefined, undefined, undefined], // serialHash, to, odometer
    value: undefined,
    onBlockConfirmation: async txnReceipt => {
      console.log("📦 Transfer transaction blockHash", txnReceipt.blockHash);
      // Call backend to update off-chain history with txHash
      try {
        if (!txnReceipt || !txnReceipt.from) {
          throw new Error("Transaction receipt or sender address not found in onBlockConfirmation.");
        }

        const previousOwnerAddress = txnReceipt.from;
        const txHash = txnReceipt.transactionHash;

        const response = await fetch(`/api/vehicles/${serialHash}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newOwnerAddress: transferToAddress,
            previousOwnerAddress,
            odometer: parseInt(transferOdometer),
            txHash,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to update backend with transfer data");

        // Instead of manually updating history, trigger a re-fetch of vehicle data
        // The useEffect will re-run due to changes in contractOwner/transferredEvents
        // and will also re-fetch backendData.

        // Clear form fields
        setTransferToAddress("");
        setTransferOdometer("");

      } catch (err: any) {
        console.error("Error sending transfer data to backend after block confirmation:", err);
        setError(err.message || "Failed to update backend after transfer.");
      }
    },
  });

  // Combine all loading states
  const isPageLoading = isLoadingContractOwner || isLoadingRegisteredEvents || isLoadingTransferredEvents || loading;

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!serialHash || isLoadingContractOwner || isLoadingRegisteredEvents || isLoadingTransferredEvents) return; // Wait for on-chain data to load
      setLoading(true);
      setError(null);

      try {
        // Fetch vehicle data from backend API
        const response = await fetch(`/api/vehicles/${serialHash}`);
        const backendData: VehicleData = await response.json();

        if (!response.ok) {
          throw new Error(backendData.message || "Failed to fetch vehicle from backend");
        }

        // Combine on-chain events with off-chain data
        const combinedHistory: HistoryEvent[] = [...backendData.history];

        registeredEvents?.forEach(event => {
          if (event.log && event.log.block && event.args) {
            combinedHistory.push({
              type: "REGISTERED",
              timestamp: new Date(Number(event.log.block.timestamp) * 1000).toISOString(),
              actor: event.args.owner || "",
              odometer: Number(event.args.odometer),
              chain: { network: "Base Sepolia", txHash: event.log.transactionHash },
            });
          }
        });

        transferredEvents?.forEach(event => {
          if (event.log && event.log.block && event.args) {
            combinedHistory.push({
              type: "TRANSFER_COMPLETED",
              timestamp: new Date(Number(event.log.block.timestamp) * 1000).toISOString(),
              actor: event.args.from || "", // Previous owner
              to: event.args.to || "", // New owner
              odometer: Number(event.args.odometer),
              chain: { network: "Base Sepolia", txHash: event.log.transactionHash },
            });
          }
        });

        combinedHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        setVehicle({ ...backendData, history: combinedHistory, currentOwner: contractOwner || backendData.currentOwner });
      } catch (err: any) {
        console.error("Error fetching vehicle data:", err);
        setError(err.message || "Failed to load vehicle data.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
    // Added isLoading states to dependencies to trigger re-fetch when contract data is ready
  }, [serialHash, registeredEvents, transferredEvents, contractOwner, isLoadingContractOwner, isLoadingRegisteredEvents, isLoadingTransferredEvents]);

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceDescription || !connectedAddress) {
      setError("Please provide a description and connect your wallet.");
      return;
    }

    try {
      const response = await fetch(`/api/vehicles/${serialHash}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: maintenanceDescription,
          actor: connectedAddress,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add maintenance record");

      // Refresh vehicle data to show the new maintenance record
      // Trigger re-fetch of vehicle data
      await fetchVehicleData(); // Call the local function to re-fetch and update state

      setMaintenanceDescription("");
    } catch (err: any) {
      console.error("Error adding maintenance:", err);
      setError(err.message || "Failed to add maintenance record.");
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferToAddress || !transferOdometer) {
      setError("Please provide recipient address and odometer for transfer.");
      return;
    }

    try {
      const { receipt } = await transferVehicle({
        args: [serialHash as `0x${string}`, transferToAddress as `0x${string}`, BigInt(transferOdometer)],
      });

      if (!receipt || !receipt.from) {
        throw new Error("Transaction receipt or sender address not found.");
      }

      const previousOwnerAddress = receipt.from;
      const txHash = receipt.transactionHash;

      // Call backend to update off-chain history with new owner and txHash
      const response = await fetch(`/api/vehicles/${serialHash}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newOwnerAddress: transferToAddress,
          previousOwnerAddress,
          odometer: parseInt(transferOdometer),
          txHash,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update backend with transfer data");

      // Trigger a re-fetch of vehicle data after successful transfer
      await fetchVehicleData(); // Call the local function to re-fetch and update state

      setTransferToAddress("");
      setTransferOdometer("");
    } catch (err: any) {
      console.error("Error transferring ownership:", err);
      setError(err.message || "Failed to transfer ownership.");
    }
  };

  if (isPageLoading || !vehicle) return <div className="text-center mt-10">Loading vehicle data...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  

  const isOwner = connectedAddress && contractOwner && connectedAddress === contractOwner;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-morado to-blue-900 text-white p-6">
      <div className="max-w-4xl w-full card-bg p-8 rounded-xl shadow-lg border border-gris-neutro animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8 text-aqua">Vehicle Details: {vehicle.make} {vehicle.model} ({vehicle.year})</h1>

        {/* Vehicle Information */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-aqua mb-4">Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
            <p><strong>Make:</strong> {vehicle.make}</p>
            <p><strong>Model:</strong> {vehicle.model}</p>
            <p><strong>Year:</strong> {vehicle.year}</p>
            <p><strong>VIN (masked):</strong> {vehicle.vinMasked}</p>
            <p><strong>Serial Hash:</strong> {truncateAddress(vehicle.serialHash)}</p>
            <p><strong>Odometer:</strong> {vehicle.odometer} km</p>
            <p><strong>Current Owner:</strong> {truncateAddress(vehicle.currentOwner)}</p>
          </div>
        </div>

        {/* Vehicle History */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-aqua mb-4">History</h2>
          <div className="space-y-4">
            {vehicle.history.length === 0 ? (
              <p className="text-gris-neutro">No history found for this vehicle.</p>
            ) : (
              vehicle.history.map((event, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gris-neutro">
                  <p className="font-semibold text-aqua">Type: {event.type.replace(/_/g, " ")}</p>
                  <p className="text-sm text-gris-neutro">Timestamp: {new Date(event.timestamp).toLocaleString()}</p>
                  <p className="text-sm text-gris-neutro">Actor: {truncateAddress(event.actor)}</p>
                  {event.odometer && <p className="text-sm text-gris-neutro">Odometer: {event.odometer} km</p>}
                  {event.data?.notes && <p className="text-sm text-gris-neutro">Notes: {event.data.notes}</p>}
                  {event.to && <p className="text-sm text-gris-neutro">To: {truncateAddress(event.to)}</p>}
                  {event.chain && (
                    <p className="text-sm text-gris-neutro">
                      On-chain Tx:
                      <a
                        href={`https://sepolia.basescan.org/tx/${event.chain.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aqua hover:underline ml-1"
                      >
                        {truncateAddress(event.chain.txHash)}
                      </a>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {isOwner && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-aqua mb-4">Owner Actions</h2>

            {/* Add Maintenance Record */}
            <div className="card-bg p-6 rounded-lg shadow-md border border-gris-neutro">
              <h3 className="text-xl font-semibold text-aqua mb-3">Add Maintenance Record</h3>
              <form onSubmit={handleAddMaintenance} className="space-y-4">
                <div>
                  <label htmlFor="maintenanceDescription" className="block text-sm font-medium text-gris-neutro mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="maintenanceDescription"
                    className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm p-3 focus:border-aqua focus:ring-aqua"
                    value={maintenanceDescription}
                    onChange={e => setMaintenanceDescription(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-morado text-white font-bold py-3 px-4 rounded-full transition-transform transform hover:bg-opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Add Maintenance
                </button>
              </form>
            </div>

            {/* Transfer Ownership */}
            <div className="card-bg p-6 rounded-lg shadow-md border border-gris-neutro">
              <h3 className="text-xl font-semibold text-aqua mb-3">Transfer Ownership</h3>
              <form onSubmit={handleTransferOwnership} className="space-y-4">
                <div>
                  <label htmlFor="transferToAddress" className="block text-sm font-medium text-gris-neutro mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    id="transferToAddress"
                    className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm p-3 focus:border-aqua focus:ring-aqua"
                    value={transferToAddress}
                    onChange={e => setTransferToAddress(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="transferOdometer" className="block text-sm font-medium text-gris-neutro mb-1">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    id="transferOdometer"
                    className="mt-1 block w-full bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm p-3 focus:border-aqua focus:ring-aqua"
                    value={transferOdometer}
                    onChange={e => setTransferOdometer(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                <button
                  type="submit"
                  className="w-full bg-aqua text-blue-900 font-bold py-3 px-4 rounded-full transition-transform transform hover:bg-opacity-80 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Transfer Ownership
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/my-vehicles" passHref>
            <button className="bg-gray-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:bg-gray-600">
              ← Back to My Vehicles
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPage;
