import { writeFile, mkdir } from "node:fs/promises";
const urls = {
  npi: "https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-2&organization_name=Mayo%20Clinic&limit=10",
  finra:
    "https://api.brokercheck.finra.org/search/firm?query=robinhood&nrows=10&start=0&wt=json",
  gleif: "https://api.gleif.org/api/v1/lei-records/HWUPKR0MPOU8FGXBT394",
  fdic: "https://api.fdic.gov/banks/institutions?filters=CERT:628&fields=NAME,CERT,ACTIVE,STNAME,CITY&limit=10",
  companies:
    "https://find-and-update.company-information.service.gov.uk/company/00445790",
  abn: "https://abr.business.gov.au/ABN/View?abn=51824753556",
  charity:
    "https://register-of-charities.charitycommission.gov.uk/charity-search/-/charity-details/202918",
};
await mkdir("fixtures", { recursive: true });
await Promise.all(
  Object.entries(urls).map(async ([id, url]) => {
    try {
      const r = await fetch("https://api.fetch.tinyfish.ai", {
        method: "POST",
        headers: {
          "X-API-Key": process.env.TINYFISH_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: [url], format: "markdown", ttl: 3600 }),
      });
      const data = await r.json();
      if (id === "npi" && data.results?.[0]?.text) {
        const d = JSON.parse(data.results[0].text.replace(/\\_/g, "_"));
        for (const row of d.results ?? [])
          for (const k of Object.keys(row.basic ?? {}))
            if (k.startsWith("authorized_official")) delete row.basic[k];
        data.results[0].text = JSON.stringify(d);
      }
      await writeFile(
        `fixtures/${id}.json`,
        JSON.stringify(
          { recorded_at: new Date().toISOString(), url, response: data },
          null,
          2,
        ),
      );
      console.log(id, r.status, JSON.stringify(data).slice(0, 280));
    } catch (e) {
      console.log(id, e.message);
    }
  }),
);
