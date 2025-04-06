export interface Food {
    id: string;
    description: string;
    image: string;
    imageUrls: string[];
    name: string;
    price: string;
    status: string;
    category: {
      id: string;
      name: string;
    };
    discountPercent: number;
    StarReview: string;
    purchasedNumber: string;
    restaurant: {
      id: string;
      name: string;
      deliveryTime?: string;
    };
  }