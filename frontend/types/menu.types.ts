export interface MenuItemModifierOption {
  name: string;
  price: number; // in paise
}

export interface MenuItemModifierGroup {
  name: string;
  minSelections?: number;
  maxSelections?: number;
  options: MenuItemModifierOption[];
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  name: string;
  description?: string;
  category: string;
  price: number; // in paise
  images: string[];
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime?: number; // in minutes
  calories?: number;
  tags?: string[];
  modifierGroups?: MenuItemModifierGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}
