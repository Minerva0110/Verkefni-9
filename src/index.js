import { el, empty } from "./lib/elements.js";
import { weatherSearch } from "./lib/weather.js";

/**
 * @typedef {Object} SearchLocation
 * @property {string} title
 * @property {number} lat
 * @property {number} lng
 */

/**
 * Allar staðsetning sem hægt er að fá veður fyrir.
 * @type Array<SearchLocation>
 */
const locations = [
  {
    title: "Reykjavík",
    lat: 64.1355,
    lng: -21.8954,
  },
  {
    title: "Akureyri",
    lat: 65.6835,
    lng: -18.0878,
  },
  {
    title: "New York",
    lat: 40.7128,
    lng: -74.006,
  },
  {
    title: "Tokyo",
    lat: 35.6764,
    lng: 139.65,
  },
  {
    title: "Sydney",
    lat: 33.8688,
    lng: 151.2093,
  },
];

/**
 * Hreinsar fyrri niðurstöður, passar að niðurstöður séu birtar og birtir element.
 * @param {Element} element
 */
function renderIntoResultsContent(element) {
  const outputElement = document.querySelector(".output");

  if (!outputElement) {
    console.warn("fann ekki .output");
    return;
  }

  empty(outputElement);
  outputElement.appendChild(element);
}

/**
 * Formatar dagsetningu í stílhreina útgáfu.
 * @param {string} isoString - ISO dagsetningarsnið
 * @returns {string} - Formateruð dagsetning
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  return date
    .toLocaleString("is-IS", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");
}

/**
 * Birtir niðurstöður í viðmóti.
 * @param {SearchLocation} location
 * @param {Array<import('./lib/weather.js').Forecast>} results
 */
function renderResults(location, results) {
  const header = el(
    "tr",
    {},
    el("th", {}, "Tími"),
    el("th", {}, "Hiti"),
    el("th", {}, "Úrkoma")
  );

  const body = results.map((result) =>
    el(
      "tr",
      {},
      el("td", {}, formatDate(result.time)),
      el("td", {}, `${result.temperature}°C`),
      el("td", {}, result.precipitation)
    )
  );

  const resultsTable = el("table", { class: "forecast" }, header, ...body);

  renderIntoResultsContent(
    el(
      "section",
      {},
      el("h2", {}, `Leitarniðurstöður fyrir: ${location.title}`),
      resultsTable
    )
  );
}

/**
 * Birta villu í viðmóti.
 * @param {Error} error
 */
function renderError(error) {
  console.log(error);
  const message = error.message;
  renderIntoResultsContent(el("p", {}, `Villa: ${message}`));
}

/**
 * Birta biðstöðu í viðmóti.
 */
function renderLoading() {
  renderIntoResultsContent(el("p", {}, "Leita..."));
}

/**
 * Framkvæmir leit að veðri fyrir gefna staðsetningu.
 * Birtir biðstöðu, villu eða niðurstöður í viðmóti.
 * @param {SearchLocation} location Staðsetning sem á að leita eftir.
 */
async function onSearch(location) {
  renderLoading();

  let results;
  try {
    results = await weatherSearch(location.lat, location.lng);
  } catch (error) {
    renderError(error);
    return;
  }

  renderResults(location, results ?? []);
}

/**
 * Framkvæmir leit að veðri fyrir núverandi staðsetningu.
 * Biður notanda um leyfi gegnum vafra.
 */
async function onSearchMyLocation() {
  if (!navigator.geolocation) {
    renderError(new Error("Geolocation is not supported by your browser."));
    return;
  }

  renderLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      let results;

      try {
        // notar staðsetningu til að finna veðurspá
        results = await weatherSearch(latitude, longitude);
        renderResults({ title: "Núverandi staðsetning" }, results ?? []);
      } catch (error) {
        renderError(error);
      }
    },

    (error) => {
      renderError(new Error(`Villa við að fá staðsetningu: ${error.message}`));
    }
  );
}

/**
 * Býr til takka fyrir staðsetningu.
 * @param {string} locationTitle
 * @param {() => void} onSearch
 * @returns {HTMLElement}
 */
function renderLocationButton(locationTitle, onSearch) {
  const locationElement = el(
    "li",
    { class: "locations__location" },
    el("button", { class: "locations__button", click: onSearch }, locationTitle)
  );

  return locationElement;
}

/**
 * Býr til grunnviðmót: haus og lýsingu, lista af staðsetningum og niðurstöður (falið í byrjun).
 * @param {Element} container HTML element sem inniheldur allt.
 * @param {Array<SearchLocation>} locations Staðsetningar sem hægt er að fá veður fyrir.
 * @param {(location: SearchLocation) => void} onSearch
 * @param {() => void} onSearchMyLocation
 */
function render(container, locations, onSearch, onSearchMyLocation) {
  // Búum til <main> og setjum `weather` class
  const parentElement = document.createElement("main");
  parentElement.classList.add("weather");

  // Búum til <header> með beinum DOM aðgerðum
  const headerElement = document.createElement("header");
  const heading = document.createElement("h1");
  heading.appendChild(document.createTextNode("🌧️ Veðurforrit ☀️")); // Change as needed
  headerElement.appendChild(heading);
  parentElement.appendChild(headerElement);

  const introText = el(
    "h2",
    {},
    "Velkomin/n í veðurforritið! Veldu stað til að sjá hita- og úrkomuspá."
  );

  parentElement.appendChild(introText);

  // Búum til <div> fyrir staðsetningar
  const locationsHeader = el("h2", {}, "Staðsetningar");
  parentElement.appendChild(locationsHeader); // Add header for locations

  const locationsElement = document.createElement("div");
  locationsElement.classList.add("locations");

  // Búa til <ul class="locations__list">
  const locationsListElement = document.createElement("ul");
  locationsListElement.classList.add("locations__list");

  // Búa til "Mín staðsetning" takka
  const myLocationButton = el(
    "li",
    { class: "locations__location" },
    el(
      "button",
      { class: "locations__button", click: onSearchMyLocation },
      "Mín staðsetning"
    ) // New button for current location
  );
  locationsListElement.appendChild(myLocationButton); // Add to the list

  // Búum til staðsetningu reiti
  for (const location of locations) {
    const liButtonElement = renderLocationButton(location.title, () => {
      onSearch(location);
    });
    locationsListElement.appendChild(liButtonElement);
  }

  locationsElement.appendChild(locationsListElement);
  parentElement.appendChild(locationsElement);

  // Búa til <div class="output"> fyrir niðurstöður
  const outputElement = document.createElement("div");
  outputElement.classList.add("output");
  parentElement.appendChild(outputElement);

  // Add a section header for results
  const resultsHeader = el("h2");
  parentElement.appendChild(resultsHeader);

  container.appendChild(parentElement);
}

// Þetta fall býr til grunnviðmót og setur það í `document.body`
render(document.body, locations, onSearch, onSearchMyLocation);
