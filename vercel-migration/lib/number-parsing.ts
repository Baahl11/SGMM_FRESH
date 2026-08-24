function normalizeSingleSeparator(value: string, separator: ',' | '.'): string {
  const parts = value.split(separator);

  if (parts.length <= 1) {
    return value;
  }

  const looksLikeThousandsGrouping =
    parts.length > 1 &&
    parts[0].length > 0 &&
    parts.slice(1).every((part) => part.length === 3);

  if (looksLikeThousandsGrouping) {
    return parts.join('');
  }

  if (parts.length === 2) {
    return `${parts[0]}.${parts[1]}`;
  }

  return parts.join('');
}

export function parseFlexibleNumberInput(input: string | number | null | undefined): number {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : Number.NaN;
  }

  const raw = String(input ?? '').trim();
  if (!raw) {
    return Number.NaN;
  }

  const withoutCurrency = raw
    .replace(/\b(mxn|usd|eur)\b/gi, '')
    .replace(/[€£¥₱$]/g, '')
    .replace(/\s+/g, '');

  if (!withoutCurrency || !/^-?[0-9.,]+$/.test(withoutCurrency)) {
    return Number.NaN;
  }

  const isNegative = withoutCurrency.startsWith('-');
  const unsignedValue = isNegative ? withoutCurrency.slice(1) : withoutCurrency;

  if (!unsignedValue || !/[0-9]/.test(unsignedValue)) {
    return Number.NaN;
  }

  const hasComma = unsignedValue.includes(',');
  const hasDot = unsignedValue.includes('.');

  let normalized = unsignedValue;

  if (hasComma && hasDot) {
    const lastComma = unsignedValue.lastIndexOf(',');
    const lastDot = unsignedValue.lastIndexOf('.');

    if (lastComma > lastDot) {
      normalized = unsignedValue.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = unsignedValue.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = normalizeSingleSeparator(unsignedValue, ',');
  } else if (hasDot) {
    normalized = normalizeSingleSeparator(unsignedValue, '.');
  }

  const parsed = Number.parseFloat(`${isNegative ? '-' : ''}${normalized}`);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
