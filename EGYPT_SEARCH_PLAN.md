# Egypt Product Search Plan

## Product taxonomy

Priority order for the Egyptian aftermarket:

1. Tires and wheels
2. Filters
3. Oils and fluids
4. Brake systems
5. Batteries
6. Suspension and steering
7. Engine and transmission parts
8. Cooling and air conditioning
9. Lighting and electrical parts
10. Body parts and accessories

The ordering reflects the high replacement frequency of tires, batteries, filters,
lubricants, and brake parts, while preserving the broader mechanical catalog.

## Required listing data

- Category is mandatory and must be the most specific available category.
- Product name should follow: part type + placement + brand + vehicle/model when applicable.
- OEM number and manufacturer part number are stored separately.
- Condition must distinguish genuine, aftermarket, used/imported, and refurbished parts.
- Vehicle make, model, and year compatibility should be added for fitment-dependent parts.
- Universal products such as fluids may rely on specification fields instead of fitment.

## Search ranking

1. Exact normalized OEM or part-number match.
2. Exact or prefix product-name match.
3. Egyptian Arabic synonym match.
4. Brand and category match.
5. Vendor and description match.
6. In-stock products as a small tie-breaker.

Vehicle filters remain strict after search ranking to avoid unsafe fitment suggestions.

## Vehicle catalog launch priority

The catalog should be reviewed against AMIC data and populated generation by generation,
starting with Nissan Sunny, Hyundai Elantra and Accent, Chevrolet Optra, Chery Arrizo and
Tiggo, MG 5, Toyota Corolla, Kia Cerato, Renault Logan, Fiat Tipo, BYD F3, Mitsubishi
Lancer, Daewoo Lanos, Skoda Octavia, and Peugeot passenger models. Do not guess year
ranges: each generation must be verified before it can be used as a strict fitment filter.

## Production evolution

- Current stage: deterministic normalization, synonym expansion, and application ranking.
- Launch stage: PostgreSQL `pg_trgm` and generated full-text search columns.
- Scale stage: search analytics, zero-result tracking, typo dictionaries, click/conversion ranking,
  and a reviewed vehicle/OEM interchange catalog.

## Market references

- Autotech Automotive After Sales Market Report, Africa/Egypt.
- AMIC Egypt 2025 vehicle sales reports.
- Tawfiqia product categories and vehicle/brand filters.
- Fit & Fix Egyptian catalog categories.
