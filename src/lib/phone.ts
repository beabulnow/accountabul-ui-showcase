export type CountryCode = {
  iso: string;
  name: string;
  flag: string;
  dialCode: string;
  /** Exact number of digits the national part can have. */
  maxDigits: number;
  minDigits: number;
  placeholder: string;
};

export const COUNTRY_CODES: CountryCode[] = [
  { iso: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", maxDigits: 10, minDigits: 10, placeholder: "(314) 555-0123" },
  { iso: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", maxDigits: 10, minDigits: 9, placeholder: "7400 123456" },
  { iso: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", maxDigits: 10, minDigits: 10, placeholder: "(416) 555-0123" },
  { iso: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52", maxDigits: 10, minDigits: 10, placeholder: "55 1234 5678" },
  { iso: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61", maxDigits: 9, minDigits: 9, placeholder: "412 345 678" },
  { iso: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49", maxDigits: 11, minDigits: 10, placeholder: "1512 3456789" },
  { iso: "FR", name: "France", flag: "🇫🇷", dialCode: "+33", maxDigits: 9, minDigits: 9, placeholder: "6 12 34 56 78" },
  { iso: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34", maxDigits: 9, minDigits: 9, placeholder: "612 345 678" },
  { iso: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", maxDigits: 10, minDigits: 10, placeholder: "98765 43210" },
  { iso: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234", maxDigits: 10, minDigits: 10, placeholder: "802 123 4567" },
  { iso: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55", maxDigits: 11, minDigits: 10, placeholder: "11 91234 5678" },
  { iso: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27", maxDigits: 9, minDigits: 9, placeholder: "82 123 4567" },
];

export const DEFAULT_DIAL_CODE = "+1";

export function countryByDialCode(dialCode: string): CountryCode {
  return (
    COUNTRY_CODES.find((entry) => entry.dialCode === dialCode) ??
    COUNTRY_CODES[0]!
  );
}

/** Light display formatting only — the stored value is always digits. */
export function formatNationalNumber(digits: string, country: CountryCode) {
  const value = digits.replace(/\D/g, "").slice(0, country.maxDigits);
  if (country.dialCode === "+1") {
    if (value.length <= 3) return value;
    if (value.length <= 6) return `(${value.slice(0, 3)}) ${value.slice(3)}`;
    return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
  }
  return value.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

/** Splits a stored E.164 value back into a picker-friendly shape. */
export function splitE164(value: string | null | undefined) {
  const raw = (value ?? "").replace(/[^\d+]/g, "");
  if (!raw.startsWith("+")) {
    const digits = raw.replace(/\D/g, "");
    return { dialCode: DEFAULT_DIAL_CODE, nationalNumber: digits.slice(0, 10) };
  }
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const match = sorted.find((entry) => raw.startsWith(entry.dialCode));
  if (!match) return { dialCode: DEFAULT_DIAL_CODE, nationalNumber: raw.replace(/\D/g, "") };
  return {
    dialCode: match.dialCode,
    nationalNumber: raw.slice(match.dialCode.length).replace(/\D/g, "").slice(0, match.maxDigits),
  };
}

export function toE164(dialCode: string, nationalNumber: string) {
  const digits = nationalNumber.replace(/\D/g, "");
  return digits ? `${dialCode}${digits}` : "";
}

/** Returns a plain-language problem, or null when the number is usable. */
export function phoneProblem(dialCode: string, nationalNumber: string) {
  const country = countryByDialCode(dialCode);
  const digits = nationalNumber.replace(/\D/g, "");
  if (digits.length === 0) return "Enter your phone number";
  if (digits.length < country.minDigits) {
    return `${country.name} numbers need ${country.minDigits} digits`;
  }
  if (digits.length > country.maxDigits) {
    return `${country.name} numbers use at most ${country.maxDigits} digits`;
  }
  return null;
}

/** Formats a stored E.164 value for display, e.g. +1 (314) 445-4511. */
export function formatE164(value: string | null | undefined) {
  if (!value) return "";
  const { dialCode, nationalNumber } = splitE164(value);
  if (!nationalNumber) return value;
  return `${dialCode} ${formatNationalNumber(nationalNumber, countryByDialCode(dialCode))}`;
}
