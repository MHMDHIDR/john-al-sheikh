/**
 * Interface for pagination parameters
 * @property page - Current page number
 * @property limit - Number of items per page
 * @property totalItems - Total number of items
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  totalItems: number;
}

/**
 * Interface for pagination result
 * @property currentPage - Current page number
 * @property totalPages - Total number of pages
 * @property pageSize - Number of items per page
 * @property totalItems - Total number of items
 * @property hasNextPage - Whether there is a next page
 * @property hasPreviousPage - Whether there is a previous page
 * @property nextPage - Next page number
 * @property previousPage - Previous page number
 * @property offset - Offset of the current page
 * @property items.start - Start index of items on the current page
 * @property items.end - End index of items on the current page
 */
export type PaginationResult = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
  offset: number;
  items: {
    start: number;
    end: number;
  };
};

/**
 * Pagination utility class for handling pagination logic in NextJS applications
 * @singleton pagination - Singleton instance of PaginationService
 * @method getInstance - Get the singleton instance of PaginationService
 * @method calculate - Calculate pagination details based on provided parameters
 * @method parseSearchParams - Parse pagination parameters from URL search params
 * @method generateMetaTags - Generate pagination meta tags for SEO
 * @example
 * const pagination = PaginationService.getInstance()
 * const params = { page: 1, limit: 10, totalItems: 100 }
 * const result = pagination.calculate(params)
 * console.log(result)
 */
class PaginationService {
  private static instance: PaginationService;
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 100;
  private readonly MIN_PAGE = 1;

  private constructor() {
    // Private constructor to prevent direct construction calls with 'new'
  }

  /**
   * Get the singleton instance of PaginationService
   */
  public static getInstance(): PaginationService {
    if (!PaginationService.instance) {
      PaginationService.instance = new PaginationService();
    }
    return PaginationService.instance;
  }

  /**
   * Validate pagination parameters
   * @throws Error if parameters are invalid
   */
  private validateParams(params: PaginationParams): void {
    if (params.totalItems < 0) {
      throw new Error("Total items cannot be negative");
    }
    if (params.page !== undefined && params.page < this.MIN_PAGE) {
      throw new Error("Page number cannot be less than 1");
    }
    if (params.limit !== undefined && (params.limit < 1 || params.limit > this.MAX_LIMIT)) {
      throw new Error(`Limit must be between 1 and ${this.MAX_LIMIT}`);
    }
  }

  /**
   * Calculate pagination details based on provided parameters
   * @param params - Pagination parameters
   * @returns PaginationResult
   */
  public calculate(params: PaginationParams): PaginationResult {
    this.validateParams(params);

    const page = Math.max(params.page ?? this.DEFAULT_PAGE, this.MIN_PAGE);
    const limit = Math.min(Math.max(params.limit ?? this.DEFAULT_LIMIT, 1), this.MAX_LIMIT);
    const totalItems = Math.max(params.totalItems, 0);
    const totalPages = Math.ceil(totalItems / limit);

    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const offset = (currentPage - 1) * limit;

    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      currentPage,
      totalPages,
      pageSize: limit,
      totalItems,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? currentPage + 1 : null,
      previousPage: hasPreviousPage ? currentPage - 1 : null,
      offset,
      items: {
        start: totalItems === 0 ? 0 : offset + 1,
        end: Math.min(offset + limit, totalItems),
      },
    };
  }

  /**
   * Parse pagination parameters from URL search params
   */
  public parseSearchParams(searchParams: URLSearchParams): {
    page: number;
    limit: number;
  } {
    const rawPage = searchParams.get("page");
    const rawLimit = searchParams.get("limit");

    // Validate and sanitize input
    const page = this.sanitizeNumber(rawPage, this.DEFAULT_PAGE, this.MIN_PAGE);
    const limit = this.sanitizeNumber(rawLimit, this.DEFAULT_LIMIT, 1, this.MAX_LIMIT);

    return { page, limit };
  }

  /**
   * Sanitize numeric input
   */
  private sanitizeNumber(
    value: string | null,
    defaultValue: number,
    min: number,
    max?: number,
  ): number {
    const num = Number(value);
    if (isNaN(num)) return defaultValue;
    if (num < min) return min;
    if (max !== undefined && num > max) return max;
    return num;
  }

  /**
   * Generate pagination meta tags for SEO
   */
  public generateMetaTags(
    baseUrl: string,
    pagination: PaginationResult,
  ): Array<{ property: string; content: string }> {
    // Validate baseUrl
    try {
      new URL(baseUrl);
    } catch {
      throw new Error("Invalid base URL provided");
    }

    const tags: Array<{ property: string; content: string }> = [];

    if (pagination.hasPreviousPage) {
      tags.push({
        property: "prev",
        content: `${baseUrl}?page=${pagination.previousPage}`,
      });
    }

    if (pagination.hasNextPage) {
      tags.push({
        property: "next",
        content: `${baseUrl}?page=${pagination.nextPage}`,
      });
    }

    return tags;
  }
}

// Export a singleton instance
export const pagination = PaginationService.getInstance();
