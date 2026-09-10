/// <reference path="./retro-tv.d.ts" />
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ethanLogo from '@/public/images/brand/logo.png';
import { useReducedEffects } from '@/lib/use-reduced-effects';
import './retro-tv.css';

const GRILL_HOLES = 34;
const TEST_BARS = 21;
const LOGO_VIDEO_SRC = '/images/retro-tv/video.mp4';
const PELICAN_CHANNEL_SRC = '/images/retro-tv/pelican-channel.html';
const PELICAN_MESSAGE_SOURCE = 'ethan-retro-tv';
const PELICAN_BGM_SRC = '/images/retro-tv/pelican-theme.mp4';
const PELICAN_BGM_RATE = 1.5;
/** Độ trễ trước khi tự bật — để người xem kịp thấy TV đang tắt trước khi nó bật lên. */
const AUTO_POWER_ON_DELAY_MS = 600;

type TvChannel = 'vid1' | 'pelican' | 'vid2' | 'vid3' | 'vid4' | 'vid5' | 'ethan';
type PelicanCommand = 'slow' | 'cruise' | 'fast' | 'toggle-pause' | 'toggle-theme' | 'honk';

/** Tập kênh có sẵn — thứ tự chuyển kênh (nút "Chuyển kênh") và kênh mặc định khi load trang được
 *  xáo ngẫu nhiên mỗi lần TV mount, xem `shuffle(CHANNEL_POOL)`. */
const CHANNEL_POOL: readonly TvChannel[] = ['vid1', 'vid2', 'vid4', 'vid3', 'vid5', 'ethan', 'pelican'];

const VIDEO_CHANNEL_SRC: Partial<Record<TvChannel, string>> = {
  vid1: '/images/retro-tv/vid1.mp4',
  vid2: '/images/retro-tv/vid2.mp4',
  vid3: '/images/retro-tv/vid3.mp4',
  vid4: '/images/retro-tv/vid4.mp4',
  vid5: '/images/retro-tv/vid5.mp4',
  ethan: LOGO_VIDEO_SRC,
};

/** Fisher-Yates — không sửa mảng gốc. */
function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Kênh nào chưa hiển thị thì âm thầm tải trước ở nền, để bấm "Chuyển kênh" phát
 *  ngay từ cache thay vì đợi tải lại từ mạng mỗi lần. Bỏ qua khi reduceEffects
 *  (mobile/tablet) để không tốn băng thông data của người dùng. */
const VIDEO_CHANNELS = Object.keys(VIDEO_CHANNEL_SRC) as TvChannel[];

function getChannelLabel(channel: TvChannel) {
  switch (channel) {
    case 'vid1':
      return 'Video 1';
    case 'vid2':
      return 'Video 2';
    case 'vid3':
      return 'Video 3';
    case 'vid4':
      return 'Video 4';
    case 'vid5':
      return 'Video 5';
    case 'pelican':
      return 'hoạt họa Pélican';
    case 'ethan':
      return 'Ethan Ecom';
  }
}

const PELICAN_FUNCTION_SEQUENCE: readonly PelicanCommand[] = [
  'slow',
  'cruise',
  'fast',
  'toggle-pause',
  'toggle-theme',
  'honk',
];

function getPelicanFunctionLabel(command: PelicanCommand, isPaused: boolean, isNight: boolean) {
  switch (command) {
    case 'slow':
      return 'Chậm';
    case 'cruise':
      return 'Thường';
    case 'fast':
      return 'Nhanh';
    case 'toggle-pause':
      return isPaused ? 'Tiếp tục' : 'Tạm dừng';
    case 'toggle-theme':
      return isNight ? 'Chế độ sáng' : 'Chế độ tối';
    case 'honk':
      return 'Bóp còi';
  }
}

/**
 * Retro CRT TV — ported from a CodePen by Ben Evans (tinydesign.co.uk /
 * linktr.ee/ivorjetski). The tuning dial changes channels; the bottom badge
 * cycles through the Pelican channel's functions. See retro-tv.css for the
 * scoping changes made to
 * safely embed it inside an existing page (original assumed it owned the whole
 * document: <html>, <body>, <input>, <label> were all styled globally). The
 * original's rotating wireframe cube logo (and its tune3 "morph" easter egg,
 * which reshaped that same cube) were removed when swapped for the video.
 */
export default function RetroTv() {
  const powerRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pelicanFrameRef = useRef<HTMLIFrameElement>(null);
  const pelicanBgmRef = useRef<HTMLAudioElement>(null);
  // Xáo 1 lần lúc mount — mỗi lần load trang ra thứ tự chuyển kênh khác nhau, kênh mặc định
  // cũng đổi theo (phần tử đầu của mảng đã xáo) thay vì luôn là kênh cố định.
  const channelOrderRef = useRef<TvChannel[] | null>(null);
  if (!channelOrderRef.current) channelOrderRef.current = shuffle(CHANNEL_POOL);
  const channelOrder = channelOrderRef.current;
  const reduceEffects = useReducedEffects();
  const [channel, setChannel] = useState<TvChannel>(() => channelOrder[0]);
  const [channelChangeId, setChannelChangeId] = useState(0);
  const [functionStep, setFunctionStep] = useState(0);
  const [isPelicanPaused, setIsPelicanPaused] = useState(false);
  const [isPelicanNight, setIsPelicanNight] = useState(false);
  const [isPelicanReady, setIsPelicanReady] = useState(false);
  const [functionStatus, setFunctionStatus] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  // CSS (:has(#on-off:checked)) điều khiển phần hiển thị tắt/mở; state này cho JS biết để dừng
  // hẳn video/audio khi tắt máy — trước đây chỉ ẩn hình, âm thanh vẫn phát ngầm khi chưa mute.
  const [isPoweredOn, setIsPoweredOn] = useState(false);

  useEffect(() => {
    if (reduceEffects) return;
    const timer = setTimeout(() => {
      if (powerRef.current) powerRef.current.checked = true;
      setIsPoweredOn(true);
    }, AUTO_POWER_ON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reduceEffects]);

  // Nạp nguồn mới khi đổi kênh — tách khỏi effect play/pause bên dưới để bật/tắt máy không
  // reload lại video đang phát (mất vị trí phát hiện tại).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || channel === 'pelican') return;
    video.load();
  }, [channel]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (channel === 'pelican' || !isPoweredOn || reduceEffects) {
      video.pause();
      return;
    }

    void video.play().catch(() => undefined);
  }, [channel, isPoweredOn, reduceEffects]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // The pelican channel's theme song plays here in the parent document, not inside the
  // sandboxed iframe — starting/unmuting audio from a postMessage handler in a
  // cross-frame document doesn't reliably count as user-activated, so browsers can
  // silently block it. A <audio> element living next to the "Chuyển kênh" button plays
  // in direct response to that click instead, same as the shared <video> above.
  useEffect(() => {
    const audio = pelicanBgmRef.current;
    if (!audio) return;
    audio.playbackRate = PELICAN_BGM_RATE;

    if (channel !== 'pelican' || reduceEffects || !isPoweredOn) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => undefined);
  }, [channel, reduceEffects, isPoweredOn]);

  useEffect(() => {
    if (pelicanBgmRef.current) pelicanBgmRef.current.muted = isMuted;
  }, [isMuted]);

  function toggleMute() {
    setIsMuted((muted) => !muted);
  }

  function changeChannel() {
    const nextChannel = channelOrder[(channelOrder.indexOf(channel) + 1) % channelOrder.length];
    setChannel(nextChannel);
    setFunctionStatus('');
    if (!reduceEffects) setChannelChangeId((changeId) => changeId + 1);
  }

  const isPelicanChannel = channel === 'pelican';

  function runNextPelicanFunction() {
    if (!isPelicanReady) return;

    const command = PELICAN_FUNCTION_SEQUENCE[functionStep];
    const functionLabel = getPelicanFunctionLabel(command, isPelicanPaused, isPelicanNight);

    if (!isPelicanChannel) {
      setChannel('pelican');
      if (!reduceEffects) setChannelChangeId((changeId) => changeId + 1);
    }

    pelicanFrameRef.current?.contentWindow?.postMessage(
      { source: PELICAN_MESSAGE_SOURCE, type: 'pelican-control', command },
      '*',
    );

    if (command === 'slow' || command === 'cruise' || command === 'fast') {
      setIsPelicanPaused(false);
    } else if (command === 'toggle-pause') {
      setIsPelicanPaused((isPaused) => !isPaused);
    } else if (command === 'toggle-theme') {
      setIsPelicanNight((isNight) => !isNight);
    }

    setFunctionStatus(functionLabel);
    setFunctionStep((step) => (step + 1) % PELICAN_FUNCTION_SEQUENCE.length);
  }

  const nextFunctionLabel = getPelicanFunctionLabel(
    PELICAN_FUNCTION_SEQUENCE[functionStep],
    isPelicanPaused,
    isPelicanNight,
  );

  return (
    <div className="retro-tv-widget d-flex" data-channel={channel} data-muted={isMuted}>
      <tv-content>
        <tv-set>
          <tv-crt>
            <tv-screen id="retro-tv-screen">
              <u>
                <u></u> <u></u> <u></u> <u></u>
              </u>
              <u></u>
              <u></u>
              <video
                ref={videoRef}
                className={`tv-logo-video${isPelicanChannel ? '' : ' is-active'}${channel === 'vid4' ? ' tv-vid4-bottom' : ''}`}
                autoPlay={!reduceEffects}
                preload="auto"
                aria-hidden={isPelicanChannel}
                muted={isMuted}
                loop
                playsInline
                src={isPelicanChannel ? undefined : VIDEO_CHANNEL_SRC[channel]}
              />
              {channel === 'vid2' ? <div className="tv-vid2-tint" aria-hidden="true" /> : null}
              {!reduceEffects
                ? VIDEO_CHANNELS.filter((preloadChannel) => preloadChannel !== channel).map((preloadChannel) => (
                    <video
                      key={preloadChannel}
                      className="tv-preload-video"
                      src={VIDEO_CHANNEL_SRC[preloadChannel]}
                      preload="auto"
                      muted
                      playsInline
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  ))
                : null}
              <iframe
                ref={pelicanFrameRef}
                className={`tv-channel-frame${isPelicanChannel ? ' is-active' : ''}`}
                src={PELICAN_CHANNEL_SRC}
                title="Kênh hoạt họa Pélican"
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                aria-hidden={!isPelicanChannel}
                onLoad={() => setIsPelicanReady(true)}
                tabIndex={-1}
              />
              <audio ref={pelicanBgmRef} src={PELICAN_BGM_SRC} muted={isMuted} loop />
              {isPelicanChannel && functionStatus ? (
                <output className="tv-function-status" aria-live="polite">
                  {functionStatus}
                </output>
              ) : null}
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
            <tv-tune
              key={channelChangeId}
              className={channelChangeId > 0 ? 'squircle tv-channel-transition' : 'squircle'}
            ></tv-tune>
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
                  <span className="my-md d-block text-center text-white">Tắt/Mở</span>
                  <label htmlFor="on-off" title="Tắt/Mở"></label>
                </tv-flex>
                <tv-flex className="vol">
                  <span className="my-md d-block text-center text-white">Volume</span>
                  <u>
                    <u>
                      <u></u>
                    </u>
                    <button
                      type="button"
                      className="tv-volume-button"
                      onClick={toggleMute}
                      aria-pressed={!isMuted}
                      aria-controls="retro-tv-screen"
                      aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                      title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    ></button>
                  </u>
                </tv-flex>
              </div>
              <div className="tuning">
                <span className="my-md d-block text-center text-white tv-label-lg">Chuyển kênh</span>
                <u>
                  <u>
                    <u></u>
                  </u>
                  <button
                    type="button"
                    className="tv-channel-button"
                    onClick={changeChannel}
                    aria-controls="retro-tv-screen"
                    aria-label={`Chuyển kênh. Kênh hiện tại: ${getChannelLabel(channel)}`}
                    title="Chuyển kênh"
                  ></button>
                </u>
              </div>
              <div>
                <button
                  type="button"
                  className="badge tv-function-cycle-button"
                  onClick={runNextPelicanFunction}
                  disabled={!isPelicanReady}
                  aria-controls="retro-tv-screen"
                  aria-label={`Chức năng. Bấm để chọn: ${nextFunctionLabel}`}
                  title={`Chức năng: ${nextFunctionLabel}`}
                >
                  <u className="sig" aria-hidden="true">
                    <u></u>
                  </u>
                </button>
              </div>
            </tv-knobs>
          </tv-panel>
        </tv-set>
      </tv-content>

      <input
        ref={powerRef}
        type="checkbox"
        name="tv"
        id="on-off"
        onChange={(e) => setIsPoweredOn(e.target.checked)}
      />
      <span className="sr-only" aria-live="polite">
        {`Đang phát kênh ${getChannelLabel(channel)}`}
      </span>
    </div>
  );
}
