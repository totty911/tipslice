/* TipSlice Travel Tipper places.
 * U.S. tax rates are copied from the cited public table. A city with no sourced rate is not listed.
 * Tipping figures outside the U.S. are country guidance, not a city custom.
 * Coordinates are city-center points used only to match a browser location to this list.
 */
(function (root) {
  'use strict';

  var norms = {
    CA: {
      percent: 15,
      text: "The Government of Canada says the standard tip is usually 15% of the bill, and that tipping for good service is common in restaurants, bars, taxis, and hotels. Toronto, Vancouver, Montreal, and Calgary all use that country figure. This list does not invent a separate percent for each city.",
      sources: [
        { name: "Government of Canada, settling in Canada: money", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/money.html" }
      ]
    },
    GB: {
      percent: 10,
      text: "VisitBritain says tipping is not expected the way it is in some countries, staff must be paid at least the National Minimum Wage, and an optional service charge is sometimes added. If nothing was added, 10% to 15% for good restaurant service is described as well received. The field starts at 10%, the low end of that range, for London, Manchester, and Edinburgh alike.",
      sources: [
        { name: "VisitBritain, useful information", url: "https://www.visitbritain.com/en/plan-your-trip/useful-information" }
      ]
    },
    FR: {
      percent: 0,
      text: "France's DGCCRF says service is included in the displayed price and that a tip cannot be demanded. France.fr says prices usually include tax and a 15% service charge, and that another 2% to 3% is customary when a meal was particularly good. Paris, Lyon, and Nice start at 0% for that reason.",
      sources: [
        { name: "DGCCRF, Pourboire", url: "https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Pourboire" },
        { name: "France.fr, money", url: "https://www.france.fr/en/article/money-france/" }
      ]
    },
    DE: {
      percent: 5,
      text: "The German National Tourist Board's 2026 advisor guide says service is generally included and that it is customary to leave about 5% to 10%. Berlin, Munich, and Hamburg start at 5%, the low end of that range.",
      sources: [
        { name: "German National Tourist Board, 2026 resource guide (PDF)", url: "https://www.germany.travel/media/redaktion/trade_relaunch/news_services/Germany_Resource_Guide_For_Travel_Advisors_2026.pdf" }
      ]
    },
    JP: {
      percent: 0,
      text: "The Japan National Tourism Organization says tipping is not common for restaurants, cafes, bars, taxis, or hotels, and that it can cause discomfort. A service charge is often already on a restaurant bill. Tokyo, Osaka, and Kyoto stay at 0%.",
      sources: [
        { name: "Japan National Tourism Organization, tipping in Japan", url: "https://www.japan.travel/en/plan/tipping-in-japan/" }
      ]
    },
    AU: {
      percent: 0,
      text: "Tourism Australia says hotels and restaurants do not add a service charge, tipping is your choice, and it is not expected in most places. In upmarket restaurants, 10% for good service is common. Sydney, Melbourne, and Brisbane start at 0%.",
      sources: [
        { name: "Tourism Australia, key facts", url: "https://www.australia.com/en/facts-and-planning/about-australia/key-facts-about-australia.html" }
      ]
    }
  };

  var cdtfa = {
    name: "California Department of Tax and Fee Administration, city and county sales and use tax rates",
    url: "https://cdtfa.ca.gov/taxes-and-fees/rates.aspx",
    asOf: "2026-10-01",
    asOfLabel: "Effective October 1, 2026"
  };
  var texas = {
    name: "Texas Comptroller of Public Accounts, city sales and use tax",
    url: "https://comptroller.texas.gov/taxes/sales/city.php",
    asOf: "2026-10-17",
    asOfLabel: "City table retrieved October 17, 2026"
  };

  function us(id, city, region, lat, lng, rate, tax) {
    return {
      id: id, city: city, region: region, country: "United States", countryCode: "US",
      currency: "USD", lat: lat, lng: lng, taxPercent: rate, tax: tax, norm: null
    };
  }
  function abroad(id, city, region, country, code, currency, lat, lng) {
    return {
      id: id, city: city, region: region, country: country, countryCode: code,
      currency: currency, lat: lat, lng: lng, taxPercent: 0, tax: null, norm: code
    };
  }

  var places = [
    us("nyc", "New York", "New York", 40.7128, -74.006, 8.875, {
      name: "New York State Department of Taxation and Finance, Publication 718",
      url: "https://www.tax.ny.gov/pdf/publications/sales/pub718.pdf",
      asOf: "2025-03-01",
      asOfLabel: "Effective March 1, 2025",
      note: "Publication 718 lists New York City at 8 7/8% (reporting code 8081). The starred rate includes the 3/8% Metropolitan Commuter Transportation District tax. The Department's current-rates page still pointed at this edition when this file was checked on October 17, 2026."
    }),
    us("los-angeles", "Los Angeles", "California", 34.0522, -118.2437, 10.25, Object.assign({ note: "Los Angeles city row, 10.250%." }, cdtfa)),
    us("long-beach", "Long Beach", "California", 33.7701, -118.1937, 11, Object.assign({ note: "Long Beach city row, 11.000%." }, cdtfa)),
    us("san-francisco", "San Francisco", "California", 37.7749, -122.4194, 8.625, Object.assign({ note: "San Francisco city row, 8.625%." }, cdtfa)),
    us("san-diego", "San Diego", "California", 32.7157, -117.1611, 7.75, Object.assign({ note: "San Diego city row, 7.750%." }, cdtfa)),
    us("san-jose", "San Jose", "California", 37.3382, -121.8863, 10, Object.assign({ note: "San Jose city row, 10.000%." }, cdtfa)),
    us("oakland", "Oakland", "California", 37.8044, -122.2712, 10.75, Object.assign({ note: "Oakland city row, 10.750%." }, cdtfa)),
    us("sacramento", "Sacramento", "California", 38.5816, -121.4944, 8.75, Object.assign({ note: "Sacramento city row, 8.750%." }, cdtfa)),
    us("anaheim", "Anaheim", "California", 33.8366, -117.9143, 7.75, Object.assign({ note: "Anaheim city row, 7.750%." }, cdtfa)),
    us("bakersfield", "Bakersfield", "California", 35.3733, -119.0187, 8.25, Object.assign({ note: "Bakersfield city row, 8.250%." }, cdtfa)),
    us("berkeley", "Berkeley", "California", 37.8715, -122.273, 10.25, Object.assign({ note: "Berkeley city row, 10.250%." }, cdtfa)),
    us("fresno", "Fresno", "California", 36.7378, -119.7871, 8.35, Object.assign({ note: "Fresno city row, 8.350%." }, cdtfa)),
    us("irvine", "Irvine", "California", 33.6846, -117.8265, 7.75, Object.assign({ note: "Irvine city row, 7.750%." }, cdtfa)),
    us("pasadena", "Pasadena", "California", 34.1478, -118.1445, 11, Object.assign({ note: "Pasadena city row, 11.000%." }, cdtfa)),
    us("santa-monica", "Santa Monica", "California", 34.0195, -118.4912, 11.25, Object.assign({ note: "Santa Monica city row, 11.250%." }, cdtfa)),
    us("seattle", "Seattle", "Washington", 47.6062, -122.3321, 10.55, {
      name: "Washington Department of Revenue, local sales and use tax rates, Quarter 4 2026",
      url: "https://dor.wa.gov/sites/default/files/2026-08/Q426_LSU-flyer-by-county.pdf",
      asOf: "2026-10-01",
      asOfLabel: "Effective October 1 through December 31, 2026",
      note: "King County location code 1726, Seattle: local 4.05% plus state 6.50%, combined 10.55%. A different address in King County can be a different row."
    }),
    us("houston", "Houston", "Texas", 29.7604, -95.3698, 8.25, Object.assign({ note: "Houston city rows, including Harris County, show a total rate of 8.25%." }, texas)),
    us("dallas", "Dallas", "Texas", 32.7767, -96.797, 8.25, Object.assign({ note: "Dallas city rows, including Dallas County, show a total rate of 8.25%." }, texas)),
    us("austin", "Austin", "Texas", 30.2672, -97.7431, 8.25, Object.assign({ note: "Austin in Travis County shows a total rate of 8.25%." }, texas)),
    us("san-antonio", "San Antonio", "Texas", 29.4241, -98.4936, 8.25, Object.assign({ note: "San Antonio in Bexar County shows a total rate of 8.25%." }, texas)),
    us("fort-worth", "Fort Worth", "Texas", 32.7555, -97.3308, 8.25, Object.assign({ note: "Fort Worth in Tarrant County shows a total rate of 8.25%." }, texas)),
    us("el-paso", "El Paso", "Texas", 31.7619, -106.485, 8.25, Object.assign({ note: "El Paso city row shows a total rate of 8.25%." }, texas)),
    us("boston", "Boston", "Massachusetts", 42.3601, -71.0589, 7, {
      name: "Massachusetts Department of Revenue, sales tax on meals, and the local-option meals report",
      url: "https://www.mass.gov/guides/sales-tax-on-meals",
      asOf: "2026-02-25",
      asOfLabel: "Meals guide updated June 26, 2026; local-option table current as of February 25, 2026",
      note: "Restaurant meals are taxed at 6.25% statewide. Boston adopted the 0.75% local meals excise, effective October 1, 2009, so the meals total is 7%. This is the meals rate, not the rate on general merchandise."
    }),
    us("cambridge", "Cambridge", "Massachusetts", 42.3736, -71.1097, 7, {
      name: "Massachusetts Department of Revenue, sales tax on meals, and the local-option meals report",
      url: "https://www.mass.gov/guides/sales-tax-on-meals",
      asOf: "2026-02-25",
      asOfLabel: "Meals guide updated June 26, 2026; local-option table current as of February 25, 2026",
      note: "Cambridge also adopted the 0.75% local meals excise, effective October 1, 2009. Added to the 6.25% state meals tax, the meals total is 7%."
    }),
    us("portland-or", "Portland", "Oregon", 45.5152, -122.6784, 0, {
      name: "Oregon Department of Revenue, sales tax in Oregon",
      url: "https://www.oregon.gov/dor/programs/businesses/pages/sales-tax.aspx",
      asOf: "2026-10-17",
      asOfLabel: "Page checked October 17, 2026",
      note: "Oregon does not have a general sales or use tax, so a Portland meal check does not add one. Lodging and some other excise taxes are separate and are not included here."
    }),
    abroad("toronto", "Toronto", "Ontario", "Canada", "CA", "CAD", 43.6532, -79.3832),
    abroad("vancouver", "Vancouver", "British Columbia", "Canada", "CA", "CAD", 49.2827, -123.1207),
    abroad("montreal", "Montreal", "Quebec", "Canada", "CA", "CAD", 45.5017, -73.5673),
    abroad("calgary", "Calgary", "Alberta", "Canada", "CA", "CAD", 51.0447, -114.0719),
    abroad("london", "London", "England", "United Kingdom", "GB", "GBP", 51.5074, -0.1278),
    abroad("manchester", "Manchester", "England", "United Kingdom", "GB", "GBP", 53.4808, -2.2426),
    abroad("edinburgh", "Edinburgh", "Scotland", "United Kingdom", "GB", "GBP", 55.9533, -3.1883),
    abroad("paris", "Paris", "Île-de-France", "France", "FR", "EUR", 48.8566, 2.3522),
    abroad("lyon", "Lyon", "Auvergne-Rhône-Alpes", "France", "FR", "EUR", 45.764, 4.8357),
    abroad("nice", "Nice", "Provence-Alpes-Côte d'Azur", "France", "FR", "EUR", 43.7102, 7.262),
    abroad("berlin", "Berlin", "Berlin", "Germany", "DE", "EUR", 52.52, 13.405),
    abroad("munich", "Munich", "Bavaria", "Germany", "DE", "EUR", 48.1351, 11.582),
    abroad("hamburg", "Hamburg", "Hamburg", "Germany", "DE", "EUR", 53.5511, 9.9937),
    abroad("tokyo", "Tokyo", "Tokyo", "Japan", "JP", "JPY", 35.6762, 139.6503),
    abroad("osaka", "Osaka", "Osaka", "Japan", "JP", "JPY", 34.6937, 135.5023),
    abroad("kyoto", "Kyoto", "Kyoto", "Japan", "JP", "JPY", 35.0116, 135.7681),
    abroad("sydney", "Sydney", "New South Wales", "Australia", "AU", "AUD", -33.8688, 151.2093),
    abroad("melbourne", "Melbourne", "Victoria", "Australia", "AU", "AUD", -37.8136, 144.9631),
    abroad("brisbane", "Brisbane", "Queensland", "Australia", "AU", "AUD", -27.4698, 153.0251)
  ];

  root.TRAVEL_TIPPER_DATA = { updated: "2026-10-17", norms: norms, places: places };
  if (typeof module === "object" && module.exports) module.exports = root.TRAVEL_TIPPER_DATA;
})(typeof window !== "undefined" ? window : globalThis);
