import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PACK_COMPONENTS,
  SECTION_TITLES,
  findProduct,
  hasFlash,
  orderName,
  productPhotos,
  shopProducts,
  type ShopProduct,
} from "@/config/shop";
import {
  flashDetail,
  productDetails,
  type ProductDetail,
} from "@/config/shop-details";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductActions } from "@/components/shop/ProductActions";

// Solo existen las fichas del catálogo; cualquier otra dirección da 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return shopProducts.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = findProduct((await params).slug);
  if (!product) return {};
  return {
    title: orderName(product),
    description: product.description,
    alternates: { canonical: `/tienda/${product.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = findProduct((await params).slug);
  if (!product) notFound();
  const detail = productDetails[product.slug];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <nav aria-label="Ruta" className="text-sm text-cocoa">
        <Link href="/tienda" className="underline">
          ← Volver a la tienda
        </Link>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery photos={productPhotos(product)} />
        <div>
          <p className="u-eyebrow">K89 · {SECTION_TITLES[product.section]}</p>
          <h1 className="font-display mt-3 text-3xl md:text-4xl">
            {product.name}
          </h1>
          {product.label && (
            <p className="mt-2 text-sm text-cocoa">{product.label}</p>
          )}
          <p className="mt-5 text-lg">{product.description}</p>
          {detail && <p className="mt-3 text-cocoa">{detail.about}</p>}
          {product.contents && (
            <>
              <p className="u-eyebrow mt-6">Incluye</p>
              <ul className="mt-2">
                {product.contents.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          )}
          <ProductActions slug={product.slug} />
        </div>
      </div>

      {product.contents ? (
        <PackDetail pack={product} />
      ) : (
        detail && <SingleDetail detail={detail} />
      )}

      <p className="mt-14 border-t border-line pt-5 text-xs text-cocoa">
        Información resumida de las fichas de K89; el resultado puede variar
        según cada cabello. Lee la etiqueta antes de usar el producto. Si tienes
        irritación o dudas sobre tu cuero cabelludo, consulta con un
        profesional.
      </p>
    </div>
  );
}

function SingleDetail({ detail }: { detail: ProductDetail }) {
  return (
    <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-12">
      <div className="space-y-10">
        <Section title="Cómo funciona">
          <Actives detail={detail} />
        </Section>
        <Section title="Qué aporta">
          <Bullets items={detail.benefits} />
        </Section>
        <Section title="Para quién es">
          <Bullets items={detail.indicatedFor} />
        </Section>
      </div>
      <div>
        <Section title="Cómo usarlo, paso a paso">
          <Steps detail={detail} />
        </Section>
      </div>
    </div>
  );
}

function PackDetail({ pack }: { pack: ShopProduct }) {
  const parts = (PACK_COMPONENTS[pack.slug] ?? []).flatMap((slug) => {
    const product = findProduct(slug);
    const detail = productDetails[slug];
    return product && detail ? [{ product, detail }] : [];
  });
  const twoShampoos = pack.slug === "pack-volume-salt-flash";

  return (
    <div className="mt-14">
      <h2 className="font-display text-3xl">Cómo usar el pack, paso a paso</h2>
      <p className="mt-2 max-w-2xl text-sm text-cocoa">
        Aquí tienes cada producto del pack con su forma de uso.
        {twoShampoos &&
          " Este pack trae dos champús: pregunta en el salón cómo alternarlos."}
      </p>

      <ol className="mt-8">
        {parts.map(({ product, detail }) => (
          <li
            key={product.slug}
            className="grid gap-6 border-t border-line py-8 md:grid-cols-[10rem_1fr_1fr]"
          >
            <Link
              href={`/tienda/${product.slug}`}
              className="mx-auto block w-40 border border-line bg-white md:mx-0 md:self-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={orderName(product)}
                loading="lazy"
                className="aspect-square w-full object-contain"
              />
            </Link>
            <div>
              <h3 className="font-display text-2xl">{product.name}</h3>
              <p className="mt-1 text-xs text-cocoa">{product.label}</p>
              <p className="mt-3 text-sm">{detail.about}</p>
              <p className="u-eyebrow mt-4">Cómo funciona</p>
              <div className="mt-2">
                <Actives detail={detail} />
              </div>
              <Link
                href={`/tienda/${product.slug}`}
                className="mt-3 inline-block text-sm underline"
              >
                Ver ficha completa
              </Link>
            </div>
            <div>
              <p className="u-eyebrow mb-3">Pasos</p>
              <Steps detail={detail} />
            </div>
          </li>
        ))}
        {hasFlash(pack) && (
          <li className="grid gap-6 border-t border-line py-8 md:grid-cols-[10rem_1fr_1fr]">
            <div className="mx-auto block w-40 border border-line bg-white md:mx-0 md:self-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/productos/flash-repair-ampollas.jpg"
                alt="Caja de 8 ampollas Flash Repair Lotion"
                loading="lazy"
                className="aspect-square w-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-display text-2xl">Ampollas Flash Repair</h3>
              <p className="mt-1 text-xs text-cocoa">
                Flash Repair Lotion · el pack incluye 3 (la foto muestra la caja
                de 8)
              </p>
              <p className="mt-3 text-sm">{flashDetail.about}</p>
              <p className="u-eyebrow mt-4">Cómo funciona</p>
              <div className="mt-2">
                <Actives detail={flashDetail} />
              </div>
              <div className="mt-3">
                <Bullets items={flashDetail.benefits} />
              </div>
            </div>
            <div>
              <p className="u-eyebrow mb-3">Pasos</p>
              <Steps detail={flashDetail} />
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display border-b border-ink pb-2 text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Actives({ detail }: { detail: ProductDetail }) {
  return (
    <dl className="space-y-3 text-sm">
      {detail.actives.map((a) => (
        <div key={a.name}>
          <dt className="font-semibold">{a.name}</dt>
          <dd className="text-cocoa">{a.what}</dd>
        </div>
      ))}
    </dl>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Steps({ detail }: { detail: ProductDetail }) {
  return (
    <>
      <ol className="space-y-4">
        {detail.steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden
              className="u-mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-oat"
            >
              {i + 1}
            </span>
            <span className="text-sm leading-7">{step}</span>
          </li>
        ))}
      </ol>
      {detail.tip && (
        <p className="mt-5 border border-line bg-cream p-4 text-sm">
          {detail.tip}
        </p>
      )}
    </>
  );
}
