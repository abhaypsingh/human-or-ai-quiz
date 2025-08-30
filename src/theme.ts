export type ThemeTokens = {
  palette?: { bg?: string; surface?: string; text?: string; accent?: string; accent2?: string };
  radius?: string;
  border?: string;
  shadowButton?: string;
  typography?: {
    ui?: string;
    scale?: { h1?: string; body?: string };
  };
  anim?: { enter?: string; ctaHover?: string };
  ctaStyle?: string;
};

export function applyThemeTokens(tokens: ThemeTokens, root: HTMLElement = document.documentElement) {
  const p = tokens?.palette || {};
  if (p.bg) root.style.setProperty('--bg', p.bg);
  if (p.surface) root.style.setProperty('--surface', p.surface);
  if (p.text) root.style.setProperty('--text', p.text);
  if (p.accent) root.style.setProperty('--accent', p.accent);
}