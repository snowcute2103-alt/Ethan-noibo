import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/** retro-tv.tsx renders the original CRT TV markup's custom tags with a `tv-`
 *  prefix (hyphenated, per the custom-element name spec) so they keep matching
 *  retro-tv.css's tag selectors 1:1 while staying valid, recognized elements —
 *  a bare, non-hyphenated tag name like `<screen>` isn't a real HTML element or
 *  a valid custom-element name, so React logs an "unrecognized tag" console
 *  error for it. TypeScript's JSX.IntrinsicElements doesn't know these
 *  hyphenated tags by default, so declare them here. @types/react 18.2+ moved
 *  IntrinsicElements under the `react` module's own JSX namespace (rather than
 *  the bare global one), so augment both to be safe. */
type CustomElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

interface RetroTvIntrinsicElements {
  'tv-content': CustomElementProps;
  'tv-set': CustomElementProps;
  'tv-crt': CustomElementProps;
  'tv-screen': CustomElementProps;
  'tv-panel': CustomElementProps;
  'tv-knobs': CustomElementProps;
  'tv-grill': CustomElementProps;
  'tv-speaker': CustomElementProps;
  'tv-flex': CustomElementProps;
  'tv-light': CustomElementProps;
  'tv-tune': CustomElementProps;
  'tv-test': CustomElementProps;
  'tv-dial': CustomElementProps;
  'tv-dialvol': CustomElementProps;
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
