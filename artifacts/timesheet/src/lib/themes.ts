export type ThemeId = "workday" | "sap-fiori" | "sap-ecc" | "oracle-fusion";

export interface AppTheme {
  id: ThemeId;
  name: string;
  headerBg: string;
  headerText: string;
  headerSubText: string;
  bodyBg: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryLightBorder: string;
  breadcrumbText: string;
  sectionHeaderBg: string;
  tableHeaderBg: string;
}

export const THEMES: Record<ThemeId, AppTheme> = {
  workday: {
    id: "workday",
    name: "Workday",
    headerBg: "#e07800",
    headerText: "#ffffff",
    headerSubText: "#fde68a",
    bodyBg: "#f5f5f5",
    primary: "#e07800",
    primaryHover: "#c96900",
    primaryLight: "#fff7ed",
    primaryLightBorder: "rgba(224,120,0,0.3)",
    breadcrumbText: "#e07800",
    sectionHeaderBg: "#f8f8f8",
    tableHeaderBg: "#f8f8f8",
  },
  "sap-fiori": {
    id: "sap-fiori",
    name: "SAP Fiori",
    headerBg: "#354a5e",
    headerText: "#ffffff",
    headerSubText: "#a0aec0",
    bodyBg: "#f2f2f2",
    primary: "#0070f2",
    primaryHover: "#0050b3",
    primaryLight: "#e8f4ff",
    primaryLightBorder: "rgba(0,112,242,0.3)",
    breadcrumbText: "#0070f2",
    sectionHeaderBg: "#f7f7f7",
    tableHeaderBg: "#f7f7f7",
  },
  "sap-ecc": {
    id: "sap-ecc",
    name: "SAP ECC (SAP GUI)",
    headerBg: "#1e5fa8",
    headerText: "#ffffff",
    headerSubText: "#8fa3b3",
    bodyBg: "#f0f4f8",
    primary: "#0054a6",
    primaryHover: "#003f7d",
    primaryLight: "#e3f0ff",
    primaryLightBorder: "rgba(0,84,166,0.3)",
    breadcrumbText: "#0054a6",
    sectionHeaderBg: "#dce3ec",
    tableHeaderBg: "#dce3ec",
  },
  "oracle-fusion": {
    id: "oracle-fusion",
    name: "Oracle Fusion Cloud HCM",
    headerBg: "#312d2a",
    headerText: "#ffffff",
    headerSubText: "#c0b8b0",
    bodyBg: "#f4f4f4",
    primary: "#c74634",
    primaryHover: "#a53828",
    primaryLight: "#fff1f0",
    primaryLightBorder: "rgba(199,70,52,0.3)",
    breadcrumbText: "#c74634",
    sectionHeaderBg: "#faf9f9",
    tableHeaderBg: "#f4f4f4",
  },
};

export const THEME_LIST: AppTheme[] = Object.values(THEMES);

export function loadTheme(): ThemeId {
  try {
    const saved = localStorage.getItem("app-theme");
    if (saved && saved in THEMES) return saved as ThemeId;
  } catch {}
  return "workday";
}

export function saveTheme(id: ThemeId) {
  try { localStorage.setItem("app-theme", id); } catch {}
}
