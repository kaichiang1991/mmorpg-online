import { createRoot } from 'react-dom/client';
import { App } from './App';
// Registers the LayoutSystem extension and Container mixins. Yoga itself is
// loaded by LayoutSystem during app.init() — no `container.layout = ...` may
// run before that (a second loadYoga() here would create a separate wasm
// instance and split the layout tree across two heaps).
import '@pixi/layout';

createRoot(document.getElementById('root')!).render(<App />);
