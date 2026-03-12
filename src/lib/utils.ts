import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getProductImage = (product: any) => {
  if (product.image_url) return product.image_url;

  // Fixed images for the demo products
  const specificImages: any = {
    'Wireless Keyboard': 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=400',
    'USB-C Hub (7-in-1)': 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=400',
    'Ergonomic Mouse': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=400',
    'Standing Desk Mat': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=400',
    'Monitor Arm': 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=400',
    'Notebook (A5, 3-pack)': 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=400',
    'Webcam HD 1080p': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400',
    'Cable Management Kit': 'https://images.unsplash.com/photo-1558864559-ed673ba3610b?auto=format&fit=crop&q=80&w=400',
  };

  if (specificImages[product.name]) return specificImages[product.name];

  // Fallback using picsum for consistency per-product
  let hash = 0;
  const nameStr = product.name || 'product';
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);
  return `https://picsum.photos/seed/${seed}/400/300`;
};
