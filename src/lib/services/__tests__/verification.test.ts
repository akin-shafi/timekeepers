import { calculateDistanceMeters, verifyOfficeAttendance } from "../verification";
import { VerificationMethod, VerificationStatus } from "@prisma/client";

describe("Geofencing and Verification Service", () => {
  it("should accurately calculate distance between two coordinates", () => {
    // Victoria Island HQ (6.4281, 3.4219) vs point ~50m away (6.4285, 3.4219)
    const distance = calculateDistanceMeters(6.4281, 3.4219, 6.4285, 3.4219);
    expect(distance).toBeGreaterThan(40);
    expect(distance).toBeLessThan(60);
  });

  it("should return VERIFIED when user is within geofence radius", () => {
    const result = verifyOfficeAttendance({
      method: VerificationMethod.GPS_GEOFENCE,
      userLat: 6.4281,
      userLng: 3.4219,
      officeLat: 6.4281,
      officeLng: 3.4219,
      radiusMeters: 100,
    });

    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(result.notes).toContain("GPS Geofence verified");
  });

  it("should return PENDING_REVIEW when user is outside geofence radius", () => {
    const result = verifyOfficeAttendance({
      method: VerificationMethod.GPS_GEOFENCE,
      userLat: 6.5000, // 8+ km away
      userLng: 3.3500,
      officeLat: 6.4281,
      officeLng: 3.4219,
      radiusMeters: 100,
    });

    expect(result.status).toBe(VerificationStatus.PENDING_REVIEW);
    expect(result.notes).toContain("GPS Geofence flag");
  });

  it("should auto-verify for SELF_DECLARATION policy", () => {
    const result = verifyOfficeAttendance({
      method: VerificationMethod.SELF_DECLARATION,
    });

    expect(result.status).toBe(VerificationStatus.VERIFIED);
  });
});
