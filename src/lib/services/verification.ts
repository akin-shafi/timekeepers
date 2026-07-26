import { VerificationMethod, VerificationStatus } from "@prisma/client";

/**
 * Calculates distance in meters between two lat/long points using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface VerificationParams {
  method: VerificationMethod;
  userLat?: number;
  userLng?: number;
  userIp?: string;
  officeLat?: number;
  officeLng?: number;
  radiusMeters?: number;
  allowedIPs?: string[];
}

export interface VerificationResult {
  status: VerificationStatus;
  notes: string;
}

export function verifyOfficeAttendance(params: VerificationParams): VerificationResult {
  const { method, userLat, userLng, userIp, officeLat, officeLng, radiusMeters = 100, allowedIPs = [] } = params;

  if (method === VerificationMethod.SELF_DECLARATION) {
    return {
      status: VerificationStatus.VERIFIED,
      notes: "Verified via Self-Declaration policy.",
    };
  }

  if (method === VerificationMethod.GPS_GEOFENCE) {
    if (userLat === undefined || userLng === undefined || officeLat === undefined || officeLng === undefined) {
      return {
        status: VerificationStatus.UNVERIFIED,
        notes: "GPS coordinates were not provided or unavailable.",
      };
    }

    const distance = calculateDistanceMeters(userLat, userLng, officeLat, officeLng);
    if (distance <= radiusMeters) {
      return {
        status: VerificationStatus.VERIFIED,
        notes: `GPS Geofence verified: ${Math.round(distance)}m from office (allowed ${radiusMeters}m).`,
      };
    } else {
      return {
        status: VerificationStatus.PENDING_REVIEW,
        notes: `GPS Geofence flag: User is ${Math.round(distance)}m away from office (allowed ${radiusMeters}m).`,
      };
    }
  }

  if (method === VerificationMethod.WIFI_IP) {
    if (!userIp) {
      return {
        status: VerificationStatus.UNVERIFIED,
        notes: "User IP address was not provided.",
      };
    }

    const isMatch = allowedIPs.some((allowed) => userIp.includes(allowed) || allowed === "*");
    if (isMatch) {
      return {
        status: VerificationStatus.VERIFIED,
        notes: `IP Network verified: Connected to approved network (${userIp}).`,
      };
    } else {
      return {
        status: VerificationStatus.PENDING_REVIEW,
        notes: `IP Network flag: Connected from unapproved network (${userIp}).`,
      };
    }
  }

  return {
    status: VerificationStatus.UNVERIFIED,
    notes: "Unknown verification method.",
  };
}
