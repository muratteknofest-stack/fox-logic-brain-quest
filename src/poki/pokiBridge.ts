// Poki SDK Bridge for Fox Logic: Brain Quest
// Official API reference: https://sdk.poki.com/

declare global {
  interface Window {
    PokiSDK?: {
      init: () => Promise<void>;
      gameLoadingFinished: () => void;
      gameplayStart: () => void;
      gameplayStop: () => void;
      commercialBreak: () => Promise<void>;
      rewardedBreak: () => Promise<boolean>;
      setDebug?: (debug: boolean) => void;
    };
  }
}

class PokiBridge {
  private isInitialized = false;
  private isAdPlaying = false;
  private adCounter = 0;

  async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        await window.PokiSDK.init();
        this.isInitialized = true;
        return true;
      } catch (err) {
        console.warn('PokiSDK init failed, using sandbox fallback:', err);
      }
    }

    // Sandbox / Local fallback mode
    this.isInitialized = true;
    return true;
  }

  gameLoadingFinished() {
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        window.PokiSDK.gameLoadingFinished();
      } catch {}
    }
  }

  gameplayStart() {
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        window.PokiSDK.gameplayStart();
      } catch {}
    }
  }

  gameplayStop() {
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        window.PokiSDK.gameplayStop();
      } catch {}
    }
  }

  // Interstitial ad triggered every 2-3 levels
  async commercialBreak(): Promise<void> {
    this.adCounter++;
    if (this.adCounter % 2 !== 0) {
      // Don't show an ad on every single level; Poki best practice is every 2-3 levels
      return;
    }

    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        this.isAdPlaying = true;
        this.gameplayStop();
        await window.PokiSDK.commercialBreak();
      } catch (err) {
        console.warn('Poki commercialBreak error:', err);
      } finally {
        this.isAdPlaying = false;
        this.gameplayStart();
      }
      return;
    }

    // Mock Commercial Break for local testing
    return new Promise((resolve) => {
      this.isAdPlaying = true;
      setTimeout(() => {
        this.isAdPlaying = false;
        resolve();
      }, 750);
    });
  }

  // Rewarded ad for hints or extra lives
  async rewardedBreak(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        this.isAdPlaying = true;
        this.gameplayStop();
        const success = await window.PokiSDK.rewardedBreak();
        return Boolean(success);
      } catch (err) {
        console.warn('Poki rewardedBreak error:', err);
        return false;
      } finally {
        this.isAdPlaying = false;
        this.gameplayStart();
      }
    }

    // Mock Rewarded Break for testing: always grants reward after short delay
    return new Promise((resolve) => {
      this.isAdPlaying = true;
      setTimeout(() => {
        this.isAdPlaying = false;
        resolve(true);
      }, 900);
    });
  }

  getAdState() {
    return {
      isAdPlaying: this.isAdPlaying,
      adCounter: this.adCounter,
    };
  }
}

export const poki = new PokiBridge();
