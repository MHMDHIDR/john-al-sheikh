import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  slug: string;
  sortOrder: number | null;
  itemCount?: number;
}

interface CategoriesGridProps {
  categories: Category[];
  columns?: 2 | 3 | 4;
  limit?: number;
}

export function CategoriesGrid({ categories, columns = 3, limit }: CategoriesGridProps) {
  const displayCategories = limit ? categories.slice(0, limit) : categories;

  return (
    <div className={`grid gap-6 md:grid-cols-${columns}`}>
      {displayCategories.map(category => (
        <Link key={category.id} href={`/c/${category.slug}`}>
          <Card className="overflow-hidden transition-shadow hover:shadow-lg">
            <div className="relative h-48 max-h-48 w-full overflow-y-clip">
              <Image
                src={category.image ?? "/placeholder.jpg"}
                alt={category.name}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                fill
                priority
              />
            </div>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              {category.description && (
                <CardContent className="p-0">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              )}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
