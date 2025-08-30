"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
// Removed RainbowKitCustomConnectButton import, as it's now in TopRightNavigation
import carImage from "~~/components/assets/upscalemedia-transformed-con-back-Photoroom.png";

// Removed translations object, as it's now in TopRightNavigation

const Home = () => {
  // Removed lang and setLang state and setLanguage function, as they are now in TopRightNavigation
  const animatedRefs = useRef<(HTMLElement | null)[]>([]);
  const fadeInRefs = useRef<(HTMLElement | null)[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const animatedRefsArray = animatedRefs.current;
    const fadeInRefsArray = fadeInRefs.current;
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedRefsArray.forEach(el => el && observer.observe(el));
    fadeInRefsArray.forEach(el => el && observer.observe(el));

    return () => {
      animatedRefsArray.forEach(el => el && observer.unobserve(el));
      fadeInRefsArray.forEach(el => el && observer.unobserve(el));
    };
  }, []);

  const addToRef = useCallback((el: HTMLElement | null, refArray: React.MutableRefObject<(HTMLElement | null)[]>) => {
    if (el && !refArray.current.includes(el)) {
      refArray.current.push(el);
    }
  }, []);

  const addAnimatedRef = useCallback((el: HTMLElement | null) => addToRef(el, animatedRefs), [addToRef]);
  const addFadeInRef = useCallback((el: HTMLElement | null) => addToRef(el, fadeInRefs), [addToRef]);

  return (
    <div className="text-white">
      {/* Hero Section */}
      <header className="h-screen flex flex-col lg:flex-row justify-center items-center p-4 lg:p-12 text-center lg:text-left gradient-bg">
        {/* Removed the entire nav bar from here as it's now handled globally by TopRightNavigation */}
        <div className="flex flex-col lg:flex-row justify-center items-center lg:space-x-16 space-y-12 lg:space-y-0 w-full mt-24 lg:mt-0">
          <div className="lg:w-1/2 space-y-6 animated" ref={addAnimatedRef}>
            <h1
              className="text-4xl lg:text-6xl font-extrabold leading-tight"
              dangerouslySetInnerHTML={{
                __html: "Verify the history of <br><span class='text-aqua'>every vehicle</span>. No middlemen.",
              }}
            />
            <p className="text-lg text-gris-neutro max-w-2xl">
              An immutable blockchain registry that gives you the truth about cars, motorcycles, and more, just a click
              away.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
              {/* The global wallet connect button is now handled by TopRightNavigation */}
              <Link href="/register" passHref>
                <button className="bg-aqua text-blue-900 font-bold py-3 px-8 rounded-full transition-transform transform hover:bg-opacity-80">
                  Register Vehicle
                </button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center car-svg-container fade-in" ref={addFadeInRef}>
            <Image src={carImage} alt="Car Illustration" className="w-full h-auto" />
          </div>
        </div>
      </header>

      {/* Problem & Solution Section */}
      <section className="py-20 px-4 md:px-12 bg-white text-blue-900 animated" ref={addAnimatedRef}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">Tired of uncertainty?</h2>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-morado flex-shrink-0 mt-1 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>Odometer fraud and hidden accident histories are common.</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-morado flex-shrink-0 mt-1 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z" />
                </svg>
                <span>Lack of transparency in the vehicle&apos;s ownership chain.</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-morado flex-shrink-0 mt-1 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>Paper documents that can be easily altered or lost.</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">The truth, a click away.</h2>
            <ul className="space-y-4 text-lg">
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-aqua flex-shrink-0 mt-1 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z" />
                </svg>
                <span>Verified and public maintenance and transfer history.</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-aqua flex-shrink-0 mt-1 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z" />
                </svg>
                <span>Secure and transparent title transfers.</span>
              </li>
              <li className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-aqua flex-shrink-0 mt-1 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z" />
                </svg>
                <span>Immutable documents and records, stored securely.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-12 bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 animated" ref={addAnimatedRef}>
            It&apos;s that simple.
          </h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card-bg p-8 rounded-xl shadow-lg border border-gris-neutro animated" ref={addAnimatedRef}>
              <div className="flex justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-morado"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.92 6.01C18.72 5.92 17.52 5 16 5s-2.72.92-2.92 1.01l-2.43 2.5a.996.996 0 00-.65.23L4 12.01l.01 1.99 4.99 1 1 1.99 1.99-.01 2.5 2.43c.09.2.23.65.23 1.13.06 1.77 1.83 3.1 3.5 3.1 1.67 0 3.44-1.33 3.5-3.1.06-.48.2-.93.23-1.13l2.5-2.43 2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Step 1: Register</h3>
              <p className="text-gris-neutro">
                Register your vehicle and its key information, creating an immutable history.
              </p>
            </div>
            {/* Step 2 */}
            <div className="card-bg p-8 rounded-xl shadow-lg border border-gris-neutro animated" ref={addAnimatedRef}>
              <div className="flex justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-aqua"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M13.5 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h8.5c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h8.5v8zM17 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-6 2c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Step 2: Transfer</h3>
              <p className="text-gris-neutro">Securely change ownership with a unique, traceable code.</p>
            </div>
            {/* Step 3 */}
            <div className="card-bg p-8 rounded-xl shadow-lg border border-gris-neutro animated" ref={addAnimatedRef}>
              <div className="flex justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-morado"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Step 3: Query</h3>
              <p className="text-gris-neutro">
                Search by VIN, license plate, or ID and access the complete vehicle history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 md:px-12 text-center bg-aqua">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-blue-900">Ready for total transparency?</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register" passHref>
              <button className="bg-blue-900 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:bg-opacity-80">
                Register Your Vehicle
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
