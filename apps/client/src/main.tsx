import { createRoot } from 'react-dom/client';
import { setYoga } from '@pixi/layout';
import { loadYoga } from 'yoga-layout/load';
import { App } from './App';
import '@pixi/layout';

// @pixi/layout leaves yoga unset until the app provides it; any `container.layout = ...`
// before this throws "Cannot read properties of undefined (reading 'Node')".
loadYoga().then((yoga) => {
  setYoga(yoga);
  createRoot(document.getElementById('root')!).render(<App />);
});
