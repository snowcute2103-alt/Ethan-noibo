/// <reference path="./retro-tv.d.ts" />
'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import ethanLogo from '@/public/images/brand/logo.png';
import { useReducedEffects } from '@/lib/use-reduced-effects';
import './retro-tv.css';

const GRILL_HOLES = 34;
const TEST_BARS = 21;
const LOGO_VIDEO_SRC = '/images/retro-tv/video.mp4';
/** Độ trễ trước khi tự bật — để người xem kịp thấy TV đang tắt trước khi nó bật lên. */
const AUTO_POWER_ON_DELAY_MS = 600;

/**
 * CSS-only retro CRT TV — ported from a CodePen by Ben Evans (tinydesign.co.uk /
 * linktr.ee/ivorjetski). Power/tuning/volume interactivity runs on native
 * `:checked` + `:has()`, no JS — only the looping brand video in the center of
 * the screen is a real element. See retro-tv.css for the scoping changes made to
 * safely embed it inside an existing page (original assumed it owned the whole
 * document: <html>, <body>, <input>, <label> were all styled globally). The
 * original's rotating wireframe cube logo (and its tune3 "morph" easter egg,
 * which reshaped that same cube) were removed when swapped for the video.
 */
export default function RetroTv() {
  const powerRef = useRef<HTMLInputElement>(null);
  const reduceEffects = useReducedEffects();

  useEffect(() => {
    if (reduceEffects) return;
    const timer = setTimeout(() => {
      if (powerRef.current) powerRef.current.checked = true;
    }, AUTO_POWER_ON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reduceEffects]);

  return (
    <div className="retro-tv-widget d-flex">
      <tv-content>
        <tv-set>
          <tv-crt>
            <tv-screen>
              <u>
                <u></u> <u></u> <u></u> <u></u>
              </u>
              <u></u>
              <u></u>
              <video
                className="tv-logo-video"
                autoPlay={!reduceEffects}
                muted
                loop
                playsInline
                src={LOGO_VIDEO_SRC}
              />
            </tv-screen>
            <Image src={ethanLogo} alt="Ethan Ecom" className="tv-standby-logo" priority />
            <div>
              <div>
                <tv-test className="squircle">
                  <u>
                    {Array.from({ length: TEST_BARS }).map((_, i) => (
                      <u key={i}></u>
                    ))}
                  </u>
                </tv-test>
              </div>
            </div>
            <tv-tune className="squircle"></tv-tune>
            <tv-light>
              <u></u>
              <u></u>
              <u></u>
              <u></u>
              <u>
                {/* window */}
                <u>
                  <u></u>
                  <u></u>
                </u>
                {/* curtains */}
                <u>
                  <u></u>
                  <u></u>
                </u>
                <u></u>
                <u></u>
                {/* horizontal reflections */}
                <u></u>
                <u></u>
              </u>
            </tv-light>
          </tv-crt>
          <tv-panel>
            <tv-grill>
              <tv-speaker> </tv-speaker>
              {Array.from({ length: GRILL_HOLES }).map((_, i) => (
                <u key={i}></u>
              ))}
            </tv-grill>
            <tv-knobs>
              <div className="power d-flex">
                <tv-flex>
                  <span className="my-md d-block text-center text-white">Power</span>
                  <label htmlFor="on-off" title="Power"></label>
                </tv-flex>
                <tv-flex className="vol">
                  <span className="my-md d-block text-center text-white">Volume</span>
                  <u>
                    <u>
                      <u></u>
                    </u>
                    <tv-dialvol>
                      <label htmlFor="vol1"></label>
                      <label htmlFor="vol2"></label>
                      <label htmlFor="vol3"></label>
                      <label htmlFor="vol4"></label>
                    </tv-dialvol>
                  </u>
                </tv-flex>
              </div>
              <div className="tuning">
                <span className="my-md d-block text-center text-white">Tuning</span>
                <u>
                  <u>
                    <u></u>
                  </u>
                  <tv-dial>
                    <label htmlFor="tune1"></label>
                    <label htmlFor="tune2"></label>
                    <label htmlFor="tune3"></label>
                    <label htmlFor="tune4"></label>
                  </tv-dial>
                  <label htmlFor="unclick"></label>
                </u>
              </div>
              <div>
                <a className="badge" href="https://ethanecom.com" target="_blank" title="Ethan Ecom" rel="noreferrer">
                  <u className="sig">
                    <u></u>
                  </u>
                </a>
              </div>
            </tv-knobs>
          </tv-panel>
        </tv-set>
      </tv-content>

      <input ref={powerRef} type="checkbox" name="tv" id="on-off" />
      <input type="radio" name="tv" id="tune1" />
      <input type="radio" name="tv" id="tune2" />
      <input type="radio" name="tv" id="tune3" />
      <input type="radio" name="tv" id="tune4" />
      <input type="radio" name="tv" id="unclick" defaultChecked />
    </div>
  );
}
