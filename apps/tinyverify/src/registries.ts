import { z } from "zod";
export const ids = [
  "npi",
  "finra",
  "companies",
  "gleif",
  "fdic",
  "abn",
  "charity",
  "cslb",
] as const;
export type RegistryId = (typeof ids)[number];
export const directory = [
  {
    id: "npi",
    name: "NPI Registry",
    authority: "CMS / NPPES",
    jurisdiction: "US",
    type: "healthcare_registration",
    method: "Fetch",
    host: "npiregistry.cms.hhs.gov",
  },
  {
    id: "finra",
    name: "BrokerCheck firms",
    authority: "FINRA (SRO)",
    jurisdiction: "US",
    type: "broker_registration",
    method: "Fetch",
    host: "api.brokercheck.finra.org",
  },
  {
    id: "companies",
    name: "Companies House",
    authority: "UK Registrar of Companies",
    jurisdiction: "UK",
    type: "company_registration",
    method: "Fetch",
    host: "find-and-update.company-information.service.gov.uk",
  },
  {
    id: "gleif",
    name: "LEI",
    authority: "GLEIF",
    jurisdiction: "Global",
    type: "lei_registration",
    method: "Fetch",
    host: "api.gleif.org",
  },
  {
    id: "fdic",
    name: "BankFind",
    authority: "FDIC",
    jurisdiction: "US",
    type: "bank_registration",
    method: "Fetch",
    host: "api.fdic.gov",
  },
  {
    id: "abn",
    name: "ABN Lookup",
    authority: "Australian Business Register",
    jurisdiction: "AU",
    type: "business_registration",
    method: "Fetch",
    host: "abr.business.gov.au",
  },
  {
    id: "charity",
    name: "Charity Commission",
    authority: "Charity Commission for England and Wales",
    jurisdiction: "UK",
    type: "charity_registration",
    method: "Fetch",
    host: "register-of-charities.charitycommission.gov.uk",
  },
  {
    id: "cslb",
    name: "Contractors State License Board",
    authority: "California CSLB",
    jurisdiction: "US-CA",
    type: "contractor_license",
    method: "Agent",
    host: "www.cslb.ca.gov",
  },
] as const;
export const recordSchema = z.object({
  record_number: z.string().min(1),
  name: z.string().min(1),
  name_variants: z.array(z.string()).default([]),
  status: z.enum([
    "active",
    "inactive",
    "expired",
    "lapsed",
    "suspended",
    "revoked",
    "dissolved",
    "unknown",
  ]),
  source_status: z.string(),
  expiry_date: z.string().nullable(),
  disciplinary_actions: z.array(z.string()).nullable(),
  flags: z.array(z.string()).default([]),
  source_link: z.string().url(),
  notes: z.array(z.string()).default([]),
});
export type RecordData = z.infer<typeof recordSchema>;
const base = (
  record_number: string,
  name: string,
  status: RecordData["status"],
  source_status: string,
  source_link: string,
  extra: Partial<RecordData> = {},
): RecordData =>
  recordSchema.parse({
    record_number,
    name,
    status,
    source_status,
    source_link,
    expiry_date: null,
    disciplinary_actions: null,
    ...extra,
  });
export function parseJSON(text: string): unknown {
  const fenced = text.trim().match(/^```[a-z]*\s*\n([\s\S]*?)\n?```$/i);
  if (fenced) text = fenced[1];
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(text.replace(/\\([\\`*_{}\[\]()#+\-.!|>~])/g, "$1"));
  }
}
const status = (s: string): RecordData["status"] =>
  (
    ({
      active: "active",
      inactive: "inactive",
      dissolved: "dissolved",
      suspended: "suspended",
      expired: "expired",
      revoked: "revoked",
      lapsed: "lapsed",
      issued: "active",
      retired: "inactive",
      annulled: "inactive",
      liquidation: "inactive",
      closed: "inactive",
      open: "active",
      cancelled: "inactive",
      disbarred: "revoked",
    }) as const
  )[s.toLowerCase() as "active"] ?? "unknown";
export function parseRecords(
  id: RegistryId,
  text: string,
  url: string,
): RecordData[] {
  if (id === "npi") {
    const schema = z.object({
      result_count: z.number(),
      results: z
        .array(
          z.object({
            number: z.coerce.string(),
            enumeration_type: z.string(),
            basic: z.object({
              organization_name: z.string().optional(),
              first_name: z.string().optional(),
              last_name: z.string().optional(),
              status: z.string(),
            }),
            other_names: z
              .array(z.object({ organization_name: z.string().optional() }))
              .optional(),
          }),
        )
        .optional(),
    });
    const d = schema.parse(parseJSON(text));
    if (d.result_count > 0 && !d.results) throw Error("NPI results missing");
    return (d.results ?? []).map((r) =>
      base(
        r.number,
        r.basic.organization_name ??
          [r.basic.first_name, r.basic.last_name].filter(Boolean).join(" "),
        r.basic.status === "A" ? "active" : "inactive",
        r.basic.status,
        `https://npiregistry.cms.hhs.gov/provider-view/${r.number}`,
        {
          name_variants: (r.other_names ?? []).flatMap((n) =>
            n.organization_name ? [n.organization_name] : [],
          ),
          notes: [
            "NPI enumeration is not verification of a state professional licence. Expiry and disciplinary actions are not supplied by NPPES.",
          ],
        },
      ),
    );
  }
  if (id === "finra") {
    const d = z
      .object({
        hits: z.object({
          total: z.union([z.number(), z.object({ value: z.number() })]),
          hits: z.array(
            z.object({
              _source: z.object({
                firm_source_id: z.coerce.string(),
                firm_name: z.string(),
                firm_other_names: z.array(z.string()).optional(),
                firm_scope: z.string().optional(),
                firm_ia_scope: z.string().optional(),
                firm_disclosure_fl: z.string().optional(),
                firm_ia_disclosure_fl: z.string().optional(),
              }),
            }),
          ),
        }),
      })
      .parse(parseJSON(text));
    return d.hits.hits.map(({ _source: r }) => {
      const scopes = [r.firm_scope, r.firm_ia_scope].filter(Boolean);
      const raw = scopes.join(" / ");
      return base(
        r.firm_source_id,
        r.firm_name,
        scopes.includes("ACTIVE") ? "active" : raw ? "inactive" : "unknown",
        raw,
        `https://brokercheck.finra.org/firm/summary/${r.firm_source_id}`,
        {
          name_variants: r.firm_other_names,
          flags:
            r.firm_disclosure_fl === "Y" || r.firm_ia_disclosure_fl === "Y"
              ? ["disclosures"]
              : [],
          notes: [
            "Official, undocumented FINRA search interface. A disclosure flag is not itself a disciplinary finding; consult the linked report.",
          ],
        },
      );
    });
  }
  if (id === "gleif") {
    const item = z.object({
      id: z.string(),
      attributes: z.object({
        entity: z.object({
          legalName: z.object({ name: z.string() }),
          status: z.string(),
          otherNames: z.array(z.object({ name: z.string() })).optional(),
        }),
        registration: z.object({
          status: z.string(),
          nextRenewalDate: z.string().nullable(),
        }),
      }),
    });
    const d = z
      .object({ data: z.union([item, z.array(item)]) })
      .parse(parseJSON(text));
    return (Array.isArray(d.data) ? d.data : [d.data]).map((r) =>
      base(
        r.id,
        r.attributes.entity.legalName.name,
        r.attributes.entity.status === "INACTIVE"
          ? "inactive"
          : status(r.attributes.registration.status),
        r.attributes.registration.status,
        `https://search.gleif.org/#/record/${r.id}`,
        {
          expiry_date: r.attributes.registration.nextRenewalDate,
          name_variants: r.attributes.entity.otherNames?.map((n) => n.name),
          notes: [
            "Expiry is the LEI next renewal date, not company incorporation expiry.",
          ],
        },
      ),
    );
  }
  if (id === "fdic") {
    const d = z
      .object({
        data: z.array(
          z.object({
            data: z.object({
              CERT: z.coerce.string(),
              NAME: z.string(),
              ACTIVE: z.union([z.number(), z.boolean(), z.string()]),
            }),
          }),
        ),
      })
      .parse(parseJSON(text));
    return d.data.map(({ data: r }) =>
      base(
        r.CERT,
        r.NAME,
        [1, true, "1"].includes(r.ACTIVE) ? "active" : "inactive",
        String(r.ACTIVE),
        `https://banks.data.fdic.gov/bankfind-suite/bankfind/details/${r.CERT}`,
        {
          notes: [
            "FDIC institution record; no licence expiry or disciplinary data supplied by this dataset.",
          ],
        },
      ),
    );
  }
  if (id === "companies") {
    const branch = text.match(
      /# ([^\n]+)\n+UK establishment number\s*\*\*([A-Z0-9]{8})\*\*/,
    );
    if (branch) {
      const bstatus = text.match(/\*\*Status\*\*:\s*([^\n]+)/)?.[1]?.trim();
      if (!bstatus) throw Error("Establishment status missing");
      return [
        base(branch[2], branch[1], status(bstatus), bstatus, url, {
          notes: [
            "UK establishment record, not a separate incorporated company.",
          ],
        }),
      ];
    }
    const match = text.match(/Company Overview for (.+?) \(([A-Z0-9]{8})\)/i);
    if (!match) throw Error("Companies House detail markers missing");
    const s = text.match(/Company status\s*\n\*?\s*([^\n]+)/i)?.[1]?.trim();
    if (!s) throw Error("Company status missing");
    return [
      base(match[2], match[1], status(s), s, url, {
        flags: /overdue/i.test(text) ? ["overdue_filings"] : [],
        name_variants: [...text.matchAll(/^\| ([^|]+) \| \d{2} /gm)].map((m) =>
          m[1].trim(),
        ),
        notes: [
          "UK incorporation has no expiry date. Accounts due dates are not licence expiry.",
        ],
      }),
    ];
  }
  if (id === "abn") {
    const name = text.match(/\| Entity name:\s*\|\s*([^|]+)/)?.[1]?.trim(),
      s = text.match(/\| ABN status:\s*\|\s*([^|]+)/)?.[1]?.trim();
    if (!name || !s) throw Error("ABN detail markers missing");
    return [
      base(
        new URL(url).searchParams.get("abn")!,
        name,
        /^Active\b/i.test(s)
          ? "active"
          : /^Cancelled\b/i.test(s)
            ? "inactive"
            : "unknown",
        s,
        url,
        {
          notes: [
            "ABN registration is not an Australian Financial Services licence.",
          ],
        },
      ),
    ];
  }
  if (id === "charity") {
    const name = text.match(/Charity Commission (.+)/)?.[1]?.trim(),
      num = text.match(/Charity number:\s*(\d+)/)?.[1];
    if (!name || !num) throw Error("Charity detail markers missing");
    const s =
      text.match(/Charity reporting[^\n]+/)?.[0] ??
      "Registration status not supplied";
    return [
      base(num, name, "unknown", s, url, {
        flags: /overdue/i.test(s) ? ["overdue_filings"] : [],
        notes: [
          "Reporting timeliness does not establish active registration; status remains unknown. Expiry and disciplinary history are not supplied on the overview.",
        ],
      }),
    ];
  }
  throw Error("Agent records require schema validation");
}
export const normaliseName = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
export function outcome(records: RecordData[]) {
  return records.length === 0
    ? "no_match"
    : records.length > 1
      ? "multiple_matches"
      : "match";
}
export function officialURL(id: RegistryId, url: string) {
  const u = new URL(url);
  if (
    u.protocol !== "https:" ||
    u.hostname !== directory.find((r) => r.id === id)!.host
  )
    throw Error("Non-official source refused");
  return url;
}
export function lookupURL(id: RegistryId, q: string, kind: string) {
  const enc = encodeURIComponent(q);
  switch (id) {
    case "npi":
      return `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=10&${/^\d{10}$/.test(q) ? `number=${q}` : kind === "person" ? `first_name=${encodeURIComponent(q.split(" ")[0])}&last_name=${encodeURIComponent(q.split(" ").slice(1).join(" "))}` : `enumeration_type=NPI-2&organization_name=${enc}`}`;
    case "finra":
      return `https://api.brokercheck.finra.org/search/firm?query=${enc}&nrows=10&start=0&wt=json`;
    case "gleif":
      return `https://api.gleif.org/api/v1/lei-records${/^[A-Z0-9]{18}\d{2}$/.test(q) ? "/" + q : "?filter[entity.legalName]=" + enc + "&page[size]=10"}`;
    case "fdic":
      return `https://api.fdic.gov/banks/institutions?${/^\d+$/.test(q) ? "filters=CERT:" + q : "search=" + encodeURIComponent('NAME:"' + q.replace(/["\\]/g, "") + '"')}&fields=NAME,CERT,ACTIVE,STNAME,CITY&limit=10`;
    case "companies":
      return `https://find-and-update.company-information.service.gov.uk/${/^(\d{8}|[A-Z]{2}\d{6})$/.test(q) ? "company/" + q : "search/companies?q=" + enc}`;
    case "abn":
      if (!/^\d{11}$/.test(q))
        throw Error("ABN requires an 11-digit identifier");
      return `https://abr.business.gov.au/ABN/View?abn=${q}`;
    case "charity":
      if (!/^\d{1,8}$/.test(q))
        throw Error("Charity Commission requires a charity number");
      return `https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/${q}`;
    case "cslb":
      return "https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx";
  }
}

export function companyNumbers(raw: string) {
  return [
    ...new Set(
      [
        ...raw.matchAll(
          /\b([A-Z0-9]{8}) - (?:Incorporated|Dissolved|Closed|First UK|Opened)/g,
        ),
      ].map((m) => m[1]),
    ),
  ].slice(0, 10);
}

export function validNPI(value: string) {
  if (!/^\d{10}$/.test(value)) return false;
  const s = "80840" + value;
  let sum = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = Number(s[i]);
    if ((s.length - 1 - i) % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}
export function validABN(value: string) {
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  return (
    /^\d{11}$/.test(value) &&
    [...value].reduce(
      (sum, n, i) => sum + (Number(n) - (i === 0 ? 1 : 0)) * weights[i],
      0,
    ) %
      89 ===
      0
  );
}

// Rank current names ahead of historical aliases; preserve registry provenance.
export function rankCandidates(records: RecordData[], query: string, registry: RegistryId) {
  const q = normaliseName(query);
  const similarity = (name: string) => {
    const n = normaliseName(name);
    if (n === q) return 1;
    const a = new Set(q.split(" ")), b = new Set(n.split(" "));
    return [...a].filter(t => b.has(t)).length / new Set([...a, ...b]).size;
  };
  return records.map(r => {
    const current = similarity(r.name);
    const alias = r.name_variants.find(n => normaliseName(n) === q);
    const historical = registry === "companies" ? [...r.name_variants].sort((a,b) => similarity(b)-similarity(a)).find(n => similarity(n) > current) : undefined;
    const former = registry === "companies" ? alias ?? historical : undefined;
    return { ...r,
      name_match: current === 1 || (alias && !former) ? "exact_or_variant" : former ? "former_name" : "possible_match",
      ...(former ? { matched_former_name: former } : {}),
      score: current === 1 ? 3 : alias && !former ? 2 : current,
    };
  }).sort((a,b) => b.score - a.score).map(({score, ...record}) => record);
}
