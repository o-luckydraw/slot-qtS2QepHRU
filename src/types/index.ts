// src/types/index.ts
export interface SiteTheme {
  fontFamily: string;
  bgImageUrl: string;
  boxBgColor: string;
  boxPadding: string;
  boxRadius: string;
  buttonBgColor: string;  
  buttonTextColor: string;
  buttonRadius: string;   
  highBgColor: string;    
  highTextColor: string;  
  adminLinkColor: string;
}

export interface SiteConfig {
  siteId: string;
  adminEmail: string;
  theme: SiteTheme;
}

export interface Prize {
  id: string;
  rank: number;
  name: string;
  quantity: number;
  remaining: number;
  requiresShipping?: boolean;
}

export interface ShippingInfo {
  id?: string;
  prizeId?: string;
  prizeName?: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string | Date;
}