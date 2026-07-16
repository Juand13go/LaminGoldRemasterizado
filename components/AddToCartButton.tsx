import { addToCartAction } from "@/app/actions/cart";

export function AddToCartButton({ productId }: { productId: string }) {
  return (
    <form action={addToCartAction} className="add-to-cart">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="qty" value="1" />
      <button className="btn" type="submit">
        Agregar al carrito
      </button>
    </form>
  );
}
