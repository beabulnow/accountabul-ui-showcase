import { inputClass } from "@/components/ui-kit";
import {
  COUNTRY_CODES,
  countryByDialCode,
  formatNationalNumber,
  type CountryCode,
} from "@/lib/phone";

/**
 * Country code picker plus a national number field. The national field only
 * accepts digits and stops at the exact length that country uses, so nobody
 * can paste an over-long number or any non-numeric payload.
 */
export function PhoneInput({
  id,
  dialCode,
  nationalNumber,
  onChange,
  disabled,
}: {
  id: string;
  dialCode: string;
  nationalNumber: string;
  onChange: (next: { dialCode: string; nationalNumber: string }) => void;
  disabled?: boolean;
}) {
  const country: CountryCode = countryByDialCode(dialCode);

  return (
    <div className="flex gap-2">
      <div className="w-32 flex-none">
      <select
        aria-label="Country calling code"
        className={inputClass}
        value={country.dialCode}
        disabled={disabled}
        onChange={(event) => {
          const next = countryByDialCode(event.target.value);
          onChange({
            dialCode: next.dialCode,
            nationalNumber: nationalNumber.slice(0, next.maxDigits),
          });
        }}
      >
        {COUNTRY_CODES.map((entry) => (
          <option key={entry.iso} value={entry.dialCode}>
            {entry.flag} {entry.dialCode}
          </option>
        ))}
      </select>
      </div>
      <div className="min-w-0 flex-1">
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className={inputClass}
        placeholder={country.placeholder}
        maxLength={country.maxDigits + 6}
        disabled={disabled}
        value={formatNationalNumber(nationalNumber, country)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, country.maxDigits);
          onChange({ dialCode: country.dialCode, nationalNumber: digits });
        }}
      />
      </div>
    </div>
  );
}
