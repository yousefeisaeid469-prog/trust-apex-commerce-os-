import { getProduct } from '../repository/catalog';
export async function answerProductQuestion(productId:string,question:string){
  const product=await getProduct(productId); if(!product) throw new Error('PRODUCT_NOT_FOUND');
  const q=question.trim().toLowerCase();
  if(!q) throw new Error('QUESTION_REQUIRED');
  if(/price|سعر|السعر/.test(q)) return {productId,answer:`السعر الحالي ${product.price}، ولا يتم اختلاق سعر غير موجود في الكتالوج.`,evidence:{price:product.price},mode:'CATALOG_FACT'};
  if(/stock|available|متاح|مخزون/.test(q)) return {productId,answer:product.stock>0?'المنتج متاح حاليًا.':'المنتج غير متاح حاليًا.',evidence:{stock:product.stock},mode:'CATALOG_FACT'};
  if(/rating|review|تقييم/.test(q)) return {productId,answer:`التقييم المسجل حاليًا ${product.rating}/5.`,evidence:{rating:product.rating},mode:'CATALOG_FACT'};
  if(/category|نوع|تصنيف/.test(q)) return {productId,answer:`التصنيف المسجل: ${product.category}.`,evidence:{category:product.category},mode:'CATALOG_FACT'};
  return {productId,answer:'لا أملك معلومة موثقة عن هذا السؤال من بيانات المنتج الحالية.',evidence:{name:product.name,category:product.category,tags:product.tags},mode:'GROUNDED_NO_ANSWER'};
}
