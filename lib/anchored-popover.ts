export interface AnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface AnchoredPopoverPosition {
  placement: 'above' | 'below';
  edge: number;
  left: number;
  width: number;
  maxHeight: number;
}

const VIEWPORT_MARGIN = 8;
const POPOVER_GAP = 4;
const MIN_COMFORTABLE_HEIGHT = 240;

/** Keeps a fixed-position popover inside the viewport and prefers opening
 * upward when the trigger is too close to the bottom edge. */
export function getAnchoredPopoverPosition(
  anchor: AnchorRect,
  viewport: ViewportSize,
  preferredWidth: number
): AnchoredPopoverPosition {
  const width = Math.min(preferredWidth, Math.max(0, viewport.width - VIEWPORT_MARGIN * 2));
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewport.width - width - VIEWPORT_MARGIN);
  const left = Math.min(Math.max(anchor.left, VIEWPORT_MARGIN), maxLeft);
  const spaceBelow = Math.max(0, viewport.height - anchor.bottom - POPOVER_GAP - VIEWPORT_MARGIN);
  const spaceAbove = Math.max(0, anchor.top - POPOVER_GAP - VIEWPORT_MARGIN);
  const placement = spaceBelow < MIN_COMFORTABLE_HEIGHT && spaceAbove > spaceBelow ? 'above' : 'below';

  return {
    placement,
    edge: placement === 'above' ? viewport.height - anchor.top + POPOVER_GAP : anchor.bottom + POPOVER_GAP,
    left,
    width,
    maxHeight: placement === 'above' ? spaceAbove : spaceBelow,
  };
}
