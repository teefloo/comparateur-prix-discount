#!/usr/bin/env python3
"""
Aldi France Scraper - Category Based with Pagination
Scrapes all categories and subcategories with full pagination
"""

import asyncio
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Page, Browser, BrowserContext


ALDI_BASE_URL = "https://www.aldi.fr"
OUTPUT_DIR = Path(__file__).parent.parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


@dataclass
class Product:
    name: str
    price: float
    url: str
    category: str
    subcategory: str = ""
    brand: str = ""
    image: str = ""
    original_price: Optional[float] = None
    quantity: str = ""
    promotion: str = ""
    discount_percent: Optional[int] = None

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if v}


class AldiScraper:
    # 12 main categories from Aldi
    CATEGORIES = [
        ("alimentation", "viande-poisson", "Viandes et poissons"),
        ("alimentation", "produits-laitiers", "Produits laitiers et œufs"),
        ("alimentation", "charcuterie", "Charcuterie et traiteur"),
        ("alimentation", "epicerie-salee", "Épicerie salée"),
        ("alimentation", "epicerie-sucree", "Épicerie sucrée"),
        ("alimentation", "pain-viennoiserie", "Pains et viennoiseries"),
        ("alimentation", "surgeles", "Produits surgelés"),
        ("alimentation", "boissons", "Boissons sans alcool"),
        ("hygiene", "hygiene-beaute-bebe", "Hygiène, beauté et produits bébé"),
        ("menage", "entretien", "Entretien et nettoyage"),
        ("alimentation", "biere-vin-alcool", "Bières, vins et spiritueux"),
        ("alimentation", "animalerie", "Animalerie"),
    ]

    # MaximumVOIR PLUS clicks - set high to get ALL products
    MAX_CLICKS = 50

    CATEGORY_KEYWORDS = {
        "hygiene": [
            "shampooing",
            "savon",
            "dentifrice",
            "hygiene",
            "beaute",
            "creme",
            "brosse",
            "rasoir",
        ],
        "menage": [
            "lessive",
            "nettoyant",
            "detergent",
            "vitre",
            "entretien",
            "liquide",
            "gel",
        ],
        "alimentation": [
            "eau",
            "soda",
            "yaourt",
            "fromage",
            "viande",
            "poisson",
            "pain",
            "pate",
            "riz",
        ],
    }

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.products: list[Product] = []
        self.total_clicks = 0

    async def init_browser(self):
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            locale="fr-FR",
            viewport={"width": 1920, "height": 1080},
        )
        self.page = await self.context.new_page()
        self.page.set_default_timeout(30000)
        return playwright

    async def close_browser(self, playwright):
        if self.browser:
            await self.browser.close()
        if playwright:
            await playwright.stop()

    async def accept_cookies(self):
        try:
            btn = await self.page.query_selector(
                'button:has-text("Accepter"), button[data-testid="uc-accept-all-button"]'
            )
            if btn:
                await btn.click()
                await asyncio.sleep(0.5)
        except Exception:
            pass

    def classify_category(self, text: str) -> str:
        text = text.lower()
        for cat, keywords in self.CATEGORY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                return cat
        return "alimentation"

    def extract_price(self, text: str) -> Optional[float]:
        if not text:
            return None
        cleaned = text.strip().replace(" ", "").replace(",", ".")
        match = re.search(r"(\d+[.,]?\d*)", cleaned)
        if match:
            try:
                return float(match.group(1).replace(",", "."))
            except ValueError:
                pass
        return None

    async def get_subcategories(self, category_path: str) -> list[tuple]:
        """Get all subcategory URLs from a category page"""
        url = f"{ALDI_BASE_URL}/produits/{category_path}.html"

        subcategories = []

        try:
            await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)
            await self.accept_cookies()

            links = await self.page.evaluate(f"""
                () => {{
                    const baseUrl = '{ALDI_BASE_URL}';
                    const categoryPath = '{category_path}';
                    const links = Array.from(document.querySelectorAll('a[href*="/produits/"]'));
                    const subcats = [];
                    const seen = new Set();
                    
                    links.forEach(link => {{
                        const href = link.getAttribute('href');
                        if (!href) return;
                        
                        if (href.includes('/produits/' + categoryPath + '/') && href.endsWith('.html')) {{
                            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
                            if (!seen.has(fullUrl)) {{
                                seen.add(fullUrl);
                                const name = link.textContent?.trim() || '';
                                if (name && name.length > 2 && name.length < 50) {{
                                    subcats.push([name, fullUrl]);
                                }}
                            }}
                        }}
                    }});
                    
                    return subcats;
                }}
            """)

            if links:
                subcategories = links
            else:
                subcategories = [(category_path, url)]

        except Exception as e:
            subcategories = [(category_path, url)]

        return subcategories

    async def scrape_with_pagination(
        self, url: str, category: str, subcategory: str
    ) -> list[Product]:
        """Scrape a page - clicks VOIR PLUS until no more products"""
        products = []
        seen_urls = set()
        last_count = 0
        consecutive_no_new = 0

        try:
            await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)
            await self.accept_cookies()

            while self.total_clicks < self.MAX_CLICKS:
                # Extract products currently visible
                data = await self.page.evaluate("""
                    () => {
                        const tiles = Array.from(document.querySelectorAll('.product-tile'));
                        return tiles.map(tile => {
                            const link = tile.querySelector('.product-tile__action');
                            const url = link?.href || '';
                            if (!url || !url.includes('/fiches-produits/')) return null;
                            
                            const name = tile.querySelector('.product-tile__content__upper__product-name')?.textContent?.trim() || '';
                            const brand = tile.querySelector('.product-tile__content__upper__brand-name')?.textContent?.trim() || '';
                            const price = tile.querySelector('.tag__current .tag__label--price')?.textContent?.trim() || '';
                            const quantity = tile.querySelector('.tag__marker--salesunit')?.textContent?.trim() || '';
                            const promo = tile.querySelector('.product-tile__flags')?.textContent?.trim() || '';
                            const img = tile.querySelector('.product-tile__image-section__picture')?.src || '';
                            
                            if (!name || !price) return null;
                            return {url, name, brand, price, quantity, promo, image: img};
                        }).filter(Boolean);
                    }
                """)

                # Add new products only
                new_count = 0
                for item in data:
                    url_key = item.get("url", "").lower()
                    if url_key in seen_urls:
                        continue
                    seen_urls.add(url_key)

                    price = self.extract_price(item.get("price", ""))
                    if not price or price <= 0:
                        continue

                    products.append(
                        Product(
                            name=item.get("name", ""),
                            price=price,
                            url=item.get("url", ""),
                            category=category,
                            subcategory=subcategory,
                            brand=item.get("brand", ""),
                            image=item.get("image", ""),
                            quantity=item.get("quantity", ""),
                            promotion=item.get("promo", ""),
                        )
                    )
                    new_count += 1

                current_count = len(seen_urls)

                # Check if we got new products
                if current_count > last_count:
                    last_count = current_count
                    consecutive_no_new = 0
                else:
                    consecutive_no_new += 1

                # Stop if no new products after 3 clicks (button likely gone)
                if consecutive_no_new >= 3:
                    print(
                        f"    -> Plus de produits après {self.total_clicks} clicks ({current_count} total)"
                    )
                    break

                # Try to click "VOIR PLUS"
                try:
                    btn = await self.page.query_selector(
                        "button[data-testid='product-tile-grid-load-more-button']"
                    )
                    if not btn:
                        print(f"    -> Bouton absent après {self.total_clicks} clicks")
                        break

                    if not await btn.is_visible():
                        print(
                            f"    -> Bouton invisible après {self.total_clicks} clicks"
                        )
                        break

                    self.total_clicks += 1
                    await btn.click()
                    await asyncio.sleep(2)

                except Exception:
                    print(f"    -> Plus de bouton après {self.total_clicks} clicks")
                    break

        except Exception:
            pass

        return products

    def deduplicate(self, products: list[Product]) -> list[Product]:
        seen = set()
        unique = []
        for p in products:
            key = p.url.lower()
            if key not in seen:
                seen.add(key)
                unique.append(p)
        return unique

    async def run(self) -> list[Product]:
        """Main: scrape all categories with subcategories"""
        playwright = None

        try:
            playwright = await self.init_browser()

            total_cats = len(self.CATEGORIES)

            for cat_idx, (category, path, display_name) in enumerate(self.CATEGORIES):
                print(f"\n[{cat_idx + 1}/{total_cats}] {display_name}")

                subcategories = await self.get_subcategories(path)
                print(f"  {len(subcategories)} subcategories")

                for sub_idx, (sub_name, sub_url) in enumerate(subcategories):
                    prods = await self.scrape_with_pagination(
                        sub_url, category, sub_name
                    )
                    self.products.extend(prods)

                    if prods:
                        print(
                            f"  [{sub_idx + 1}/{len(subcategories)}] {sub_name}: {len(prods)}"
                        )

                    await asyncio.sleep(0.3)

            self.products = self.deduplicate(self.products)

            print(f"\n{'=' * 50}")
            print(f"TOTAL: {len(self.products)} produits uniques")
            print(f"{'=' * 50}")

            by_cat = {}
            for p in self.products:
                by_cat[p.category] = by_cat.get(p.category, 0) + 1
            for cat, count in sorted(by_cat.items()):
                print(f"  {cat}: {count}")

        except Exception as e:
            print(f"Erreur: {e}")
        finally:
            await self.close_browser(playwright)

        return self.products

    def save(self, filename: str = None):
        if filename is None:
            filename = f"aldi_products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = OUTPUT_DIR / filename
        data = [p.to_dict() for p in self.products]
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\nSaved: {filepath}")


async def main():
    print("=" * 50)
    print("Aldi Scraper - ALL Products")
    print("=" * 50)

    scraper = AldiScraper()
    products = await scraper.run()

    if products:
        print("\nExamples:")
        for p in products[:3]:
            print(f"  {p.name} - {p.price}€ [{p.category}]")
        scraper.save()
    else:
        print("Aucun produit!")


if __name__ == "__main__":
    asyncio.run(main())
