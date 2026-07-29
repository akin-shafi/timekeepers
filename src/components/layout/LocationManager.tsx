"use client";

import React, { useState } from "react";
import {
  createOfficeLocationAction,
  updateOfficeLocationAction,
  deleteOfficeLocationAction,
  getOfficeLocationsAction,
} from "@/lib/actions/location.actions";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  X,
  Check,
  Shield,
  Wifi,
  Globe,
  Settings,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface OfficeLocationData {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  allowedIPs: string[];
  allowedSSIDs: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationData {
  id: string;
  name: string;
}

interface LocationManagerProps {
  initialLocations: OfficeLocationData[];
  organizations: OrganizationData[];
  adminOrgId: string;
  orgName: string;
}

type ModalMode = "create" | "edit" | null;

export function LocationManager({
  initialLocations,
  organizations,
  adminOrgId,
  orgName,
}: LocationManagerProps) {
  const [locations, setLocations] = useState<OfficeLocationData[]>(initialLocations);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(adminOrgId);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingLoc, setEditingLoc] = useState<OfficeLocationData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [formOrgId, setFormOrgId] = useState("");
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState(100);
  const [formIPs, setFormIPs] = useState("");
  const [formSSIDs, setFormSSIDs] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isDetectingIP, setIsDetectingIP] = useState(false);

  const openCreateModal = () => {
    setFormOrgId(selectedOrgId);
    setFormName("");
    setFormAddress("");
    setFormLat("");
    setFormLng("");
    setFormRadius(100);
    setFormIPs("");
    setFormSSIDs("");
    setFormIsActive(true);
    setEditingLoc(null);
    setError("");
    setSuccess("");
    setModalMode("create");
  };

  const openEditModal = (loc: OfficeLocationData) => {
    setFormOrgId(loc.organizationId);
    setFormName(loc.name);
    setFormAddress(loc.address || "");
    setFormLat(loc.latitude.toString());
    setFormLng(loc.longitude.toString());
    setFormRadius(loc.radiusMeters);
    setFormIPs(loc.allowedIPs.join(", "));
    setFormSSIDs(loc.allowedSSIDs.join(", "));
    setFormIsActive(loc.isActive);
    setEditingLoc(loc);
    setError("");
    setSuccess("");
    setModalMode("edit");
  };

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setError("");
    setSuccess("");
    try {
      const res = await getOfficeLocationsAction(orgId);
      if (res.success && res.locations) {
        setLocations(JSON.parse(JSON.stringify(res.locations)));
      } else {
        setError(res.error || "Failed to load locations for the selected organization.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load locations.");
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingLoc(null);
    setError("");
  };

  const handleAutocompleteSelect = (address: string, lat: number, lng: number) => {
    setFormAddress(address);
    setFormLat(lat.toString());
    setFormLng(lng.toString());
  };

  const handleDetectIP = async () => {
    try {
      setIsDetectingIP(true);
      setError("");
      const response = await fetch("https://api.ipify.org?format=json");
      if (!response.ok) throw new Error("Failed to fetch IP");
      const data = await response.json();
      
      setFormIPs((prev) => {
        if (!prev) return data.ip;
        const ips = prev.split(",").map(i => i.trim());
        if (ips.includes(data.ip)) return prev;
        return `${prev}, ${data.ip}`;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to auto-detect IP address. Please enter it manually.");
    } finally {
      setIsDetectingIP(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const ips = formIPs
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    const ssids = formSSIDs
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const latFloat = parseFloat(formLat);
    const lngFloat = parseFloat(formLng);

    if (isNaN(latFloat) || isNaN(lngFloat)) {
      setError("Latitude and Longitude must be valid numbers.");
      setSubmitting(false);
      return;
    }

    try {
      if (modalMode === "create") {
        const res = await createOfficeLocationAction({
          organizationId: formOrgId,
          name: formName,
          address: formAddress,
          latitude: latFloat,
          longitude: lngFloat,
          radiusMeters: formRadius,
          allowedIPs: ips,
          allowedSSIDs: ssids,
        });

        if (res.success && res.location) {
          // Re-serialize location
          const newLoc = JSON.parse(JSON.stringify(res.location)) as OfficeLocationData;
          // Only add to current list if it matches the selected organization view
          if (newLoc.organizationId === selectedOrgId) {
            setLocations([newLoc, ...locations]);
          }
          setSuccess(`Office location "${formName}" created successfully!`);
          closeModal();
        } else {
          setError(res.error || "Failed to create location.");
        }
      } else if (modalMode === "edit" && editingLoc) {
        const res = await updateOfficeLocationAction(editingLoc.id, {
          organizationId: formOrgId,
          name: formName,
          address: formAddress,
          latitude: latFloat,
          longitude: lngFloat,
          radiusMeters: formRadius,
          allowedIPs: ips,
          allowedSSIDs: ssids,
          isActive: formIsActive,
        });

        if (res.success && res.location) {
          const updatedLoc = JSON.parse(JSON.stringify(res.location)) as OfficeLocationData;
          if (updatedLoc.organizationId === selectedOrgId) {
            setLocations(locations.map((l) => (l.id === updatedLoc.id ? updatedLoc : l)));
          } else {
            // If moved to another organization, filter it out of the active view
            setLocations(locations.filter((l) => l.id !== updatedLoc.id));
          }
          setSuccess(`Office location "${formName}" updated successfully!`);
          closeModal();
        } else {
          setError(res.error || "Failed to update location.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (loc: OfficeLocationData) => {
    setError("");
    setSuccess("");

    try {
      const nextActive = !loc.isActive;
      const res = await updateOfficeLocationAction(loc.id, {
        isActive: nextActive,
      });

      if (res.success && res.location) {
        const updatedLoc = JSON.parse(JSON.stringify(res.location)) as OfficeLocationData;
        setLocations(locations.map((l) => (l.id === updatedLoc.id ? updatedLoc : l)));
        setSuccess(`Location "${loc.name}" is now ${nextActive ? "active" : "inactive"}.`);
      } else {
        setError(res.error || "Failed to update location status.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  const handleDelete = async (loc: OfficeLocationData) => {
    if (
      !confirm(
        `Are you sure you want to delete office location "${loc.name}"?\n\nStaff will no longer be able to select this office when checking in.`
      )
    )
      return;

    setError("");
    setSuccess("");

    try {
      const res = await deleteOfficeLocationAction(loc.id);
      if (res.success) {
        setLocations(locations.filter((l) => l.id !== loc.id));
        setSuccess(`Location "${loc.name}" deleted.`);
      } else {
        setError(res.error || "Failed to delete location.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Org selector */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 sm:p-5">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            Active Geofence Configuration
          </h2>
          {organizations.length > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">Select Organization:</span>
              <select
                value={selectedOrgId}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">Organization:</span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 font-sans">
                {orgName}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-purple-600/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Geofence Office
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className={`bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-all overflow-hidden ${
              loc.isActive
                ? "border-gray-200 dark:border-slate-800"
                : "border-gray-200/50 dark:border-slate-800/40 opacity-70"
            }`}
          >
            {/* Card Top */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-800/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                      loc.isActive
                        ? "bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-purple-500/20"
                        : "bg-gray-400 dark:bg-slate-700 shadow-none"
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                      {loc.name}
                    </h3>
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        loc.isActive
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {loc.isActive ? "Active Geofence" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Edit / Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(loc)}
                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                    title="Edit Office Details"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(loc)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Office"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  <strong className="text-gray-700 dark:text-slate-300 block mb-0.5 font-semibold">
                    Address:
                  </strong>
                  {loc.address || "No physical address provided"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  <span>
                    Lat: <code className="font-mono text-gray-700 dark:text-slate-300">{loc.latitude.toFixed(6)}</code>
                  </span>
                  <span>
                    Lng: <code className="font-mono text-gray-700 dark:text-slate-300">{loc.longitude.toFixed(6)}</code>
                  </span>
                </div>
              </div>

              {/* Location details */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-gray-400" />
                    Geofence Radius
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {loc.radiusMeters} meters
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                    IP Whitelist
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]" title={loc.allowedIPs.join(", ")}>
                    {loc.allowedIPs.length > 0 ? `${loc.allowedIPs.length} rules` : "None"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-gray-400" />
                    Wi-Fi SSIDs
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]" title={loc.allowedSSIDs.join(", ")}>
                    {loc.allowedSSIDs.length > 0 ? `${loc.allowedSSIDs.length} networks` : "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Toggle Switch Bar */}
            <div className="bg-gray-50 dark:bg-slate-900/60 px-5 py-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {loc.isActive ? "Geofence Enforcement Active" : "Geofence Disabled"}
              </span>
              <button
                onClick={() => handleToggleActive(loc)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  loc.isActive ? "bg-purple-600" : "bg-gray-200 dark:bg-slate-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    loc.isActive ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-800 rounded-2xl text-center py-16 text-gray-400 dark:text-slate-500">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40 text-purple-500" />
            <p className="text-sm font-semibold">No Geofences Configured</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Add your first physical office coordinates to start tracking geofenced check-ins.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Add Office Location
            </button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalMode === "create" ? "Add Geofence Office" : `Edit: ${editingLoc?.name}`}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {/* Organization Selector */}
              {organizations.length > 1 ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Assign to Organization <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formOrgId}
                    onChange={(e) => setFormOrgId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="" disabled>Select an organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                    The geofence will apply to check-ins made by staff of this organization.
                  </p>
                </div>
              ) : null}

              {/* Office Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Office Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Lagos Office HQ"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Street Address - Autocomplete */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Search & Autocomplete Address
                </label>
                <AddressAutocomplete
                  value={formAddress}
                  onChange={setFormAddress}
                  onSelect={handleAutocompleteSelect}
                  placeholder="Type address to lookup coordinates..."
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  Typing here fetches coordinates automatically using Google Maps API.
                </p>
              </div>

              {/* Latitude / Longitude */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    placeholder="e.g. 6.4281"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    placeholder="e.g. 3.4219"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Radius */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                  Allowed GPS Radius (Meters)
                </label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={formRadius}
                  onChange={(e) => setFormRadius(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Recommended is 100-200m depending on office size.</p>
              </div>

              {/* Whitelists */}
              <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-purple-500" /> Whitelist Rules (Optional)
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Allowed IP Addresses
                  </label>
                  <input
                    type="text"
                    value={formIPs}
                    onChange={(e) => setFormIPs(e.target.value)}
                    placeholder="e.g. 197.210.64.12, 102.89.3.0"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 mb-2">Comma-separated IP addresses or range prefixes.</p>
                  
                  <button
                    type="button"
                    onClick={handleDetectIP}
                    disabled={isDetectingIP}
                    className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDetectingIP ? "animate-spin" : ""}`} />
                    {isDetectingIP ? "Detecting..." : "Auto-Detect Current Network IP"}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
                    Allowed Wi-Fi SSIDs
                  </label>
                  <input
                    type="text"
                    value={formSSIDs}
                    onChange={(e) => setFormSSIDs(e.target.value)}
                    placeholder="e.g. AcmeHQ_Staff, AcmeHQ_Corporate"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Comma-separated exact SSIDs for local verification.</p>
                </div>
              </div>

              {/* Is Active (Edit only) */}
              {modalMode === "edit" && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="formIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-gray-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="formIsActive" className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Geofence Enforcement Active
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-purple-600/25 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    "Saving..."
                  ) : modalMode === "create" ? (
                    <>
                      <Plus className="h-4 w-4" /> Add Geofence
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Save Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
