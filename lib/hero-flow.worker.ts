import { startHeroFlow, type HeroFlowState } from './hero-flow';

// Worker side of components/HeroFlow.tsx: draws the hero background on the canvas the page handed over.

declare const self: {
  onmessage: ((event: MessageEvent<{ canvas?: OffscreenCanvas; state: HeroFlowState }>) => void) | null;
  postMessage(message: 'ready' | 'lost'): void;
};

let flow: ReturnType<typeof startHeroFlow> = null;

self.onmessage = ({ data }) => {
  if (data.canvas) flow = startHeroFlow(data.canvas, data.state, () => self.postMessage('ready'), () => self.postMessage('lost'));
  else flow?.update(data.state);
};
