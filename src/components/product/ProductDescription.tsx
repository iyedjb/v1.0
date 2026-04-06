import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Product } from "@/hooks/use-products";
import { Star } from "lucide-react";

interface ProductDescriptionProps {
  product?: Product;
}

const ProductDescription = ({ product }: ProductDescriptionProps) => {
  if (!product) return null;

  return (
    <div className="mt-8 lg:mt-16 w-full max-w-4xl mx-auto px-4 lg:px-0">
      <Accordion type="single" collapsible className="w-full border-t border-black/10">
        {product.description && (
          <AccordionItem value="description" className="border-b border-black/10">
            <AccordionTrigger className="text-[10px] font-black uppercase tracking-[0.3em] py-6 hover:no-underline text-black/90">
              Description
            </AccordionTrigger>
            <AccordionContent className="text-[13px] font-medium leading-relaxed text-black/60 pb-8">
              {product.description}
            </AccordionContent>
          </AccordionItem>
        )}

        {product.productDetails && (
          <AccordionItem value="details" className="border-b border-black/10">
            <AccordionTrigger className="text-[10px] font-black uppercase tracking-[0.3em] py-6 hover:no-underline text-black/90">
              Product Details
            </AccordionTrigger>
            <AccordionContent className="text-[13px] font-medium leading-relaxed text-black/60 pb-8">
              <div className="whitespace-pre-line">
                {product.productDetails}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {product.careCleaning && (
          <AccordionItem value="care" className="border-b border-black/10">
            <AccordionTrigger className="text-[10px] font-black uppercase tracking-[0.3em] py-6 hover:no-underline text-black/90">
              Care & Cleaning
            </AccordionTrigger>
            <AccordionContent className="text-[13px] font-medium leading-relaxed text-black/60 pb-8">
              {product.careCleaning}
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="reviews" className="border-b border-black/10">
          <AccordionTrigger className="text-[10px] font-black uppercase tracking-[0.3em] py-6 hover:no-underline text-black/90">
            <div className="flex items-center gap-4">
              <span>Customer Reviews</span>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                  ))}
                  <Star className="w-2.5 h-2.5 fill-black/10 text-black/10" />
                </div>
                <span className="text-[10px] font-bold text-black/40 ml-1">4.8</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-[13px] font-medium leading-relaxed text-black/60 pb-8">
            <div className="space-y-4">
              <p className="italic">Ainda não há avaliações para este produto. Seja o primeiro a avaliar.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductDescription;
