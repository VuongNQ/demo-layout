import type { ThemeConfig } from 'antd';

// Single source of truth for color in this sketch. Nothing else in this
// project may hardcode a hex value — reference AntD's token system instead
// (useToken(), or ConfigProvider's theme prop below).
//
// `colorPrimary` here is Ant Design 5's own default. It is a stand-in: the
// real HDS Admin brand color has not been decided for this sketch, and this
// repo must not guess or encode one.
export const themeTokens: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff'
  }
};
