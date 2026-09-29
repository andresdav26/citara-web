import { startHeroFlow, type HeroFlowState } from './hero-flow';

// Lado del worker de components/HeroFlow.tsx: dibuja las cuerdas del hero en el lienzo que le cedió la página.

declare const self: {
  onmessage: ((event: MessageEvent<{ canvas?: OffscreenCanvas; state: HeroFlowState }>) => void) | null;
  postMessage(message: 'ready' | 'lost'): void;
};

let flow: ReturnType<typeof startHeroFlow> = null;

self.onmessage = ({ data }) => {
  if (data.canvas) flow = startHeroFlow(data.canvas, data.state, () => self.postMessage('ready'), () => self.postMessage('lost'));
  else flow?.update(data.state);
};
