export {};

declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

export interface NationType {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
}

export const NATIONS: NationType[] = [
  {
    id: 'technocracy',
    name: 'THE TECHNOCRACY',
    description: 'Advance through technological supremacy and scientific innovation.',
    emoji: '🏛️',
    color: '#00BFFF'
  },
  {
    id: 'warlords',
    name: 'THE WARLORDS',
    description: 'Dominate through military might and strategic conquest.',
    emoji: '⚔️',
    color: '#FF4444'
  },
  {
    id: 'merchants',
    name: 'THE MERCHANTS',
    description: 'Accumulate wealth through trade, economics, and market control.',
    emoji: '💰',
    color: '#FFD700'
  }
];
