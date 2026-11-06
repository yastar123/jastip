import { type Service } from "./services";
import { type Shipment } from "./tracking";

export interface HeroContent {
  badge: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  description: string;
  trackButtonText: string;
  contactButtonText: string;
  stats: Array<{ number: string; label: string }>;
}

export interface StepItem {
  no: string;
  title: string;
  text: string;
}

export interface FeatureItem {
  iconName: "ShieldCheck" | "Wallet" | "ScanBarcode" | "Headset";
  title: string;
  text: string;
}

export interface CtaBannerContent {
  title: string;
  text: string;
  buttonText: string;
}

export interface HomeCMSContent {
  hero: HeroContent;
  heroImage?: string;
  portImage?: string;
  steps: StepItem[];
  features: FeatureItem[];
  cta: CtaBannerContent;
  citiesReach: string[];
}

export interface LayananPageCMSContent {
  headerBadge: string;
  headerTitle: string;
  headerDescription: string;
  headerImage?: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonText: string;
}

export interface LacakPageCMSContent {
  headerBadge: string;
  headerTitle: string;
  headerDescription: string;
  cardDisclaimer: string;
  demoBoxTitle: string;
  demoBoxDescription: string;
  invoiceNotice: string;
  emptyNoticeTitle: string;
  emptyNoticeText: string;
}

export interface KontakPageCMSContent {
  headerBadge: string;
  headerTitle: string;
  headerDescription: string;
  warehouseCardTitle: string;
  warehouseImage?: string;
  hoursCardTitle: string;
  waCardTitle: string;
  waCardDesc: string;
  infoBox1Title: string;
  infoBox1Text: string;
  infoBox2Title: string;
  infoBox2Text: string;
  infoBox2ButtonText: string;
}

export interface SiteInfoContent {
  name: string;
  tagline: string;
  cities: string;
  address: string;
  whatsapp: string;
  hours: string;
  waMessage: string;
  footerCopyright: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface AppCMSData {
  site: SiteInfoContent;
  home: HomeCMSContent;
  layananPage: LayananPageCMSContent;
  lacakPage: LacakPageCMSContent;
  kontakPage: KontakPageCMSContent;
  services: Service[];
  shipments: Shipment[];
}
