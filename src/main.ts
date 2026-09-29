import './style.css';
import { TowerGame } from './tower/TowerGame';
import { createUiRoot } from './ui';

function bootstrap(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('Missing #app mount node');
  }

  const uiRoot = createUiRoot();
  app.appendChild(uiRoot);
  new TowerGame(app, uiRoot);
}

bootstrap();
