// Utility to capture a real screenshot from the user's display and crop to a specific element's bounds
// Uses getDisplayMedia so it captures cross-origin iframe pixels as rendered in the tab

export interface CaptureOptions {
  // If true, attempts to hint the browser to capture the current tab (Chrome supports preferCurrentTab)
  preferCurrentTab?: boolean;
  // Include cursor in the capture
  includeCursor?: boolean;
}

/**
 * Capture a screenshot of the current display and crop it to the bounding box of the given element.
 * Returns a PNG data URL. Requires a user gesture due to getDisplayMedia permissions.
 */
export async function captureElementFromDisplayMedia(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('captureElementFromDisplayMedia must be called in the browser');
  }

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error('Target element has zero size');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      //@ts-expect-error non-standard but supported in Chromium
      preferCurrentTab: options.preferCurrentTab !== false,
      cursor: (options.includeCursor ?? false) ? 'always' : 'never',
      frameRate: 30,
      width: { ideal: Math.round(window.innerWidth * window.devicePixelRatio) },
      height: { ideal: Math.round(window.innerHeight * window.devicePixelRatio) },
      logicalSurface: true as unknown as boolean, // best-effort hint; ignored if unsupported
    },
    audio: false,
  });

  try {
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('No video track available from display capture');

    const video = document.createElement('video');
    video.style.position = 'fixed';
    video.style.top = '-10000px';
    video.muted = true;
    video.srcObject = stream;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
      // Safari sometimes needs play() to resolve metadata dimensions
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      video.play().catch(() => {/* ignore */});
    });

    const videoWidth = video.videoWidth || (track.getSettings().width as number) || window.innerWidth;
    const videoHeight = video.videoHeight || (track.getSettings().height as number) || window.innerHeight;

    // Map DOM coordinates to captured video coordinates
    const scaleX = videoWidth / window.innerWidth;
    const scaleY = videoHeight / window.innerHeight;

    const sx = Math.max(0, Math.floor(rect.left * scaleX));
    const sy = Math.max(0, Math.floor(rect.top * scaleY));
    const sw = Math.min(videoWidth - sx, Math.floor(rect.width * scaleX));
    const sh = Math.min(videoHeight - sy, Math.floor(rect.height * scaleY));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas 2D context');

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = canvas.toDataURL('image/png');

    // Cleanup
    track.stop();
    stream.getTracks().forEach(t => t.stop());
    video.srcObject = null;

    return dataUrl;
  } catch (err) {
    // Ensure we stop the stream on error
    stream.getTracks().forEach(t => t.stop());
    throw err;
  }
}

/**
 * Convenience helper to capture the iframe by its element or id string.
 */
export async function captureIframeById(
  iframeId: string,
  options?: CaptureOptions
): Promise<string> {
  const el = document.getElementById(iframeId);
  if (!el) throw new Error(`Element with id "${iframeId}" not found`);
  return captureElementFromDisplayMedia(el, options);
}


