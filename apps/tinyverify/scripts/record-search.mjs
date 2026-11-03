import { writeFile } from "node:fs/promises";
for (const [id, url] of [
  [
    "companies-dissolved",
    "https://find-and-update.company-information.service.gov.uk/company/05888957",
  ],
  [
    "companies-branch",
    "https://find-and-update.company-information.service.gov.uk/company/BR008975",
  ],
  [
    "companies-search",
    "https://find-and-update.company-information.service.gov.uk/search/companies?q=tesco",
  ],
  [
    "npi-empty",
    "https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-2&organization_name=ZZTinyVerifyNoSuchOrganisation991827&limit=10",
  ],
]) {
  const r = await fetch("https://api.fetch.tinyfish.ai", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.TINYFISH_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      urls: [url],
      format: "markdown",
      links: true,
      ttl: 3600,
    }),
  });
  const d = await r.json();
  await writeFile(
    `fixtures/${id}.json`,
    JSON.stringify(
      { recorded_at: new Date().toISOString(), url, response: d },
      null,
      2,
    ),
  );
  console.log(id, JSON.stringify(d).slice(0, 400));
}
