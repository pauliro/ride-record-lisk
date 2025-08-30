"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

// Helper to truncate addresses for display
const truncateAddress = (address: string) => {
  if (!address) return "";
  const start = address.substring(0, 6);
  const end = address.substring(address.length - 4);
  return `${start}...${end}`;
};

type Vehicle = {
  id: string;
  serialHash: string;
  vinMasked: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  currentOwner: string;
  txHash: string;
  history: Array<{
    type: string;
    description?: string;
    actor?: string;
    newOwnerAddress?: string;
    previousOwnerAddress?: string;
    odometer?: number;
    txHash: string;
    timestamp: number;
  }>;
};

const MyVehiclesPage = () => {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  useEffect(() => {
    if (!connectedAddress) {
      // Redirect or show a message if not connected
      setIsLoading(false);
      setError("Please connect your wallet to view your vehicles.");
      return;
    }

    const fetchMyVehicles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/vehicles?owner=${connectedAddress}`);
        if (!response.ok) {
          throw new Error(`Error fetching vehicles: ${response.statusText}`);
        }
        const data: Vehicle[] = await response.json();
        setVehicles(data);
      } catch (err: any) {
        console.error("Failed to fetch vehicles:", err);
        setError(err.message || "Failed to fetch vehicles.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyVehicles();
  }, [connectedAddress]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-morado to-blue-900 text-white p-6 flex-1">
        <span className="loading loading-spinner loading-lg mb-4"></span>
        <p className="text-lg">Loading your vehicles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-morado to-blue-900 text-white p-6 flex-1">
        <p className="text-xl text-red-400 mb-4">{error}</p>
        {!connectedAddress && <p className="text-lg">Connect your wallet to get started.</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-morado to-blue-900 text-white p-6 flex-1">
      <div className="max-w-4xl w-full card-bg p-8 rounded-xl shadow-lg border border-gris-neutro animate-fade-in my-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-aqua">My Registered Vehicles</h2>
        <div className="mb-8 text-center">
          <Link href="/" passHref>
            <button className="bg-gray-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:bg-gray-600">
              ← Back to Home
            </button>
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-center text-lg text-gris-neutro">You have no registered vehicles yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setShowModal(true);
                }}
              >
                <p className="text-lg font-semibold text-aqua">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="text-sm text-gris-neutro">VIN: {vehicle.vinMasked}</p>
                <p className="text-sm text-gris-neutro">Year: {vehicle.year}</p>
                <p className="text-sm text-gris-neutro">Odometer: {vehicle.odometer} km</p>
                <p className="text-sm text-gris-neutro">Owner: {truncateAddress(vehicle.currentOwner)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Vehicle Detail Modal */}
        {showModal && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-50 p-4">
            <div className="bg-gray-900 card-bg p-8 rounded-xl shadow-lg border border-gris-neutro max-w-4xl w-full relative my-auto">
              <button
                className="absolute top-4 right-4 text-white hover:text-aqua text-2xl"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold text-aqua mb-4">Vehicle Details</h3>
              <p className="text-lg">
                <strong>Make:</strong> {selectedVehicle.make}
              </p>
              <p className="text-lg">
                <strong>Model:</strong> {selectedVehicle.model}
              </p>
              <p className="text-lg">
                <strong>Year:</strong> {selectedVehicle.year}
              </p>
              <p className="text-lg">
                <strong>VIN Masked:</strong> {selectedVehicle.vinMasked}
              </p>
              <p className="text-lg">
                <strong>Serial Hash:</strong> {truncateAddress(selectedVehicle.serialHash)}
              </p>
              <p className="text-lg">
                <strong>Odometer:</strong> {selectedVehicle.odometer} km
              </p>
              <p className="text-lg">
                <strong>Current Owner:</strong> {truncateAddress(selectedVehicle.currentOwner)}
              </p>
              <p className="text-lg">
                <strong>Registered Transaction:</strong> {truncateAddress(selectedVehicle.txHash)}
              </p>

              <h4 className="text-xl font-bold text-aqua mt-6 mb-3">History</h4>
              {selectedVehicle.history.length === 0 ? (
                <p>No history recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedVehicle.history.map((event, index) => (
                    <li key={index} className="bg-gray-800 p-3 rounded-md">
                      <p className="font-semibold text-aqua">
                        <strong>Type:</strong> {event.type}
                      </p>
                      {event.description && (
                        <p>
                          <strong>Description:</strong> {event.description}
                        </p>
                      )}
                      {event.actor && (
                        <p>
                          <strong>Actor:</strong> {truncateAddress(event.actor)}
                        </p>
                      )}
                      {event.newOwnerAddress && (
                        <p>
                          <strong>New Owner:</strong> {truncateAddress(event.newOwnerAddress)}
                        </p>
                      )}
                      {event.previousOwnerAddress && (
                        <p>
                          <strong>Previous Owner:</strong> {truncateAddress(event.previousOwnerAddress)}
                        </p>
                      )}
                      {event.odometer !== undefined && (
                        <p>
                          <strong>Odometer:</strong> {event.odometer} km
                        </p>
                      )}
                      <p className="font-semibold text-aqua">
                        <strong>Tx Hash:</strong> {truncateAddress(event.txHash)}
                      </p>
                      <p className="font-semibold text-aqua">
                        <strong>Timestamp:</strong> {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <button
                className="mt-8 bg-aqua text-blue-900 font-bold py-3 px-8 rounded-full transition-transform transform hover:bg-opacity-80 w-full"
                onClick={() => router.push(`/vehicle/${selectedVehicle.serialHash}`)}
              >
                View Full Details Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVehiclesPage;
