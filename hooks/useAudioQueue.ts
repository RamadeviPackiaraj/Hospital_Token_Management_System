import * as React from "react";
import {
  buildTokenAnnouncementQueue,
  playAnnouncementQueue,
  type AnnouncementQueueItem,
  type AudioGender,
  type AudioLanguage,
} from "@/lib/audioPlayer";

type QueuePlaybackOptions = {
  delayMs?: number;
  immediate?: boolean;
  volume?: number;
};

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

let globalQueue: Promise<boolean> = Promise.resolve(true);
let globalController: AbortController | null = null;
let globalActiveAudio: HTMLAudioElement | null = null;
let globalSessionId = 0;

function stopGlobalPlayback() {
  globalSessionId += 1;
  globalController?.abort();
  globalController = null;

  if (globalActiveAudio) {
    globalActiveAudio.pause();
    globalActiveAudio.currentTime = 0;
    globalActiveAudio = null;
  }

  globalQueue = Promise.resolve(false);
}

export function useAudioQueue(defaultOptions: QueuePlaybackOptions = {}) {
  const stop = React.useCallback(() => {
    stopGlobalPlayback();
  }, []);

  const enqueueQueue = React.useCallback(
    (items: AnnouncementQueueItem[], options: QueuePlaybackOptions = {}) => {
      const mergedOptions = {
        ...defaultOptions,
        ...options,
      };

      if (mergedOptions.immediate) {
        stopGlobalPlayback();
      }

      const currentSession = globalSessionId;

      globalQueue = globalQueue.catch(() => false).then(async () => {
        if (mergedOptions.delayMs && mergedOptions.delayMs > 0) {
          await wait(mergedOptions.delayMs);
        }

        if (currentSession !== globalSessionId) {
          return false;
        }

        const controller = new AbortController();
        globalController = controller;

        const result = await playAnnouncementQueue(items, {
          volume: mergedOptions.volume,
          signal: controller.signal,
          onAudioCreated: (audio) => {
            globalActiveAudio = audio;
          },
        });

        if (globalController === controller) {
          globalController = null;
        }

        return result;
      });

      return globalQueue;
    },
    [defaultOptions]
  );

  const announceToken = React.useCallback(
    (
      input: {
        token: number | string;
        language: AudioLanguage;
        gender: AudioGender;
      },
      options: QueuePlaybackOptions = {}
    ) => {
      return enqueueQueue(buildTokenAnnouncementQueue(input), options);
    },
    [enqueueQueue]
  );

  React.useEffect(() => {
    return () => {
      stopGlobalPlayback();
    };
  }, []);

  return {
    announceToken,
    enqueueQueue,
    stop,
  };
}
