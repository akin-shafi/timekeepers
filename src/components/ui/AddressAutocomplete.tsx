"use client";

import React, { useRef, useEffect, useState } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMapsAutocomplete?: () => void;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing street address...",
  className = "",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setApiKeyMissing(true);
      return;
    }

    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already added to prevent duplicates
    const scriptId = "google-maps-autocomplete-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleScriptLoad = () => {
      setIsLoaded(true);
    };

    script.addEventListener("load", handleScriptLoad);

    return () => {
      script.removeEventListener("load", handleScriptLoad);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      // Create autocomplete object
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ["formatted_address", "geometry"],
          // Restrict to cities/regions or keep generic
        }
      );
      autocompleteRef.current = autocomplete;

      // Event listener for suggestion selection
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || inputRef.current?.value || "";
          onSelect(address, lat, lng);
        }
      });
    } catch (err) {
      console.error("Error initializing Google Autocomplete:", err);
    }

    return () => {
      if (window.google?.maps?.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onSelect]);

  if (apiKeyMissing) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
        <p className="text-[10px] text-amber-500 font-medium">
          ⚠️ Google Maps API Key is missing. Manual typing is enabled.
        </p>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
