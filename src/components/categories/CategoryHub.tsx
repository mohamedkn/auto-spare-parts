import { CategoryBanner } from "./CategoryBanner";
import { ChildCategoriesRow } from "./ChildCategoriesRow";
import { SubCategorySection } from "./SubCategorySection";

interface CategoryHubProps {
  category: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    children: any[];
  };
}

export function CategoryHub({ category }: CategoryHubProps) {
  // Extract all child categories for the top navigation row
  const childCategories = category.children.map((child) => ({
    id: child.id,
    name: child.name,
    slug: child.slug,
    imageUrl: child.imageUrl,
  }));

  return (
    <div className="w-full">
      {/* 1. Main Banner */}
      <CategoryBanner title={category.name} imageUrl={category.imageUrl} />

      {/* 2. Top Navigation for child categories (Circular icons) */}
      <ChildCategoriesRow categories={childCategories} />

      {/* 3. Sections for each child category */}
      <div className="space-y-4">
        {category.children.map((child) => (
          <SubCategorySection key={child.id} category={child} />
        ))}
      </div>
    </div>
  );
}
