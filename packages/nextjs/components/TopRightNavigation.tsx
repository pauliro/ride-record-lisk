"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const translations = {
  en: {
    navLogoText: "Vehicle Registry",
    navButtonConnect: "Connect Wallet",
    myVehicles: "My Vehicles",
    registerVehicle: "Register Vehicle",
  },
  es: {
    navLogoText: "Registro Vehicular",
    navButtonConnect: "Conectar Billetera",
    myVehicles: "Mis Vehículos",
    registerVehicle: "Registrar Vehículo",
  },
};

export const TopRightNavigation = () => {
  const [lang, setLang] = useState("en");

  const setLanguage = useCallback((newLang: string) => {
    setLang(newLang);
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    // Initialize language from localStorage or default to 'en'
    const storedLang = localStorage.getItem("appLang");
    if (storedLang) {
      setLang(storedLang);
      document.documentElement.lang = storedLang;
    } else {
      localStorage.setItem("appLang", "en");
      document.documentElement.lang = "en";
    }
  }, []);

  const currentContent = translations[lang as keyof typeof translations];

  return (
    <div className="flex items-center space-x-4">
      <select
        id="language-switcher"
        className="bg-gray-800 text-white rounded-md py-2 px-3 focus:outline-none"
        onChange={e => {
          setLanguage(e.target.value);
          localStorage.setItem("appLang", e.target.value);
        }}
        value={lang}
      >
        <option value="en">EN</option>
        <option value="es">ES</option>
      </select>
      <Link href="/my-vehicles" passHref>
        <button className="bg-morado text-white font-bold py-2 px-4 rounded-full transition-transform transform hover:bg-opacity-80 text-sm">
          {currentContent.myVehicles}
        </button>
      </Link>
      <Link href="/register" passHref>
        <button className="bg-aqua text-blue-900 font-bold py-2 px-4 rounded-full transition-transform transform hover:bg-opacity-80 text-sm">
          {currentContent.registerVehicle}
        </button>
      </Link>
      <RainbowKitCustomConnectButton />
    </div>
  );
};
