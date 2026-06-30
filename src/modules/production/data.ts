import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the production module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "porders": {
    "kind": "list",
    "search": "Search production orders…",
    "action": "New production order",
    "filters": [
      "Stage",
      "Factory"
    ],
    "columns": [
      {
        "label": "Order"
      },
      {
        "label": "Style"
      },
      {
        "label": "Factory"
      },
      {
        "label": "Qty",
        "align": "right"
      },
      {
        "label": "Stage"
      },
      {
        "label": "Progress",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "MO-3310",
          "strong": true,
          "mono": true
        },
        "Merino Crew Knit",
        "Lahore Unit 2",
        {
          "t": "2,400",
          "align": "right",
          "mono": true
        },
        {
          "badge": "amber",
          "t": "Sewing"
        },
        {
          "t": "62%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "MO-3309",
          "strong": true,
          "mono": true
        },
        "Tailored Chino",
        "Faisalabad",
        {
          "t": "3,000",
          "align": "right",
          "mono": true
        },
        {
          "badge": "navy",
          "t": "Cutting"
        },
        {
          "t": "28%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "MO-3308",
          "strong": true,
          "mono": true
        },
        "Oxford Shirt",
        "Lahore Unit 1",
        {
          "t": "5,000",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Finishing"
        },
        {
          "t": "88%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "MO-3307",
          "strong": true,
          "mono": true
        },
        "Field Jacket",
        "Sialkot",
        {
          "t": "1,200",
          "align": "right",
          "mono": true
        },
        {
          "badge": "neutral",
          "t": "Planned"
        },
        {
          "t": "0%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ]
    ]
  },
  "pboard": {
    "kind": "board",
    "columns": [
      {
        "title": "Cutting",
        "accent": "#3A4256",
        "count": 2,
        "cards": [
          {
            "ref": "MO-3309",
            "title": "Tailored Chino",
            "sub": "3,000 units · Faisalabad",
            "meta": "28%",
            "metaIcon": "activity",
            "av": "PL",
            "tone": "navy"
          },
          {
            "ref": "MO-3312",
            "title": "Linen Camp Shirt",
            "sub": "1,800 units · Lahore U1",
            "meta": "10%",
            "metaIcon": "activity",
            "av": "PL",
            "tone": "navy"
          }
        ]
      },
      {
        "title": "Sewing",
        "accent": "#D29A22",
        "count": 1,
        "cards": [
          {
            "ref": "MO-3310",
            "title": "Merino Crew Knit",
            "sub": "2,400 units · Lahore U2",
            "meta": "62%",
            "metaIcon": "activity",
            "av": "PL",
            "tone": "amber"
          }
        ]
      },
      {
        "title": "Finishing",
        "accent": "#5B6478",
        "count": 1,
        "cards": [
          {
            "ref": "MO-3308",
            "title": "Oxford Shirt",
            "sub": "5,000 units · Lahore U1",
            "meta": "88%",
            "metaIcon": "activity",
            "av": "PL",
            "tone": "navy"
          }
        ]
      },
      {
        "title": "Completed",
        "accent": "#2E9E6B",
        "count": 1,
        "cards": [
          {
            "ref": "MO-3305",
            "title": "Cashmere Scarf",
            "sub": "1,000 units · Sialkot",
            "meta": "100%",
            "metaIcon": "check",
            "av": "PL",
            "tone": "green"
          }
        ]
      }
    ]
  },
  "bom": {
    "kind": "list",
    "search": "Search BOMs…",
    "action": "New BOM",
    "filters": [
      "Style"
    ],
    "columns": [
      {
        "label": "Component"
      },
      {
        "label": "Style"
      },
      {
        "label": "Material"
      },
      {
        "label": "Qty / unit",
        "align": "right"
      },
      {
        "label": "Cost",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "Merino yarn 2/28",
          "strong": true
        },
        "Merino Crew Knit",
        "Wool",
        {
          "t": "320 g",
          "align": "right",
          "mono": true
        },
        {
          "t": "€14.20",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Cotton twill 280gsm",
          "strong": true
        },
        "Tailored Chino",
        "Cotton",
        {
          "t": "1.4 m",
          "align": "right",
          "mono": true
        },
        {
          "t": "€6.80",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Corozo button 18L",
          "strong": true
        },
        "Oxford Shirt",
        "Trim",
        {
          "t": "9 pcs",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0.54",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "YKK zipper #5",
          "strong": true
        },
        "Field Jacket",
        "Hardware",
        {
          "t": "1 pc",
          "align": "right",
          "mono": true
        },
        {
          "t": "€1.90",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ]
    ]
  }
};
