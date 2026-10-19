/* TipSlice Travel Tipper places.
 * U.S. tax rates are copied from the cited public table. A city with no sourced rate is not listed.
 * Tipping figures outside the U.S. are country guidance, not a city custom.
 * Coordinates are city-center points used only to match a browser location to this list.
 */
(function (root) {
  'use strict';

  var norms = {
    US: {
      status: "expected",
      label: "Expected",
      percent: null,
      setsTip: false,
      text: "A tip is expected for sit-down service. Emily Post describes 15% to 20% of the pre-tax bill. The percent stays what you set. This list does not invent a separate custom for each U.S. city.",
      sources: [
        { name: "Emily Post Institute, general tipping guide", url: "https://emilypost.com/advice/general-tipping-guide" }
      ]
    },
    CA: {
      status: "expected",
      label: "Expected",
      percent: 15,
      setsTip: true,
      text: "A tip is expected. The Government of Canada says the standard tip is usually 15% of the bill, often for good service in restaurants, bars, taxis, and hotels. Destination Ontario says 15% to 20% is customary at bars and restaurants. Travel Alberta says about 15% to 20% of the pre-tax bill. Bonjour Québec says 10% to 15% of the bill before taxes in restaurants, bars, and taxis. The field starts at 15%, the Canada.ca figure, and does not average those ranges. The CRA says the percentage, and whether it is calculated before or after tax, depends on the customer. Toronto, Vancouver, Montreal, and Calgary share that starting field.",
      sources: [
        { name: "Government of Canada, settling in Canada: money", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/money.html" },
        { name: "CRA, GST/HST in special cases", url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-special-cases.html" },
        { name: "Destination Ontario, about Ontario", url: "https://www.destinationontario.com/en-ca/travel-resources/about-ontario" },
        { name: "Bonjour Québec, good to know", url: "https://www.bonjourquebec.com/en-us/plan-your-trip/useful-information/good-to-know-before-leave" },
        { name: "Travel Alberta, know before you go", url: "https://www.travelalberta.com/know-before-you-go" }
      ]
    },
    GB: {
      status: "optional",
      label: "Optional",
      percent: 0,
      setsTip: true,
      text: "Tipping is optional. VisitBritain says it is not expected the way it is in some countries, staff must be paid at least the National Minimum Wage, and an optional service charge is sometimes added. Check the bill before you add anything. If nothing was added, 10% to 15% for good restaurant service is described as well received, and taxi fares are often rounded up. London, Manchester, and Edinburgh start at 0%. You can type a percent if you are choosing to tip.",
      sources: [
        { name: "VisitBritain, useful information", url: "https://www.visitbritain.com/en/plan-your-trip/useful-information" }
      ]
    },
    FR: {
      status: "service-included",
      label: "Service usually included",
      percent: 0,
      setsTip: true,
      text: "Check the bill for a service charge before you add a tip. France's DGCCRF says service is included in the displayed price and that a tip cannot be demanded. Where service is charged, the menu says \"prix service compris.\" France.fr says prices usually include tax and a 15% service charge, and that another 2% to 3% is customary only when a meal was particularly good. Paris, Lyon, and Nice start at 0%. You can type a percent after you have read the bill.",
      sources: [
        { name: "DGCCRF, Pourboire", url: "https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Pourboire" },
        { name: "France.fr, money", url: "https://www.france.fr/en/article/money-france/" }
      ]
    },
    DE: {
      status: "service-included",
      label: "Service usually included",
      percent: 0,
      setsTip: true,
      text: "Check the bill for a service charge before you add a tip. The German National Tourist Board's 2026 advisor guide says service is generally included in restaurant prices. If the bill has no such charge and you want to leave something extra, about 5% to 10% is customary. Berlin.de says a tip is voluntary and that 5% to 10% of a restaurant or cafe bill is appropriate. Berlin, Munich, and Hamburg start at 0% so a second percent is not stacked on included service. You can type 5 or 10 after you have read the bill.",
      sources: [
        { name: "German National Tourist Board, 2026 resource guide (PDF)", url: "https://www.germany.travel/media/redaktion/trade_relaunch/news_services/Germany_Resource_Guide_For_Travel_Advisors_2026.pdf" },
        { name: "Berlin.de, Trinkgeld", url: "https://www.berlin.de/tourismus/infos/1758234-1721039-trinkgeld.html" }
      ]
    },
    JP: {
      status: "not-customary",
      label: "Not customary",
      percent: 0,
      setsTip: true,
      text: "Tipping is not common. The Japan National Tourism Organization says it is not common to tip at bars, cafes, restaurants, taxis, or hotels. A gratuity called kokorozuke, from the heart, may be accepted by a private guide or interpreter used to overseas practice. It is not expected, and it should be discreet, in an envelope sold at convenience stores, stationery stores, or 100-yen stores. Tokyo's official visitor guide says a restaurant tip will almost certainly be refused, and that there is no need to tip a taxi driver. Tokyo, Osaka, and Kyoto are set to 0%. You can change the percent if you still want to leave something.",
      sources: [
        { name: "Japan National Tourism Organization, tipping in Japan", url: "https://www.japan.travel/en/plan/tipping-in-japan/" },
        { name: "Go Tokyo, How to Enjoy Tokyo (PDF)", url: "https://www.gotokyo.org/book/wp-content/uploads/2025/09/2509_HowtoEnjoyTokyo_EN_low.pdf" }
      ]
    },
    AU: {
      status: "optional",
      label: "Optional",
      percent: 0,
      setsTip: true,
      text: "Tipping is optional. Tourism Australia says hotels and restaurants do not add a service charge, tipping is your choice, and it is not expected in most places. In upmarket restaurants, 10% for good service is common. Sydney, Melbourne, and Brisbane start at 0%. Type 10 if you are choosing to leave that.",
      sources: [
        { name: "Tourism Australia, key facts", url: "https://www.australia.com/en/facts-and-planning/about-australia/key-facts-about-australia.html" }
      ]
    },
    KR: {
      status: "not-customary",
      label: "Not customary",
      percent: 0,
      setsTip: true,
      text: "A tip is not required or expected. VisitKorea says tipping is not required or expected in Korea, and that extra water or side dishes do not add a charge. A later food page says there is no need to tip. The taxi page says most taxis charge by the meter and do not require a tip, and that passengers can pay with cash, a credit card, or a transportation card. Seoul, Busan, and Incheon are set to 0%. You can change the percent if you still want to leave something.",
      sources: [
        { name: "VisitKorea, about Korean food", url: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=140727" },
        { name: "VisitKorea, about Korean food (July 25, 2025)", url: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=229195" },
        { name: "VisitKorea, taxi", url: "https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=140661" }
      ]
    },
    IT: {
      status: "optional",
      label: "Optional",
      percent: 0,
      setsTip: true,
      text: "Tipping is optional. Italia.it says tipping is not compulsory and there are no established rules, but it is customary to leave an amount close to 10% of the bill when you are satisfied with the service. The education ministry says a tip is welcome but not an obligation, and that most restaurants charge a fixed fee called coperto. Lazio law forbids an additional coperto charge. Rome, Milan, and Florence start at 0%. Type a percent close to 10 if you are choosing to leave that.",
      sources: [
        { name: "Italia.it, money, payments, and tipping", url: "https://www.italia.it/en/italy/practical-information/money-payments-and-tipping-in-italy" },
        { name: "Italian Ministry of Education, study in Italy", url: "https://miur.mur.gov.it/studiare-in-italia/living/free-time.html" },
        { name: "Lazio Regional Law 22/2019, Article 75 (PDF)", url: "https://www.regione.lazio.it/sites/default/files/documentazione/SVI_Legge_Regionale_06_11_2019_n22_TESTO_UNICO_COMMERCIO.pdf" }
      ]
    },
    ES: {
      status: "service-included",
      label: "Service usually included",
      percent: 0,
      setsTip: true,
      text: "Check the bill before you add a tip. Spain's tourism site says it is not obligatory to tip because establishments include the service charge. It is still common to tip in bars, restaurants, hotels, and taxis, usually between 5% and 10% of the total, depending on the bill and the guest. Madrid, Barcelona, and Seville start at 0%. Type 5 or 10 after you have read the bill.",
      sources: [
        { name: "spain.info, currency and tips", url: "https://www.spain.info/en/travel-tips/coins-banknotes/" }
      ]
    },
    NL: {
      status: "optional",
      label: "Optional",
      percent: 0,
      setsTip: true,
      text: "Tipping is optional. Holland.com says a tip of about 10% is quite acceptable, that the amount is not set in stone, and that you can leave more for a fantastic experience or nothing if the service or meal was poor. Waitstaff are not described as living off tips. Amsterdam, Rotterdam, and The Hague start at 0%. You can type 10 if you are choosing that amount.",
      sources: [
        { name: "Holland.com, tipping and cash", url: "https://www.holland.com/global/tourism/getting-around/information/tipping-and-cash" }
      ]
    },
    CH: {
      status: "round-up",
      label: "Round up",
      percent: 0,
      setsTip: true,
      text: "Switzerland Tourism says the guest is not obliged to tip. In many restaurants it is customary to pay a tip of approximately 10%, or to round the bill up to a round amount. Zurich, Geneva, and Bern start at 0% so the page does not invent a percent when the source also allows a round-up. You can type 10 if that is the amount you want.",
      sources: [
        { name: "Switzerland Tourism, tipping", url: "https://www.myswitzerland.com/en-us/planning/about-switzerland/general-facts/money-and-shopping/tipping/" }
      ]
    },
    MX: {
      status: "expected",
      label: "Expected",
      percent: 10,
      setsTip: true,
      text: "A tip is common and not mandatory on the tourism secretariat FAQ, which says 10% to 15% is common in restaurants and that small tips are appreciated for hotel housekeeping and tour guides. VisitMexico says 10% to 15% is customary for meals or drinks in restaurants, bars, and street stands, and that a few coins are usual for porters, cab drivers, and cleaning staff. Profeco says a tip is voluntary and cannot be added to the bill without consent. Mexico City, Guadalajara, and Cancún start at 10%, the low end of that range. You can change it.",
      sources: [
        { name: "Mexico Ministry of Tourism, visitor FAQ", url: "https://www.mexico-invita.sectur.gob.mx/en/useful-services/faq" },
        { name: "VisitMexico, frequently asked questions", url: "https://visitmexico.com/en/pagina/preguntas-frecuentes" },
        { name: "Profeco, voluntary tip (20 May 2026)", url: "https://mundialsocial.profeco.gob.mx/blog/propina-voluntaria/" }
      ]
    },
    DK: {
      status: "service-included",
      label: "Service usually included",
      percent: 0,
      setsTip: true,
      text: "Check the bill before you add a tip. VisitDenmark says service charges are included in hotel, restaurant, and taxi bills. If you feel you received great service, you may tip, and how much is up to you. There is no set etiquette. Copenhagen, Aarhus, and Odense start at 0%.",
      sources: [
        { name: "VisitDenmark, tipping", url: "https://www.visitdenmark.com/faq/tipping" }
      ]
    },
    BR: {
      status: "optional",
      label: "Optional",
      percent: 0,
      setsTip: true,
      text: "Tipping is optional. Visit Brasil says tips are not mandatory but are appreciated. In restaurants, bars, and similar services, it is common to leave approximately 10% of the total where a tip is not already included in the service price. Hotels: a small tip is customary for staff providing additional services. Rio de Janeiro, São Paulo, and Brasília start at 0%. Type 10 only after you have checked whether the bill already includes it.",
      sources: [
        { name: "Visit Brasil, taxes and tips", url: "https://www.visitbrasil.com/en/info/taxes-and-tips/" }
      ]
    },
    SG: {
      status: "service-included",
      label: "Service usually included",
      percent: 0,
      setsTip: true,
      text: "Check the bill before you add a tip. Visit Singapore says tipping is not common because many establishments already include a 10% service charge. Some restaurants and bars omit that charge and leave tipping optional; in that case a 10% tip is appreciated. Singapore starts at 0%.",
      sources: [
        { name: "Visit Singapore, essential guide (PDF)", url: "https://www.visitsingapore.com/content/dam/MICE/Global/downloads/bt_precinct_guide.pdf" }
      ]
    },
    VN: {
      status: "optional",
      label: "Optional",
      percent: 0,
      setsTip: true,
      text: "Tipping is optional. Vietnam Tourism says there is no set rule because tipping is not a normal part of Vietnamese culture. It is increasingly common for beauty salons and private tour guides. In restaurants and cafes it is not expected, but it is appreciated. Hanoi, Ho Chi Minh City, and Da Nang start at 0%. You can type a percent if you want to leave one.",
      sources: [
        { name: "Vietnam Tourism, currency and payments", url: "https://vietnam.travel/things-to-do/currency-and-payments-vietnam" }
      ]
    },
    AE: {
      status: "optional",
      label: "Optional",
      percent: 0,
      setsTip: true,
      text: "This note is the emirate of Abu Dhabi, from Experience Abu Dhabi, not a separate rule for every emirate. Tipping is not expected, but it is commonly practised. Many fine-dining bills add a service charge, usually around 10%, and a tourism levy of 6%. If those charges are not included, 10% to 15% is described as an appreciated addition. Abu Dhabi starts at 0%. Check the bill, then type a percent only if you are adding one.",
      sources: [
        { name: "Experience Abu Dhabi, essential information", url: "https://visitabudhabi.ae/en/plan-your-trip/essential-info" }
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
      currency: "USD", lat: lat, lng: lng, taxPercent: rate, tax: tax, norm: "US"
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
    abroad("brisbane", "Brisbane", "Queensland", "Australia", "AU", "AUD", -27.4698, 153.0251),
    abroad("seoul", "Seoul", "Seoul", "South Korea", "KR", "KRW", 37.5665, 126.978),
    abroad("busan", "Busan", "Busan", "South Korea", "KR", "KRW", 35.1796, 129.0756),
    abroad("incheon", "Incheon", "Incheon", "South Korea", "KR", "KRW", 37.4563, 126.7052),
    abroad("rome", "Rome", "Lazio", "Italy", "IT", "EUR", 41.9028, 12.4964),
    abroad("milan", "Milan", "Lombardy", "Italy", "IT", "EUR", 45.4642, 9.19),
    abroad("florence", "Florence", "Tuscany", "Italy", "IT", "EUR", 43.7696, 11.2558),
    abroad("madrid", "Madrid", "Community of Madrid", "Spain", "ES", "EUR", 40.4168, -3.7038),
    abroad("barcelona", "Barcelona", "Catalonia", "Spain", "ES", "EUR", 41.3874, 2.1686),
    abroad("seville", "Seville", "Andalusia", "Spain", "ES", "EUR", 37.3891, -5.9845),
    abroad("amsterdam", "Amsterdam", "North Holland", "Netherlands", "NL", "EUR", 52.3676, 4.9041),
    abroad("rotterdam", "Rotterdam", "South Holland", "Netherlands", "NL", "EUR", 51.9225, 4.4792),
    abroad("the-hague", "The Hague", "South Holland", "Netherlands", "NL", "EUR", 52.0705, 4.3007),
    abroad("zurich", "Zurich", "Zurich", "Switzerland", "CH", "CHF", 47.3769, 8.5417),
    abroad("geneva", "Geneva", "Geneva", "Switzerland", "CH", "CHF", 46.2044, 6.1432),
    abroad("bern", "Bern", "Bern", "Switzerland", "CH", "CHF", 46.948, 7.4474),
    abroad("mexico-city", "Mexico City", "Mexico City", "Mexico", "MX", "MXN", 19.4326, -99.1332),
    abroad("guadalajara", "Guadalajara", "Jalisco", "Mexico", "MX", "MXN", 20.6597, -103.3496),
    abroad("cancun", "Cancún", "Quintana Roo", "Mexico", "MX", "MXN", 21.1619, -86.8515),
    abroad("copenhagen", "Copenhagen", "Capital Region", "Denmark", "DK", "DKK", 55.6761, 12.5683),
    abroad("aarhus", "Aarhus", "Central Denmark", "Denmark", "DK", "DKK", 56.1629, 10.2039),
    abroad("odense", "Odense", "Southern Denmark", "Denmark", "DK", "DKK", 55.4038, 10.4024),
    abroad("rio", "Rio de Janeiro", "Rio de Janeiro", "Brazil", "BR", "BRL", -22.9068, -43.1729),
    abroad("sao-paulo", "São Paulo", "São Paulo", "Brazil", "BR", "BRL", -23.5558, -46.6396),
    abroad("brasilia", "Brasília", "Federal District", "Brazil", "BR", "BRL", -15.7975, -47.8919),
    abroad("singapore", "Singapore", "Singapore", "Singapore", "SG", "SGD", 1.3521, 103.8198),
    abroad("hanoi", "Hanoi", "Hanoi", "Vietnam", "VN", "VND", 21.0278, 105.8342),
    abroad("ho-chi-minh-city", "Ho Chi Minh City", "Ho Chi Minh City", "Vietnam", "VN", "VND", 10.8231, 106.6297),
    abroad("da-nang", "Da Nang", "Da Nang", "Vietnam", "VN", "VND", 16.0544, 108.2022),
    abroad("abu-dhabi", "Abu Dhabi", "Abu Dhabi", "United Arab Emirates", "AE", "AED", 24.4539, 54.3773)
  ];

  root.TRAVEL_TIPPER_DATA = { updated: "2026-10-17", norms: norms, places: places };
  if (typeof module === "object" && module.exports) module.exports = root.TRAVEL_TIPPER_DATA;
})(typeof window !== "undefined" ? window : globalThis);
