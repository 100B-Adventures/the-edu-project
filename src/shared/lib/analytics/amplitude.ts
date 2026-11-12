import type { Types } from '@amplitude/analytics-browser';

import { isProductionAnalyticsHost } from './production-host';

type AmplitudeModule = typeof import('@amplitude/analytics-browser');

let initialized = false;
let amplitudePromise: Promise<AmplitudeModule> | null = null;
let initPromise: Promise<void> | null = null;

const shouldEnableAmplitude =
  process.env.NEXT_PUBLIC_ENABLE_AMPLITUDE === 'true';

const canUseAmplitude = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV !== 'production') return false;
  if (!isProductionAnalyticsHost(window.location.hostname)) return false;
  return shouldEnableAmplitude;
};

const loadAmplitude = (): Promise<AmplitudeModule> | null => {
  if (!canUseAmplitude()) return null;

  amplitudePromise ??= import('@amplitude/analytics-browser');

  return amplitudePromise;
};

const runWithAmplitude = (
  callback: (amplitude: AmplitudeModule) => void
): void => {
  const amplitude = loadAmplitude();
  if (!amplitude) return;

  void Promise.all([initPromise ?? Promise.resolve(), amplitude]).then(
    ([, amplitude]) => {
      callback(amplitude);
    }
  );
};

export const initAmplitude = (): void => {
  if (!canUseAmplitude()) return;
  if (initialized) return;

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;

  const amplitude = loadAmplitude();
  if (!amplitude) return;

  initPromise ??= amplitude.then((amplitude) => {
    if (initialized) return;

    amplitude.init(apiKey, {
      defaultTracking: {
        sessions: true,
      },
    });

    initialized = true;
  });

  void initPromise;
};

export const trackAmplitudeEvent = (
  eventName: string,
  properties?: Record<string, unknown>
): void => {
  runWithAmplitude((amplitude) => {
    amplitude.track(eventName, properties);
  });
};

export const setAmplitudeUser = (userId: string): void => {
  runWithAmplitude((amplitude) => {
    amplitude.setUserId(userId);
  });
};

export const setAmplitudeUserProperties = (
  properties: Record<string, unknown>
): void => {
  runWithAmplitude((amplitude) => {
    const identifyEvent = new amplitude.Identify();

    Object.entries(properties).forEach(([key, value]) => {
      identifyEvent.set(key, value as Types.ValidPropertyType);
    });

    amplitude.identify(identifyEvent);
  });
};

export const resetAmplitudeUser = (): void => {
  runWithAmplitude((amplitude) => {
    amplitude.reset();
  });
};
