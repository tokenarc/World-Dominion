import { describe, it, expect, vi, beforeEach } from 'vitest';
import { haptics } from './haptics';

const mockHapticFeedback = {
  impactOccurred: vi.fn(),
  notificationOccurred: vi.fn(),
  selectionChanged: vi.fn(),
};

const mockTelegram = {
  WebApp: {
    HapticFeedback: mockHapticFeedback,
  },
};

describe('haptics utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window = { Telegram: mockTelegram } as any;
  });

  it('should call light impact haptic', () => {
    haptics.light();
    expect(mockHapticFeedback.impactOccurred).toHaveBeenCalledWith('light');
  });

  it('should call medium impact haptic', () => {
    haptics.medium();
    expect(mockHapticFeedback.impactOccurred).toHaveBeenCalledWith('medium');
  });

  it('should call heavy impact haptic', () => {
    haptics.heavy();
    expect(mockHapticFeedback.impactOccurred).toHaveBeenCalledWith('heavy');
  });

  it('should call success notification haptic', () => {
    haptics.success();
    expect(mockHapticFeedback.notificationOccurred).toHaveBeenCalledWith('success');
  });

  it('should call error notification haptic', () => {
    haptics.error();
    expect(mockHapticFeedback.notificationOccurred).toHaveBeenCalledWith('error');
  });

  it('should call selection haptic', () => {
    haptics.select();
    expect(mockHapticFeedback.selectionChanged).toHaveBeenCalled();
  });

  it('should not throw when Telegram not available', () => {
    global.window = {} as any;
    expect(() => haptics.light()).not.toThrow();
  });
});