import './style.css';
import { Game } from './game/Game';
import { createUiRoot } from './ui';
import { initYandexSdk, notifyGameReady, notifyGameplayStart } from './yandex';

async function bootstrap(): Promise<void> {
  await initYandexSdk();

  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('Missing #app mount node');
  }

  const uiRoot = createUiRoot();
  app.appendChild(uiRoot);
  new Game(app, uiRoot);

  notifyGameReady();
  notifyGameplayStart();
}

void bootstrap();