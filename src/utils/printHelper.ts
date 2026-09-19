/**
 * Universal Native Printing Utility for DPIB RESULT ZONE
 * Triggers the browser and device's native Print / "Save as PDF" dialog directly.
 * Works seamlessly across Android, iPhone (iOS Safari), iPad, Tablets, and Desktop browsers.
 */

export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: unknown) => void;
}

export function printElementById(elementId: string, options: PrintOptions = {}) {
  const {
    title = 'DPIB Document',
    orientation = 'portrait',
    margin = '8mm 10mm 8mm 10mm',
    onStart,
    onComplete,
    onError,
  } = options;

  if (onStart) onStart();

  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.warn(`[printElementById] Target #${elementId} not found, invoking direct window.print()`);
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error('Fallback window.print failed:', e);
      if (onError) onError(e);
    }
    if (onComplete) onComplete();
    return;
  }

  try {
    // 1. Remove any previous native print container
    const existingRoot = document.getElementById('dpib-native-print-root');
    if (existingRoot && existingRoot.parentNode) {
      existingRoot.parentNode.removeChild(existingRoot);
    }

    // 2. Create the top-level print root directly on body
    const printRoot = document.createElement('div');
    printRoot.id = 'dpib-native-print-root';
    printRoot.className = 'dpib-native-print-root';

    // 3. Clone target element with full subtree
    const clone = targetElement.cloneNode(true) as HTMLElement;
    // Remove conflicting ids and hidden constraints
    clone.removeAttribute('id');
    clone.classList.remove('hidden');
    clone.style.display = 'block';
    clone.style.visibility = 'visible';
    clone.style.transform = 'none'; // reset preview zoom scale to 1:1
    clone.style.margin = '0 auto';
    clone.style.maxWidth = '100%';

    // 4. Duplicate any Canvas bitmaps (e.g. QR codes, charts) to the clone
    const origCanvases = targetElement.querySelectorAll('canvas');
    const cloneCanvases = clone.querySelectorAll('canvas');
    origCanvases.forEach((orig, idx) => {
      const cln = cloneCanvases[idx];
      if (cln) {
        cln.width = orig.width;
        cln.height = orig.height;
        const ctx = cln.getContext('2d');
        if (ctx) {
          ctx.drawImage(orig, 0, 0);
        }
      }
    });

    // 5. Duplicate form input/textarea values
    const origInputs = targetElement.querySelectorAll('input, textarea, select');
    const cloneInputs = clone.querySelectorAll('input, textarea, select');
    origInputs.forEach((orig: any, idx) => {
      const cln: any = cloneInputs[idx];
      if (cln && orig.value !== undefined) {
        cln.value = orig.value;
      }
    });

    printRoot.appendChild(clone);
    document.body.appendChild(printRoot);

    // 6. Inject dynamic @page style for orientation and margins
    let pageStyleTag = document.getElementById('dpib-native-page-style') as HTMLStyleElement;
    if (!pageStyleTag) {
      pageStyleTag = document.createElement('style');
      pageStyleTag.id = 'dpib-native-page-style';
      document.head.appendChild(pageStyleTag);
    }
    pageStyleTag.textContent = `
      @page {
        size: A4 ${orientation};
        margin: ${margin};
      }
    `;

    // 7. Set document title so native "Save as PDF" presets this filename
    const originalTitle = document.title;
    document.title = title;

    // 8. Mark document as actively in native print mode
    document.documentElement.classList.add('dpib-native-printing');
    document.body.classList.add('dpib-native-printing');

    // 9. Register cleanup handler on afterprint or timeout
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.documentElement.classList.remove('dpib-native-printing');
      document.body.classList.remove('dpib-native-printing');
      if (printRoot.parentNode) {
        printRoot.parentNode.removeChild(printRoot);
      }
      if (pageStyleTag && pageStyleTag.parentNode) {
        pageStyleTag.parentNode.removeChild(pageStyleTag);
      }
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
      if (onComplete) onComplete();
    };

    window.addEventListener('afterprint', cleanup, { once: true });

    // 10. Trigger native print dialog
    // A microtask / 40ms timeout ensures DOM mount and paint without losing user gesture on mobile
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (printErr) {
        console.warn('Native window.print threw an error:', printErr);
        if (onError) onError(printErr);
        cleanup();
      }
    }, 40);

    // Safety fallback cleanup in case afterprint does not fire on certain older mobile browsers
    setTimeout(cleanup, 4000);

  } catch (err) {
    console.error('[printElementById] Failed to prepare native print:', err);
    if (onError) onError(err);
    try {
      window.focus();
      window.print();
    } catch (fallbackErr) {
      console.error('[printElementById] Fallback window.print also failed:', fallbackErr);
    }
    if (onComplete) onComplete();
  }
}
