export const haptics = {
  light: () => {
    try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light') } catch(e) {}
  },
  medium: () => {
    try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium') } catch(e) {}
  },
  heavy: () => {
    try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy') } catch(e) {}
  },
  success: () => {
    try { (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success') } catch(e) {}
  },
  error: () => {
    try { (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error') } catch(e) {}
  },
  select: () => {
    try { (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged() } catch(e) {}
  }
}
