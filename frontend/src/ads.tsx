import { useEffect, useRef, useState } from 'react';
import { TossAds } from '@apps-in-toss/web-framework';

// Test ID until the console issues a real one; real IDs must not be used while testing.
const BANNER_AD_GROUP_ID = import.meta.env.VITE_TOSS_BANNER_AD_GROUP_ID || 'ait-ad-test-banner-id';
let ready: Promise<boolean> | undefined;

// Resolves false outside the Toss app (Cloudflare web, local dev) so no ad slot is shown.
function initAds() {
 ready ??= new Promise(resolve => {
  try {
   if (!TossAds.initialize.isSupported() || !TossAds.attachBanner.isSupported()) return resolve(false);
   TossAds.initialize({callbacks: {onInitialized: () => resolve(true), onInitializationFailed: () => resolve(false)}});
  } catch { resolve(false); }
 });
 return ready;
}

export function AdBanner() {
 const slot = useRef<HTMLDivElement>(null);
 const [state, setState] = useState<'pending' | 'shown' | 'hidden'>('pending');
 useEffect(() => {
  let active = true;
  let banner: {destroy: () => void} | undefined;
  initAds().then(supported => {
   if (!active) return;
   if (!supported || !slot.current) return setState('hidden');
   banner = TossAds.attachBanner(BANNER_AD_GROUP_ID, slot.current, {theme: 'light', tone: 'blackAndWhite', variant: 'card', callbacks: {
    onAdRendered: () => setState('shown'), onNoFill: () => setState('hidden'), onAdFailedToRender: () => setState('hidden'),
   }});
  });
  return () => { active = false; banner?.destroy(); };
 }, []);
 if (state === 'hidden') return null;
 return <aside className="ad" data-state={state} aria-label="광고">{state === 'shown' && <p className="ad-label">광고</p>}<div ref={slot} className="ad-slot"/></aside>;
}
