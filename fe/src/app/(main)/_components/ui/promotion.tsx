interface Promotion {
    id: number;
    title: string;
    description: string;
    image: string;
    code: string;
  }
  
  interface PromotionSectionProps {
    promotions: Promotion[];
  }
  
  export default function PromotionSection({ promotions }: PromotionSectionProps) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Special Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo) => (
            <div 
              key={promo.id}
              className="rounded-xl overflow-hidden relative h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${promo.image})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 p-6 flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold">{promo.title}</h3>
                <p className="text-white text-sm mb-2">{promo.description}</p>
                <div className="flex items-center">
                  <span className="bg-primary text-white text-sm py-1 px-2 rounded-md">{promo.code}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }