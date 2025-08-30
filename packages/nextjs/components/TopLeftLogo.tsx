"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import rideRecordsLogo from "./assets/ride-records-logo.png";

export const TopLeftLogo = () => {
  return (
    <Link href="/" passHref>
      <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
        <Image src={rideRecordsLogo} alt="RideRecords Logo" width={32} height={32} className="text-primary h-auto" />
        <span className="text-primary-content text-lg font-bold">RideRecords</span>
      </div>
    </Link>
  );
};
