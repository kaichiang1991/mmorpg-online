export interface Size {
  width: number;
  height: number;
}

/**
 * World-container offset that centers the focus point on screen,
 * clamped so the camera never shows past the map edges.
 */
export function cameraOffset(screen: Size, map: Size, focusX: number, focusY: number): {
  x: number;
  y: number;
} {
  return {
    x: Math.min(0, Math.max(screen.width - map.width, screen.width / 2 - focusX)),
    y: Math.min(0, Math.max(screen.height - map.height, screen.height / 2 - focusY)),
  };
}
