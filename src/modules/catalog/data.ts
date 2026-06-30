import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the catalog module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "products": {
    "kind": "list",
    "search": "Search products, SKU…",
    "action": "New product",
    "filters": [
      "Category",
      "Season",
      "Status"
    ],
    "total": 248,
    "columns": [
      {
        "label": "Product"
      },
      {
        "label": "Category"
      },
      {
        "label": "Season"
      },
      {
        "label": "Variants",
        "align": "center"
      },
      {
        "label": "Price",
        "align": "right"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "Merino Crew Knit",
          "avatar": true,
          "sub": "APP-KNT-0142"
        },
        "Knitwear",
        "Fall '26",
        {
          "t": "18",
          "align": "center",
          "mono": true
        },
        {
          "t": "€129.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Tailored Chino Pant",
          "avatar": true,
          "sub": "APP-BTM-0098"
        },
        "Bottoms",
        "Core",
        {
          "t": "24",
          "align": "center",
          "mono": true
        },
        {
          "t": "€89.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Oxford Shirt",
          "avatar": true,
          "sub": "APP-SHT-0211"
        },
        "Shirts",
        "Core",
        {
          "t": "30",
          "align": "center",
          "mono": true
        },
        {
          "t": "€69.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Quilted Field Jacket",
          "avatar": true,
          "sub": "APP-OUT-0067"
        },
        "Outerwear",
        "Fall '26",
        {
          "t": "15",
          "align": "center",
          "mono": true
        },
        {
          "t": "€239.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Low stock"
        }
      ],
      [
        {
          "t": "Linen Camp Shirt",
          "avatar": true,
          "sub": "APP-SHT-0188"
        },
        "Shirts",
        "Spring '26",
        {
          "t": "21",
          "align": "center",
          "mono": true
        },
        {
          "t": "€79.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "neutral",
          "t": "Draft"
        }
      ],
      [
        {
          "t": "Cashmere Scarf",
          "avatar": true,
          "sub": "APP-ACC-0034"
        },
        "Accessories",
        "Fall '26",
        {
          "t": "9",
          "align": "center",
          "mono": true
        },
        {
          "t": "€119.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Stretch Denim Jean",
          "avatar": true,
          "sub": "APP-BTM-0151"
        },
        "Bottoms",
        "Core",
        {
          "t": "27",
          "align": "center",
          "mono": true
        },
        {
          "t": "€99.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Wool Overcoat",
          "avatar": true,
          "sub": "APP-OUT-0090"
        },
        "Outerwear",
        "Winter '26",
        {
          "t": "12",
          "align": "center",
          "mono": true
        },
        {
          "t": "€349.00",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "red",
          "t": "Out of stock"
        }
      ]
    ]
  },
  "categories": {
    "kind": "list",
    "search": "Search categories…",
    "action": "New category",
    "filters": [],
    "columns": [
      {
        "label": "Category"
      },
      {
        "label": "Parent"
      },
      {
        "label": "Products",
        "align": "center"
      },
      {
        "label": "Active",
        "align": "center"
      }
    ],
    "rows": [
      [
        {
          "t": "Knitwear",
          "strong": true
        },
        "—",
        {
          "t": "42",
          "align": "center",
          "mono": true
        },
        {
          "t": "40",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "Bottoms",
          "strong": true
        },
        "—",
        {
          "t": "58",
          "align": "center",
          "mono": true
        },
        {
          "t": "55",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "Shirts",
          "strong": true
        },
        "—",
        {
          "t": "64",
          "align": "center",
          "mono": true
        },
        {
          "t": "61",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "Outerwear",
          "strong": true
        },
        "—",
        {
          "t": "37",
          "align": "center",
          "mono": true
        },
        {
          "t": "34",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "Accessories",
          "strong": true
        },
        "—",
        {
          "t": "47",
          "align": "center",
          "mono": true
        },
        {
          "t": "45",
          "align": "center",
          "mono": true
        }
      ]
    ]
  },
  "attributes": {
    "kind": "list",
    "search": "Search attributes…",
    "action": "New attribute",
    "filters": [
      "Type"
    ],
    "columns": [
      {
        "label": "Value"
      },
      {
        "label": "Type"
      },
      {
        "label": "Code"
      },
      {
        "label": "Used in",
        "align": "center"
      }
    ],
    "rows": [
      [
        {
          "t": "Navy",
          "strong": true
        },
        {
          "badge": "navy",
          "t": "Color"
        },
        {
          "t": "NVY",
          "mono": true
        },
        {
          "t": "86",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "Stone",
          "strong": true
        },
        {
          "badge": "navy",
          "t": "Color"
        },
        {
          "t": "STN",
          "mono": true
        },
        {
          "t": "54",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "Charcoal",
          "strong": true
        },
        {
          "badge": "navy",
          "t": "Color"
        },
        {
          "t": "CHR",
          "mono": true
        },
        {
          "t": "72",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "S / M / L / XL",
          "strong": true
        },
        {
          "badge": "neutral",
          "t": "Size"
        },
        {
          "t": "ALPHA",
          "mono": true
        },
        {
          "t": "210",
          "align": "center",
          "mono": true
        }
      ],
      [
        {
          "t": "28–40 waist",
          "strong": true
        },
        {
          "badge": "neutral",
          "t": "Size"
        },
        {
          "t": "WAIST",
          "mono": true
        },
        {
          "t": "58",
          "align": "center",
          "mono": true
        }
      ]
    ]
  }
};
