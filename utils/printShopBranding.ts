import { ShopSettings } from "../services/ShopSettings/fetchShopSettings";

export interface PrintShopBranding {
  shopName: string;
  logo?: string;
  phone?: string;
  address?: string;
  website?: string;
  currency: string;
}

export const DEFAULT_SHOP_BRANDING: PrintShopBranding = {
  shopName: "OceanBlue",
  logo: "/logo.png",
  phone: "+959420190123",
  address: "10(A), Aung Mingala Street, Mingaladon, Yangon",
  website: "www.oceanblue.com.mm",
  currency: "MMK",
};

export const getPrintShopBranding = (
  settings?: ShopSettings | null,
): PrintShopBranding => ({
  shopName: settings?.shopName || DEFAULT_SHOP_BRANDING.shopName,
  logo: settings?.logo || DEFAULT_SHOP_BRANDING.logo,
  phone: settings?.phoneNumber || DEFAULT_SHOP_BRANDING.phone,
  address: settings?.address || DEFAULT_SHOP_BRANDING.address,
  website: settings?.socialMedia?.website || DEFAULT_SHOP_BRANDING.website,
  currency: settings?.currency || DEFAULT_SHOP_BRANDING.currency,
});

export const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
