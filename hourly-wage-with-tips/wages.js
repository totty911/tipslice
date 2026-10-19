/* DOL Minimum Wages for Tipped Employees, table dated July 1, 2026. Checked 2026-10-19. */
(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  if (root) root.TIPPED_WAGES = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function row(id, name, combined, credit, cash, tips, method, note) {
    return { id: id, name: name, combined: combined, credit: credit, cash: cash, tips: tips, method: method, note: note || "" };
  }
  const f4 = "Footnote 4: The Florida minimum wage is scheduled to increase by $1.00 every year on September 30th until reaching $15.00 on September 30, 2026.";
  const f15 = "Footnote 15: The minimum direct cash wage for tipped employees in Michigan is scheduled to increase annually until it reaches 50 percent of the state minimum wage in 2031. Additionally, the Michigan minimum wage is scheduled to increase on January 1, 2027 (to $15.00 per hour); it is then scheduled to be adjusted annually based on a set formula.";
  const rows = [
    row("FLSA", "Federal (FLSA)", "7.25", "5.12", "2.13", "More than $30", "credit", ""),
    row("AK", "Alaska", "", "", "14.00", "", "full", "Full state minimum before tips."),
    row("CA", "California", "", "", "16.90", "", "full", "Full state minimum before tips."),
    row("GU", "Guam", "", "", "9.25", "", "full", "Full state minimum before tips."),
    row("MN", "Minnesota", "", "", "11.41", "", "full", "Full state minimum before tips."),
    row("MT-large", "Montana, sales over $110,000", "", "", "10.85", "", "full", "Full cash wage for businesses with gross annual sales over $110,000."),
    row("MT-small", "Montana, not covered by the FLSA, sales of $110,000 or less", "", "", "4.00", "", "full", "DOL prints $4.00 for this tier. Confirm coverage with the state labor office before treating it as the wage you were owed."),
    row("NV", "Nevada", "", "", "12.00", "", "full", "Full state minimum before tips."),
    row("OR-std", "Oregon, standard", "", "", "15.55", "", "full", "The Oregon minimum wage varies by region."),
    row("OR-pdx", "Oregon, Portland metro", "", "", "16.80", "", "full", "The Oregon minimum wage varies by region."),
    row("OR-rural", "Oregon, nonurban counties", "", "", "14.55", "", "full", "The Oregon minimum wage varies by region."),
    row("WA", "Washington", "", "", "17.13", "", "full", "Full state minimum before tips."),
    row("AZ", "Arizona", "15.15", "3.00", "12.15", "Not specified", "credit", ""),
    row("AR", "Arkansas", "11.00", "8.37", "2.63", "Not specified", "credit", ""),
    row("CO", "Colorado", "15.16", "3.02", "12.14", "More than $30", "credit", ""),
    row("CT-hotel", "Connecticut, hotel and restaurant", "16.94", "10.56", "6.38", "Not specified", "credit", "Footnote 2: The Connecticut minimum wage is adjusted annually based on a set formula."),
    row("CT-bar", "Connecticut, bartenders who customarily receive tips", "16.94", "8.71", "8.23", "", "credit", "Footnote 2: The Connecticut minimum wage is adjusted annually based on a set formula."),
    row("DE", "Delaware", "15.00", "12.77", "2.23", "More than $30", "credit", ""),
    row("DC", "District of Columbia", "18.40", "8.10", "10.30", "Not specified", "credit", "Footnote 3: Employers must currently pay a minimum cash wage of at least 56% the standard minimum wage and may claim the remaining difference in tip credit."),
    row("FL", "Florida", "14.00", "3.02", "10.98", "More than $30", "credit", f4),
    row("HI", "Hawaii", "16.00", "1.25", "14.75", "", "credit", "Hawaii: Tip credit is permissible if the combined amount the employee receives from the employer and in tips is at least $7.00 more than the applicable minimum wage."),
    row("ID", "Idaho", "7.25", "3.90", "3.35", "More than $30", "credit", ""),
    row("IL", "Illinois", "15.00", "40% of the applicable minimum wage ($6.00)", "9.00", "Not specified", "credit", ""),
    row("IA", "Iowa", "7.25", "40% of the applicable minimum wage ($2.90)", "4.35", "More than $30", "credit", ""),
    row("ME", "Maine", "15.10", "50% of the applicable minimum wage ($7.55)", "7.55", "More than $191", "credit", ""),
    row("MD", "Maryland", "15.00", "11.37", "3.63", "More than $30", "credit", ""),
    row("MA", "Massachusetts", "15.00", "8.25", "6.75", "More than $20", "credit", ""),
    row("MI", "Michigan", "13.73", "8.24", "5.49", "Not specified", "credit", f15),
    row("MO", "Missouri", "15.00", "50% of the applicable minimum wage ($7.50)", "7.50", "Not specified", "credit", ""),
    row("NH", "New Hampshire", "7.25", "3.98", "3.27", "More than $30", "credit", ""),
    row("NJ", "New Jersey", "15.92", "9.87", "6.05", "More than $30", "credit", "Footnote 6 also states a minimum wage of $15.23 per hour for employers who employ fewer than 6 people and employees engaged in seasonal employment. This row is the $15.92 line."),
    row("NM", "New Mexico", "12.00", "9.00", "3.00", "More than $30", "credit", ""),
    row("NY", "New York", "17.00 (NYC, Long Island, & Westchester); 16.00 (remainder of NY state)", "Tipped workers' minimum wage rates vary by region and type of employer.", "", "Not specified", "note", "See New York's Minimum Wage overview. This calculator does not pick one regional cash wage."),
    row("ND", "North Dakota", "7.25", "33% of the applicable minimum wage ($2.39)", "4.86", "More than $30", "credit", ""),
    row("OH", "Ohio, gross receipts of $405,000 or more", "11.00", "5.50", "5.50", "More than $30", "credit", "Footnote 7: For employees of employers with gross annual sales of less than $405,000, the state minimum wage is $7.25 per hour."),
    row("OK", "Oklahoma", "7.25", "5.12", "2.13", "Not specified", "credit", "Footnote 8 describes a $2.00 basic rate for some small employers and a different credit for employers not covered by the FLSA. This row is the $7.25 / $2.13 line."),
    row("PA", "Pennsylvania", "7.25", "4.42", "2.83", "$135 per month", "credit", ""),
    row("RI", "Rhode Island", "16.00", "12.11", "3.89", "More than $30", "credit", ""),
    row("SD", "South Dakota", "11.85", "50% of the applicable minimum wage ($5.92)", "5.93", "More than $35", "credit", ""),
    row("VT", "Vermont", "14.42", "50% of the applicable minimum wage ($7.21)", "7.21", "More than $120", "credit", ""),
    row("VI", "Virgin Islands", "10.50", "6.30", "4.20", "Not specified", "credit", "Minimum cash wage is printed as 40% of the applicable minimum wage ($4.20)."),
    row("WI", "Wisconsin", "7.25", "4.92", "2.33", "Not specified", "credit", "Footnote 9: A cash wage of $2.13 may be paid to an opportunity employee under 20 who has been employed 90 or fewer consecutive days. The minimum wage for opportunity employees is $5.90."),
    row("WV", "West Virginia", "8.75", "70% of the applicable minimum wage ($6.13)", "2.62", "Not specified", "credit", "Footnote 10: The state minimum wage law applies only to employers with six or more employees and to state agencies."),
    row("AL", "Alabama", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 11: Alabama has no state minimum wage law. Employers must pay employees covered by the FLSA at least the federal minimum wage."),
    row("AS", "American Samoa", "Special minimum wage rates", "", "2.13", "More than $30", "note", "DOL prints special minimum wage rates rather than one combined figure."),
    row("GA", "Georgia", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 11: Georgia has a state minimum wage law, but it does not apply to tipped employees."),
    row("IN", "Indiana", "7.25", "5.12", "2.13", "More than $30", "credit", ""),
    row("KS", "Kansas", "7.25", "5.12", "2.13", "Not specified", "credit", "Footnote 12: Kansas excludes from coverage any employment subject to the FLSA."),
    row("KY", "Kentucky", "7.25", "5.12", "2.13", "More than $30", "credit", ""),
    row("LA", "Louisiana", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 11: Louisiana has no state minimum wage law."),
    row("MS", "Mississippi", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 11: Mississippi has no state minimum wage law."),
    row("NE", "Nebraska", "15.00", "12.87", "2.13", "Not specified", "credit", ""),
    row("NC", "North Carolina", "7.25", "5.12", "2.13", "More than $20", "credit", "Footnote 13: Tip credit is not permitted unless the employer obtains a signed certification of tips."),
    row("MP", "Northern Mariana Islands", "7.25", "5.12", "2.13", "More than $30", "credit", ""),
    row("PR", "Puerto Rico", "10.50", "8.37", "2.13", "More than $30", "credit", ""),
    row("SC", "South Carolina", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 11: South Carolina has no state minimum wage law."),
    row("TN", "Tennessee", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 11: Tennessee has no state minimum wage law."),
    row("TX", "Texas", "7.25", "5.12", "2.13", "More than $20", "credit", "Footnote 12: Texas excludes from coverage any employment subject to the FLSA."),
    row("UT", "Utah", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 12: Utah excludes from coverage any employment subject to the FLSA."),
    row("VA", "Virginia", "12.77", "10.64", "2.13", "More than $30", "credit", ""),
    row("WY", "Wyoming", "7.25", "5.12", "2.13", "More than $30", "credit", "Footnote 14: The Wyoming minimum wage is $5.15 per hour. Employers must pay employees covered by the FLSA at least the federal minimum wage.")
  ];
  return {
    source: "https://www.dol.gov/agencies/whd/state/minimum-wage/tipped",
    revised: "2026-07-01",
    checked: "2026-10-19",
    nextCheck: "2027-01-01",
    rows: rows
  };
});
