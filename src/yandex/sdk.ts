import type { SDK } from 'ysdk';

let ysdk: SDK | null = null;
let missingSdkLogged = false;

function logMissingSdkOnce(): void {
  if (missingSdkLogged) {
    return;
  }
  missingSdkLogged = true;
  console.info('[Маятник] Yandex Games SDK недоступен — реклама пропускается (локальный запуск).');
}

async function waitForYaGames(timeoutMs: number): Promise<typeof YaGames | null> {
  if (typeof YaGames !== 'undefined') {
    return YaGames;
  }

  return new Promise((resolve) => {
    const started = performance.now();
    const tick = (): void => {
      if (typeof YaGames !== 'undefined') {
        resolve(YaGames);
        return;
      }
      if (performance.now() - started >= timeoutMs) {
        resolve(null);
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export async function initYandexSdk(): Promise<SDK | null> {
  const yaGames = await waitForYaGames(12_000);
  if (!yaGames) {
    logMissingSdkOnce();
    return null;
  }

  try {
    ysdk = await yaGames.init();
    return ysdk;
  } catch (error) {
    if (!missingSdkLogged) {
      missingSdkLogged = true;
      console.info('[Маятник] Не удалось инициализировать Yandex Games SDK.', error);
    }
    return null;
  }
}

export function getYandexSdk(): SDK | null {
  return ysdk;
}

export function notifyGameReady(): void {
  ysdk?.features.LoadingAPI?.ready();
}

export function notifyGameplayStart(): void {
  ysdk?.features.GameplayAPI?.start();
}

export function notifyGameplayStop(): void {
  ysdk?.features.GameplayAPI?.stop();
}

export function showGameOverInterstitial(): Promise<void> {
  const sdk = ysdk;
  if (!sdk) {
    return Promise.resolve();
  }

  notifyGameplayStop();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    try {
      sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            notifyGameplayStop();          },
          onClose: () => {
            finish();
          },
          onError: () => {
            finish();
          },
          onOffline: () => {
            finish();
          },
        },
      });
    } catch {
      finish();
    }
  });
}