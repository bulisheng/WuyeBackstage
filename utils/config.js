const ENV_CONFIG = {
  dev: {
    apiBaseUrl: 'http://192.168.5.4:8080/api/v1',
    openclawMode: 'local',
    openclawLocalBaseUrl: 'http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain',
    openclawRemoteBaseUrl: 'https://openclaw.example.com',
    openclawBaseUrl: 'http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain'
  },
  test: {
    apiBaseUrl: 'https://test-api.example.com/api/v1',
    openclawMode: 'remote',
    openclawLocalBaseUrl: 'http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain',
    openclawRemoteBaseUrl: 'https://openclaw.example.com',
    openclawBaseUrl: 'https://openclaw.example.com'
  },
  prod: {
    apiBaseUrl: 'https://api.yourdomain.com/api/v1',
    openclawMode: 'remote',
    openclawLocalBaseUrl: 'http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain',
    openclawRemoteBaseUrl: 'https://openclaw.example.com',
    openclawBaseUrl: 'https://openclaw.example.com'
  }
};

const DEFAULT_ENV = 'dev';

function getStoredDevApiBaseUrl() {
  try {
    const saved = wx.getStorageSync('devApiBaseUrl');
    if (saved && typeof saved === 'string') {
      return saved.trim();
    }
  } catch (e) {
    // ignore storage errors in non-mini-program environments
  }
  return '';
}

function getRuntimeEnv() {
  try {
    const saved = wx.getStorageSync('runtimeEnv');
    if (saved && ENV_CONFIG[saved]) {
      return saved;
    }
  } catch (e) {
    // ignore storage errors in non-mini-program environments
  }
  return DEFAULT_ENV;
}

function getRuntimeConfig() {
  const runtimeEnv = getRuntimeEnv();
  const baseConfig = ENV_CONFIG[runtimeEnv] || ENV_CONFIG[DEFAULT_ENV];
  if (runtimeEnv === 'dev') {
    const storedDevApiBaseUrl = getStoredDevApiBaseUrl();
    if (storedDevApiBaseUrl) {
      return Object.assign({}, baseConfig, { apiBaseUrl: storedDevApiBaseUrl });
    }
  }
  return baseConfig;
}

module.exports = {
  ENV_CONFIG,
  DEFAULT_ENV,
  getStoredDevApiBaseUrl,
  getRuntimeEnv,
  getRuntimeConfig
};
