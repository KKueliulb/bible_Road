const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 웹용 폰트를 woff2로 서빙하기 위해 기본 asset 확장자 목록에 추가 (기본값엔 ttf만 있음).
config.resolver.assetExts.push('woff2');

module.exports = config;
