import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/** retro-tv.tsx renders the original CRT TV markup's custom (non-standard) tag
 *  names as-is so they keep matching retro-tv.css's tag selectors 1:1. TypeScript's
 *  JSX.IntrinsicElements doesn't know these tags by default, so declare them here.
 *  @types/react 18.2+ moved IntrinsicElements under the `react` module's own JSX
 *  namespace (rather than the bare global one), so augment both to be safe. */
type CustomElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

interface RetroTvIntrinsicElements {
  content: CustomElementProps;
  set: CustomElementProps;
  crt: CustomElementProps;
  screen: CustomElementProps;
  panel: CustomElementProps;
  knobs: CustomElementProps;
  grill: CustomElementProps;
  speaker: CustomElementProps;
  flex: CustomElementProps;
  light: CustomElementProps;
  effects: CustomElementProps;
  tune: CustomElementProps;
  test: CustomElementProps;
  cube: CustomElementProps;
  angle: CustomElementProps;
  dial: CustomElementProps;
  dialvol: CustomElementProps;
  x: CustomElementProps;
  y: CustomElementProps;
  z: CustomElementProps;
  x2: CustomElementProps;
  y2: CustomElementProps;
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends RetroTvIntrinsicElements {}
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends RetroTvIntrinsicElements {}
  }
}
