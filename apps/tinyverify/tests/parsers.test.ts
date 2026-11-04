import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  parseRecords,
  parseJSON,
  outcome,
  normaliseName,
  officialURL,
  companyNumbers,
  validNPI,
  validABN,
  type RegistryId,
} from "../src/registries";
import { compareRecord } from "../src/index";
const fixture = (id: string) =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${id}.json`, import.meta.url), "utf8"),
  );
describe("recorded official Fetch fixtures", () => {
  for (const [id, name, num, state] of [
    ["npi", "MAYO CLINIC", "1881018208", "active"],
    ["finra", "ROBINHOOD VENTURES", "339165", "active"],
    ["gleif", "Apple Inc.", "HWUPKR0MPOU8FGXBT394", "active"],
    ["fdic", "JPMorgan Chase Bank, National Association", "628", "active"],
    ["companies", "TESCO PLC", "00445790", "active"],
    ["abn", "AUSTRALIAN TAXATION OFFICE", "51824753556", "active"],
    ["charity", "OXFAM", "202918", "unknown"],
  ])
    it(id, () => {
      const f = fixture(id);
      const records = parseRecords(
        id as RegistryId,
        f.response.results[0].text,
        f.url,
      );
      expect(records[0]).toMatchObject({
        name,
        record_number: num,
        status: state,
      });
      expect(records[0].disciplinary_actions).toBeNull();
    });
  it("keeps multiple organisations and variants", () => {
    const f = fixture("finra"),
      r = parseRecords("finra", f.response.results[0].text, f.url);
    expect(outcome(r)).toBe("multiple_matches");
    expect(r.find((r) => r.record_number === "165998")?.flags).toEqual([
      "disclosures",
    ]);
    expect(r[0].name_variants).toContain("ROBINHOOD VENTURES DE, LLC");
  });
  it("does not confuse LEI renewal with unknown expiry", () => {
    const f = fixture("gleif");
    expect(
      parseRecords("gleif", f.response.results[0].text, f.url)[0].expiry_date,
    ).toBe("2027-03-08T17:27:20Z");
  });
  for (const id of [
    "npi",
    "finra",
    "gleif",
    "fdic",
    "companies",
    "abn",
    "charity",
  ])
    it(`${id}: source drift fails loudly`, () =>
      expect(() =>
        parseRecords(
          id as RegistryId,
          "<html>Access denied</html>",
          "https://example.com",
        ),
      ).toThrow());
  it("valid empty API response is no_match", () =>
    expect(
      outcome(parseRecords("npi", '{"result_count":0}', fixture("npi").url)),
    ).toBe("no_match"));
  it("invalid JSON remains registry error", () =>
    expect(() => parseJSON('{"result_count":')).toThrow());
  it("normalises punctuation and accents without guessing legal equivalence", () => {
    expect(normaliseName("A & B, Inc.")).toBe(normaliseName("A and B Inc"));
    expect(normaliseName("Acme Ltd")).not.toBe(normaliseName("Acme PLC"));
  });
  it("rejects nonofficial sources and redirects", () => {
    expect(() =>
      officialURL("npi", "https://npiregistry.cms.hhs.gov.evil.test"),
    ).toThrow();
    expect(() =>
      officialURL("npi", "http://npiregistry.cms.hhs.gov"),
    ).toThrow();
  });
  it("compares actual status and expiry fields, not page noise", () => {
    const f = fixture("gleif"),
      r = parseRecords("gleif", f.response.results[0].text, f.url)[0];
    expect(compareRecord(r, r)).toEqual({
      status_changed: false,
      expiry_changed: false,
      discipline_changed: false,
    });
    expect(
      compareRecord(r, {
        ...r,
        status: "suspended",
        source_status: "SUSPENDED",
      }).status_changed,
    ).toBe(true);
  });
});

it("records Companies House name-search identifiers", () => {
  const f = fixture("companies-search");
  expect(companyNumbers(f.response.results[0].text)).toContain("00445790");
});
it("records a real no-match", () => {
  const f = fixture("npi-empty");
  expect(parseRecords("npi", f.response.results[0].text, f.url)).toEqual([]);
});

it("Companies House dissolved company", () => {
  const f = fixture("companies-dissolved");
  expect(
    parseRecords("companies", f.response.results[0].text, f.url)[0].status,
  ).toBe("dissolved");
});
it("Companies House UK establishment", () => {
  const f = fixture("companies-branch");
  expect(
    parseRecords("companies", f.response.results[0].text, f.url)[0],
  ).toMatchObject({ record_number: "BR008975", status: "inactive" });
});
it("checks identifier checksums", () => {
  expect(validNPI("1881018208")).toBe(true);
  expect(validNPI("1881018209")).toBe(false);
  expect(validABN("51824753556")).toBe(true);
  expect(validABN("51824753557")).toBe(false);
});
