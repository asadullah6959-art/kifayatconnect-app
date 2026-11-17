/**
 * High-resolution print / "Save as PDF" for the official documents.
 *
 * Browser print produces a vector PDF with the correct Urdu Nastaliq shaping and
 * the exact on-screen layout, so the printed Rukniyat Form and Raseed Wasooli
 * keep the organisation's official appearance. Nothing about the app's dark
 * theme is touched: the print stylesheet only reveals the .sqi-print-area.
 */

export function printElement(element: HTMLElement | null | undefined): boolean {
  if (!element) return false;
  if (typeof window === 'undefined') return false;

  element.classList.add('sqi-print-area');
  document.body.classList.add('sqi-printing');

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    element.classList.remove('sqi-print-area');
    document.body.classList.remove('sqi-printing');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  // Give the browser a frame to apply the print classes before opening the dialog.
  window.setTimeout(() => {
    try {
      window.print();
    } finally {
      window.setTimeout(cleanup, 1000);
    }
  }, 80);

  return true;
}

/** Convenience: print the first element matching a selector. */
export function printSelector(selector: string): boolean {
  if (typeof document === 'undefined') return false;
  return printElement(document.querySelector<HTMLElement>(selector));
}
