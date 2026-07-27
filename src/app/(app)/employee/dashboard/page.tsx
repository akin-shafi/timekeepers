"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Calendar,

  Navigation,
  ShieldCheck,
  Building,
  Sparkles,
} from "lucide-react";
import { checkInAction, checkOutAction, getTodayAttendanceStatusAction, getActiveOfficeLocationsAction, checkIfWorkingDayAction, getDashboardStatsAction } from "@/lib/actions/attendance.actions";

export default function EmployeeDashboard() {
  const [workLocation, setWorkLocation] = useState<"OFFICE" | "REMOTE">("OFFICE");
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [offices, setOffices] = useState<any[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(false);
  const [isWorkingDay, setIsWorkingDay] = useState<boolean>(true);
  const [nonWorkingReason, setNonWorkingReason] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [expectedLocation, setExpectedLocation] = useState<string>("");
  const [gpsError, setGpsError] = useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutMilestone, setCheckoutMilestone] = useState<string>("");

  const [requiredDays, setRequiredDays] = useState<number>(8);
  const [requiredPerWeek, setRequiredPerWeek] = useState<number>(2);
  const [officeDays, setOfficeDays] = useState<string[]>([]);

  const checkWorkingDay = async () => {
    try {
      const res = await checkIfWorkingDayAction();
      if (res && res.isWorkingDay === false) {
        setIsWorkingDay(false);
        setNonWorkingReason(res.reason || "non-working day");
      }
    } catch (e) {
      console.error("Failed to check working day status", e);
    }
  };

  const getAddress = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
        );
        const data = await response.json();
        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];
          setAddress(result.formatted_address);
          setLoadingAddress(false);
          return;
        }
      }

      // Fallback to Nominatim OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "TimeKeeperAttendanceApp/1.0"
          }
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const street = data.address.road || data.address.suburb || "";
        const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
        const state = data.address.state || "";
        const parts = [street, city, state].filter(Boolean);
        setAddress(parts.join(", ") || data.display_name);
      }
    } catch (e) {
      console.error("Error reverse geocoding coordinates:", e);
      setAddress("Unable to resolve address");
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchTodayStatus = async () => {
    setIsLoading(true);
    try {
      const res = await getTodayAttendanceStatusAction();
      if (res.success) {
        setTodayRecord(res.record);
      }
    } catch (e) {
      console.error("Failed to fetch today status", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOffices = async () => {
    try {
      const res = await getActiveOfficeLocationsAction();
      if (res.success && res.locations) {
        setOffices(res.locations);
        if (res.locations.length > 0) {
          setSelectedOfficeId(res.locations[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch offices", e);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await getDashboardStatsAction();
      if (res.success) {
        setRequiredDays(res.requiredDays || 8);
        setRequiredPerWeek(res.requiredPerWeek || 2);
        setOfficeDays(res.officeDays || []);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    }
  };

  useEffect(() => {
    checkWorkingDay();
    fetchTodayStatus();
    fetchOffices();
    fetchDashboardStats();
    // Fetch browser location for geofencing
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          getAddress(lat, lng);
          setGpsError("");
        },
        (err) => {
          console.log("Geolocation disabled or unavailable", err.message);
          setGpsError("Location access denied or unavailable.");
        }
      );
    } else {
      setGpsError("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleCheckIn = async (reason?: string) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await checkInAction({
        workLocation,
        latitude: coords.lat,
        longitude: coords.lng,
        officeLocationId: workLocation === "OFFICE" ? selectedOfficeId : undefined,
        overrideReason: reason,
      });

      if (res.success) {
        setShowOverrideModal(false);
        setOverrideReason("");
        await fetchTodayStatus();
      } else if (res.requiresOverride) {
        setExpectedLocation(res.expectedLocation);
        setShowOverrideModal(true);
      } else {
        setErrorMsg(res.error || "Check-in failed.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await checkOutAction({
        latitude: coords.lat,
        longitude: coords.lng,
        dailyMilestone: checkoutMilestone,
      });
      if (res.success) {
        setShowCheckoutModal(false);
        await fetchTodayStatus();
      } else {
        setErrorMsg(res.error || "Check-out failed.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Employee Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Daily Attendance Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-500 dark:text-cyan-400" /> {todayDateString}
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 text-right">
          <p className="text-xs text-gray-500 dark:text-slate-400">Required Office Days This Month</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            <span className="text-cyan-500 dark:text-cyan-400">{requiredDays} Days</span>{" "}
            <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">
              ({officeDays.length > 0 ? officeDays.map(d => d.substring(0,3)).join(", ") : `${requiredPerWeek} per week`})
            </span>
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-600 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Check-In Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-500 dark:text-brand-400" /> Today&apos;s Check-In Status
            </h2>
            {todayRecord ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {todayRecord.checkOutTime ? "Attendance Completed" : "Currently Active"}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Not Checked In
              </span>
            )}
          </div>

          {!todayRecord ? (
            /* State 1: Not Checked In */
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">
                  Select Your Work Location For Today:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setWorkLocation("OFFICE")}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border text-sm font-semibold transition-all ${
                      workLocation === "OFFICE"
                        ? "bg-brand-600/20 border-brand-500 text-gray-900 dark:text-white shadow-lg shadow-brand-500/20"
                        : "bg-gray-50 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Building className={`h-5 w-5 ${workLocation === "OFFICE" ? "text-brand-500 dark:text-brand-400" : "text-gray-400 dark:text-slate-500"}`} />
                    Office Work
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkLocation("REMOTE")}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border text-sm font-semibold transition-all ${
                      workLocation === "REMOTE"
                        ? "bg-cyan-600/20 border-cyan-500 text-gray-900 dark:text-white shadow-lg shadow-cyan-500/20"
                        : "bg-gray-50 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <Laptop className={`h-5 w-5 ${workLocation === "REMOTE" ? "text-cyan-500 dark:text-cyan-400" : "text-gray-400 dark:text-slate-500"}`} />
                    Remote Work
                  </button>
                </div>
              </div>

              {workLocation === "OFFICE" && (
                <div className="space-y-3 bg-gray-100 dark:bg-slate-900/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                      Select Office Location:
                    </label>
                    {offices.length > 0 ? (
                      <select
                        value={selectedOfficeId}
                        onChange={(e) => setSelectedOfficeId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {offices.map((office) => (
                          <option key={office.id} value={office.id}>
                            {office.name} ({office.address || `${office.latitude.toFixed(4)}, ${office.longitude.toFixed(4)}`})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-red-500 font-semibold">
                        ⚠️ No active office locations found. Contact Super Admin.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Display Address / Geolocation Status Card */}
              <div className="space-y-3 bg-gray-100 dark:bg-slate-900/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between text-gray-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-emerald-500 dark:text-emerald-450 animate-pulse" />
                    <span className="font-semibold text-gray-700 dark:text-slate-300">Your Detected Location:</span>
                  </div>
                  {coords.lat !== undefined && coords.lng !== undefined ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      GPS ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                    </span>
                  ) : gpsError ? (
                    <span className="text-red-500 dark:text-red-400 font-medium">
                      {gpsError}
                    </span>
                  ) : (
                    <span className="text-amber-500 dark:text-amber-400 font-medium animate-pulse">
                      Awaiting GPS Access...
                    </span>
                  )}
                </div>

                {coords.lat !== undefined && coords.lng !== undefined && (
                  <div className="pt-2 border-t border-gray-200/50 dark:border-slate-800 text-gray-600 dark:text-slate-300 font-sans">
                    {loadingAddress ? (
                      <span className="text-gray-400 dark:text-slate-500 animate-pulse">Resolving current address...</span>
                    ) : (
                      <p className="font-medium bg-white/50 dark:bg-black/10 px-3 py-2 rounded-lg border border-gray-200/20 dark:border-slate-800/40 select-all">
                        {address || "Address details not resolved"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!isWorkingDay) {
                    setShowConfirmModal(true);
                  } else {
                    handleCheckIn();
                  }
                }}
                disabled={isSubmitting || isLoading || coords.lat === undefined}
                className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 active:scale-[0.99] transition-all shadow-xl shadow-brand-500/25 disabled:opacity-50 pulse-glow"
              >
                {coords.lat === undefined ? (gpsError ? "Location Access Required" : "Waiting for Location...") : isSubmitting ? "Recording Check-In..." : `Check In as ${workLocation === "OFFICE" ? "Office" : "Remote"}`}
              </button>
            </div>
          ) : !todayRecord.checkOutTime ? (
            /* State 2: Checked In (Working) */
            <div className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-300 font-semibold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Checked In Successfully
                  </span>
                  <span>{new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-200 flex items-center justify-between">
                  <span>Work Location: <strong className="text-gray-900 dark:text-white uppercase">{todayRecord.workLocation}</strong></span>
                  <span>Verification: <strong className="text-emerald-500 dark:text-emerald-400">{todayRecord.verificationStatus}</strong></span>
                </div>
                {todayRecord.verificationNotes && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 italic pt-1 border-t border-emerald-500/20">
                    &quot;{todayRecord.verificationNotes}&quot;
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowCheckoutModal(true)}
                disabled={isSubmitting || coords.lat === undefined}
                className="w-full py-4 rounded-2xl font-bold text-base text-white bg-red-600 hover:bg-red-500 active:scale-[0.99] transition-all shadow-xl shadow-red-600/30 disabled:opacity-50"
              >
                {coords.lat === undefined ? (gpsError ? "Location Access Required" : "Waiting for Location...") : isSubmitting ? "Recording Check-Out..." : "Check Out For Today"}
              </button>
            </div>
          ) : (
            /* State 3: Attendance Completed */
            <div className="bg-gray-100 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-emerald-500 dark:text-emerald-400 font-bold text-lg">
                <CheckCircle2 className="h-6 w-6" /> Workday Completed!
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-slate-800 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Check-In</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Check-Out</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {new Date(todayRecord.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Total Hours</p>
                  <p className="text-sm font-bold text-cyan-500 dark:text-cyan-400 mt-0.5">{todayRecord.hoursWorked} hrs</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Metric Card: Transport Stipend & Hybrid Progress */}
        <div className="space-y-6">


          <div className="glass-card p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-500 dark:text-cyan-400" /> Organization Security Policy
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Office attendance requires location geofencing or office Wi-Fi connection. Remote check-ins register immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Non-Working Day Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500 dark:text-amber-400">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Non-Working Day Detected
              </h3>
            </div>
            
            <p className="text-xs text-gray-650 dark:text-slate-300 leading-relaxed font-sans">
              Today is marked as a <span className="font-bold text-amber-600 dark:text-amber-400">{nonWorkingReason === "weekend" ? "Weekend" : nonWorkingReason}</span>. 
              Are you sure you want to proceed with checking in on a non-working day?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-105 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-750 transition-all border border-transparent dark:border-slate-700/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleCheckIn();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.99] transition-all shadow-md shadow-amber-500/20"
              >
                Yes, Check In
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Location Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500 dark:text-amber-400">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Location Override
              </h3>
            </div>
            
            <p className="text-xs text-gray-650 dark:text-slate-300 leading-relaxed font-sans">
              You are scheduled to work <strong className="text-amber-600 dark:text-amber-400">{expectedLocation === "OFFICE" ? "from the office" : "remotely"}</strong> today, 
              but you are trying to check in {workLocation === "OFFICE" ? "at the office" : "remotely"}. 
              Please provide a reason for this change.
            </p>

            <div>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for location change..."
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideReason("");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-105 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-750 transition-all border border-transparent dark:border-slate-700/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCheckIn(overrideReason)}
                disabled={!overrideReason.trim() || isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 active:scale-[0.99] transition-all shadow-md shadow-amber-500/20"
              >
                {isSubmitting ? "Submitting..." : "Confirm Check-in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout with Milestone Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500 dark:text-red-400">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Check Out For Today
              </h3>
            </div>
            
            <p className="text-xs text-gray-650 dark:text-slate-300 leading-relaxed font-sans">
              Great work today! Briefly describe what you accomplished. This will be saved in your <strong>Daily Milestones</strong>.
            </p>

            <div>
              <textarea
                value={checkoutMilestone}
                onChange={(e) => setCheckoutMilestone(e.target.value)}
                placeholder="I completed the frontend implementation of..."
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  setCheckoutMilestone("");
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-105 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-750 transition-all border border-transparent dark:border-slate-700/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={!checkoutMilestone.trim() || isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 active:scale-[0.99] transition-all shadow-md shadow-red-500/20"
              >
                {isSubmitting ? "Submitting..." : "Check Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
