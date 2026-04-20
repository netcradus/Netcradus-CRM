let audioContext = null;
let lastPlayedAt = 0;
let unlockBound = false;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function createFallbackAudio() {
  if (typeof window === "undefined") return null;

  try {
    const audio = new window.Audio(
      "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAAAAAP//AAD//wAA//8AAP//AAD//wAA"
    );
    audio.preload = "auto";
    audio.volume = 1;
    return audio;
  } catch (error) {
    return null;
  }
}

function unlockAudio() {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    context.resume().catch(() => {});
  }
}

export function initializeNotificationSound() {
  if (typeof window === "undefined" || unlockBound) return;

  unlockBound = true;
  const unlockOnce = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
    window.removeEventListener("touchstart", unlockOnce);
  };

  window.addEventListener("pointerdown", unlockOnce, { passive: true });
  window.addEventListener("keydown", unlockOnce, { passive: true });
  window.addEventListener("touchstart", unlockOnce, { passive: true });
}

export async function playNotificationSound() {
  const context = getAudioContext();
  const fallbackAudio = createFallbackAudio();
  if (!context && !fallbackAudio) return false;

  const now = Date.now();
  if (now - lastPlayedAt < 800) {
    return false;
  }
  lastPlayedAt = now;

  try {
    if (context?.state === "suspended") {
      await context.resume();
    }

    if (context && context.state === "running") {
      const startAt = context.currentTime;
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.35, startAt + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.18, startAt + 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.62);
      gainNode.connect(context.destination);

      [880, 1174, 1318, 1567].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const noteStart = startAt + index * 0.1;
        oscillator.type = index < 2 ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        oscillator.connect(gainNode);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.2);
      });

      return true;
    }

    if (fallbackAudio) {
      fallbackAudio.currentTime = 0;
      await fallbackAudio.play();
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
