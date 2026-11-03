import { it, expect } from "vitest";
import { rankCandidates, parseRecords } from "../src/registries";
it("ranks current company names before former-name hits and labels the source alias", () => {
 const record = (name: string, number: string, former = "") => parseRecords("companies", `Company Overview for ${name} (${number})\nCompany status\nactive\n${former ? `| ${former} | 01 January 2000 |` : ""}`, `https://find-and-update.company-information.service.gov.uk/company/${number}`)[0];
 const result = rankCandidates([record("KFORD TYRES (GORNAL) LTD", "09384423", "TESCO TYRES LTD"), record("TESCO PLC", "00445790"), record("TESCO HOLDINGS LTD", "12345678")], "TESCO PLC", "companies");
 expect(result.map(r => r.name)).toEqual(["TESCO PLC", "TESCO HOLDINGS LTD", "KFORD TYRES (GORNAL) LTD"]);
 expect(result[2]).toMatchObject({name_match:"former_name",matched_former_name:"TESCO TYRES LTD"});
});
