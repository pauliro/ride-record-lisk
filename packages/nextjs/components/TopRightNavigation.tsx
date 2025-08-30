"use client";

import React from "react";
import Link from "next/link";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export const TopRightNavigation = () => {
  return (
    <div className="flex items-center space-x-4">
      <Link href="/my-vehicles" passHref>
        <button className="bg-morado text-white font-bold py-2 px-4 rounded-full transition-transform transform hover:bg-opacity-80 text-sm">
          My Vehicles
        </button>
      </Link>
      <Link href="/register" passHref>
        <button className="bg-aqua text-blue-900 font-bold py-2 px-4 rounded-full transition-transform transform hover:bg-opacity-80 text-sm">
          Register Vehicle
        </button>
      </Link>
      <RainbowKitCustomConnectButton />
    </div>
  );
};
