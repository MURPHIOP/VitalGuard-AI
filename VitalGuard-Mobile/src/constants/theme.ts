export const theme = {
  colors: {
    bgBase: "#060B14",
    bgDeep: "#02050C",
    bgCard: "rgba(16, 28, 44, 0.58)",
    bgCardStrong: "rgba(18, 32, 50, 0.84)",
    borderSoft: "rgba(176, 214, 255, 0.2)",
    borderStrong: "rgba(196, 228, 255, 0.36)",
    textPrimary: "#F1F7FF",
    textSecondary: "#B2C4DC",
    textMuted: "#7E92AF",
    normal: "#34D2AA",
    normalDark: "#149C79",
    empty: "#69CCFF",
    emptyDark: "#2B84CD",
    fall: "#FF6177",
    fallDark: "#A9253D",
    success: "#35DA99",
    warning: "#F5AF69",
    error: "#FF6177",
    overlay: "rgba(0, 0, 0, 0.36)",
    emergencyOverlay: "rgba(167, 24, 49, 0.24)",
    chartMoving: "#42E3BB",
    chartStationary: "#8DD2FF",
    chartGlow: "rgba(92, 208, 255, 0.34)",
    shadow: "#000000"
  },
  gradients: {
    screenBase: ["#091528", "#070F1B", "#050A13", "#04070E"] as const,
    card: ["rgba(184, 225, 255, 0.18)", "rgba(22, 34, 52, 0.52)", "rgba(14, 22, 35, 0.82)"] as const,
    hero: ["rgba(100, 175, 255, 0.22)", "rgba(20, 36, 60, 0.24)", "rgba(11, 18, 29, 0.14)"] as const,
    emergency: ["rgba(255, 102, 128, 0.3)", "rgba(166, 33, 59, 0.16)", "rgba(12, 12, 20, 0.06)"] as const,
    buttonPrimary: ["#35CFA9", "#1E8D72"] as const,
    buttonDanger: ["#FF7588", "#A02843"] as const
  },
  blur: {
    soft: 28,
    medium: 48,
    intense: 72
  },
  typography: {
    h1: 36,
    h2: 28,
    h3: 22,
    title: 19,
    body: 15,
    label: 13,
    caption: 11,
    weights: {
      regular: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    pill: 999
  },
  shadows: {
    glowSoft: {
      shadowColor: "#7ED6FF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.34,
      shadowRadius: 16,
      elevation: 6
    },
    glowAlert: {
      shadowColor: "#FF6177",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.48,
      shadowRadius: 20,
      elevation: 9
    },
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 26,
      elevation: 14
    }
  },
  motion: {
    fast: 180,
    normal: 320,
    slow: 560,
    spring: {
      damping: 18,
      stiffness: 170,
      mass: 0.75
    }
  }
};

export type Theme = typeof theme;
