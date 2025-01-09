export const formatJSON = (str: string): string | null => {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return null;
  }
};

export const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

export const formatHexDump = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  const chunks: string[] = [];
  const bytesPerLine = 16;

  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const chunk = bytes.slice(i, i + bytesPerLine);
    const hex = Array.from(chunk)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map(byte => (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.')
      .join('');
    
    const offset = i.toString(16).padStart(8, '0');
    const hexPadded = hex.padEnd(bytesPerLine * 3 - 1, ' ');
    chunks.push(`${offset}  ${hexPadded}  |${ascii}|`);
  }

  return chunks.join('\n');
}; 