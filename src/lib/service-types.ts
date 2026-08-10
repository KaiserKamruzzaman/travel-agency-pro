import type { ServiceType } from "@/generated/prisma/client";

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  AIR_TICKET: "Air ticket",
  HOTEL: "Hotel booking",
  VISA: "Visa processing",
  TOUR_PACKAGE: "Tour package",
  INSURANCE: "Travel insurance",
  OTHER: "Other",
};

export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = (
  Object.keys(SERVICE_TYPE_LABEL) as ServiceType[]
).map((value) => ({ value, label: SERVICE_TYPE_LABEL[value] }));

// Sale.travelDate is a required column shared by every service type — these
// relabel what it means per type rather than showing a generic "Travel
// date" on a hotel or visa sale.
export const SERVICE_DATE_LABEL: Record<ServiceType, string> = {
  AIR_TICKET: "Travel date",
  HOTEL: "Check-in date",
  VISA: "Needed-by date",
  TOUR_PACKAGE: "Departure date",
  INSURANCE: "Coverage start date",
  OTHER: "Service date",
};

// Sale.returnDate is optional and, beyond AIR_TICKET round-trips, only
// makes sense for services with a genuine end date — visa and "other"
// don't get a return-date field at all.
export const SERVICE_RETURN_DATE_LABEL: Partial<Record<ServiceType, string>> = {
  HOTEL: "Check-out date",
  TOUR_PACKAGE: "Return date",
  INSURANCE: "Coverage end date",
};

export const SERVICE_PAX_LABEL: Record<ServiceType, string> = {
  AIR_TICKET: "Passengers / tickets",
  HOTEL: "Rooms / guests",
  VISA: "Applicants",
  TOUR_PACKAGE: "Travelers",
  INSURANCE: "Insured persons",
  OTHER: "Units",
};

// Sale.passengerName is the customer-facing name field on every service
// type — who it actually refers to differs (a flight passenger isn't the
// same concept as a visa applicant), so this drives its label per type.
export const SERVICE_NAME_LABEL: Record<ServiceType, string> = {
  AIR_TICKET: "Passenger name(s)",
  HOTEL: "Guest name(s)",
  VISA: "Applicant name(s)",
  TOUR_PACKAGE: "Traveler name(s)",
  INSURANCE: "Insured name(s)",
  OTHER: "Customer name",
};
