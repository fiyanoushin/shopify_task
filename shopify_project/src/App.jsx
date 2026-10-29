import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  "/product-api/customer/products/59bbc2b3-0ce0-45b6-91d6-efd1ecbb012f/";
const VENDOR_ID = "a9e3d24d-a2fe-4fbb-830f-91e0fee9f299";

function App() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(API_URL, {
          headers: { "x-vendor-id": VENDOR_ID },
        });
        if (!response.ok) throw new Error("Failed to load product");

        const result = await response.json();
        if (!result.data) throw new Error("Product data is missing");

        const item = result.data;
        setProduct(item);

        const variants = item.variants || [];
        const initial =
          variants.find((v) => v.is_primary) || variants[0] || null;

        setSelectedVariant(initial);
        setActiveImage(
          initial?.images?.[0]?.image ||
          item.images?.[0]?.image ||
          ""
        );
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, []);

  if (loading) return <div className="state">Loading product...</div>;
  if (error) return <div className="state">Unable to load product: {error}</div>;
  if (!product) return <div className="state">Product not found.</div>;

  const variants = product.variants || [];
  const attributes = selectedVariant?.attributes || [];
  const specifications = product.specifications || [];

  const getAttribute = (variant, name) =>
    variant?.attributes?.find(
      (a) => a.name?.toLowerCase() === name.toLowerCase()
    )?.value;

  const colors = [
    ...new Set(variants.map((v) => getAttribute(v, "Color")).filter(Boolean)),
  ];
  const sizes = [
    ...new Set(variants.map((v) => getAttribute(v, "Size")).filter(Boolean)),
  ];

  const productName =
    product.name ||
    product.title ||
    specifications.find((s) => s.name === "global.title_tag")?.value ||
    "Product Details";

  const images = [
    ...new Set(
      [
        ...(selectedVariant?.images || []).map((i) => i.image),
        ...variants.flatMap((v) => (v.images || []).map((i) => i.image)),
      ].filter(Boolean)
    ),
  ];

  const currentImage = images.includes(activeImage)
    ? activeImage
    : images[0] || "";

  const price = Number(
    selectedVariant?.actual_price ??
    selectedVariant?.price ??
    specifications.find((s) => s.name === "custom.total_price")?.value ??
    0
  );

  function chooseAttribute(name, value) {
    const nextAttributes = {
      Color: getAttribute(selectedVariant, "Color"),
      Size: getAttribute(selectedVariant, "Size"),
      [name]: value,
    };

    const matching = variants.find(
      (v) =>
        getAttribute(v, "Color") === nextAttributes.Color &&
        getAttribute(v, "Size") === nextAttributes.Size
    );

    if (matching) {
      setSelectedVariant(matching);
      setActiveImage(matching.images?.[0]?.image || "");
      setMessage("");
    }
  }

  function chooseColor(color) {
    const size = getAttribute(selectedVariant, "Size");
    const match =
      variants.find(
        (v) =>
          getAttribute(v, "Color") === color &&
          getAttribute(v, "Size") === size &&
          v.stock > 0
      ) ||
      variants.find(
        (v) =>
          getAttribute(v, "Color") === color &&
          getAttribute(v, "Size") === size
      ) ||
      variants.find((v) => getAttribute(v, "Color") === color);

    if (match) {
      setSelectedVariant(match);
      setActiveImage(match.images?.[0]?.image || "");
      setMessage("");
    }
  }

  function chooseSize(size) {
    const color = getAttribute(selectedVariant, "Color");
    const match = variants.find(
      (v) =>
        getAttribute(v, "Color") === color &&
        getAttribute(v, "Size") === size
    );

    if (match) {
      setSelectedVariant(match);
      setActiveImage(match.images?.[0]?.image || "");
      setMessage("");
    }
  }

  const available = Number(selectedVariant?.stock || 0) > 0;

  function addToCart() {
    if (!selectedVariant) {
      setMessage("Please select a product variant.");
    } else if (!available) {
      setMessage("Sorry, this variant is currently out of stock.");
    } else {
      setMessage(`Added ${quantity} item(s) to your cart.`);
    }
  }

  return (
    <main className="page">
      <div className="product-layout">
        <section className="gallery">
          <div className="main-image">
            {currentImage ? (
              <img src={currentImage} alt={productName} />
            ) : (
              <div className="placeholder">No image available</div>
            )}
          </div>

          <div className="thumbnails">
            {images.map((image) => (
              <button
                key={image}
                className={image === currentImage ? "thumbnail active" : "thumbnail"}
                onClick={() => setActiveImage(image)}
                aria-label="View product image"
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </section>

        <section className="details">
          <p className="eyebrow">JEWELLERY COLLECTION</p>
          <h1>{productName}</h1>
          <p className="sku">
            SKU: {selectedVariant?.sku || "N/A"}
          </p>

          <div className="price">
            ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>

          <p className={available ? "stock in-stock" : "stock out-stock"}>
            {available ? "In stock" : "Currently out of stock"}
          </p>

          {colors.length > 0 && (
            <div className="option">
              <h3>Color: {getAttribute(selectedVariant, "Color") || "Select"}</h3>
              <div className="choices">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => chooseColor(color)}
                    className={
                      color === getAttribute(selectedVariant, "Color")
                        ? "choice selected"
                        : "choice"
                    }
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="option">
              <h3>Size: {getAttribute(selectedVariant, "Size") || "Select"}</h3>
              <div className="choices">
                {sizes.map((size) => {
                  const matching = variants.find(
                    (v) =>
                      getAttribute(v, "Color") ===
                        getAttribute(selectedVariant, "Color") &&
                      getAttribute(v, "Size") === size
                  );

                  return (
                    <button
                      key={size}
                      disabled={!matching}
                      onClick={() => chooseSize(size)}
                      className={
                        size === getAttribute(selectedVariant, "Size")
                          ? "choice selected"
                          : "choice"
                      }
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="option">
            <h3>Quantity</h3>
            <div className="quantity">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button className="add-button" onClick={addToCart}>
            Add to Cart
          </button>
          {message && <p className="feedback">{message}</p>}

          {product.description && (
            <div className="description">
              <h2>Description</h2>
              <p>
                {typeof product.description === "string"
                  ? product.description.replace(/<[^>]*>/g, " ").trim()
                  : "Explore the details of this product."}
              </p>
            </div>
          )}

          <div className="specifications">
            <h2>Product Specifications</h2>
            {specifications
              .filter((spec) => spec.name?.startsWith("custom."))
              .map((spec) => (
                <div className="spec-row" key={spec.id || spec.name}>
                  <span>
                    {spec.name.replace("custom.", "").replaceAll("_", " ")}
                  </span>
                  <span>{spec.value || "—"}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;

