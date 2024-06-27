const nodesList = document.getElementById('nodesList');
const searchBar = document.getElementById('searchBar');
const ipTypeFilter = document.getElementById('ipTypeFilter');
const countryFilter = document.getElementById('countryFilter');
const cityFilter = document.getElementById('cityFilter');
const ispFilter = document.getElementById('ispFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');

let nodeIds = [];

// Initial loading message
let load = `<div align="center">
                <div align="center" class="loader"></div>
                <h2 id="fetching">Fetching Nodes List</h2>
            </div>`;
nodesList.innerHTML = load;

// Function to load nodes data from API
const loadNodes = async () => {
    try {
        const res = await fetch('https://cors-anywhere-qpb6.onrender.com/https://discovery.mysterium.network/api/v3/proposals', {
            headers: {
                'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
                'accept': 'application/json'
            }
        });

        nodeIds = await res.json();

        // Fetch country names for each node
        await fetchCountryNames(nodeIds);

        // Populate filter dropdowns with unique values
        populateFilterDropdowns(nodeIds);

        // Display nodes initially
        displayNodes(nodeIds);
    } catch (err) {
        console.error(err);
    }
};

// Function to fetch country names for each node
const fetchCountryNames = async (nodes) => {
    const countryPromises = nodes.map(async (node) => {
        const countryCode = node.location.country;
        let countryName = localStorage.getItem(countryCode); // Check local storage first

        if (!countryName) {
            try {
                const res = await fetch(`https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/countries-codes/records?select=label_en&limit=1&refine=iso2_code:${countryCode}`);
                const data = await res.json();
                countryName = data.results.length > 0 ? data.results[0].label_en : countryCode;
                localStorage.setItem(countryCode, countryName); // Store in local storage for future use
            } catch (err) {
                console.error(`Failed to fetch country name for ${countryCode}`, err);
                countryName = countryCode; // fallback to country code
            }
        }

        node.location.country_name = countryName;
    });

    await Promise.all(countryPromises);
};

// Function to populate filter dropdowns with unique values
const populateFilterDropdowns = (nodes) => {
    const ipTypes = [...new Set(nodes.map(node => node.location.ip_type))];
    populateDropdown(ipTypeFilter, ipTypes);

    const countries = [...new Set(nodes.map(node => node.location.country_name))];
    populateDropdown(countryFilter, countries);

    const cities = [...new Set(nodes.map(node => node.location.city))];
    populateDropdown(cityFilter, cities);

    const isps = [...new Set(nodes.map(node => node.location.isp))];
    populateDropdown(ispFilter, isps);
};

// Function to populate a dropdown with options
const populateDropdown = (dropdown, options) => {
    dropdown.innerHTML = '<option value="">All</option>';
    options.forEach(option => {
        dropdown.innerHTML += `<option value="${option}">${option}</option>`;
    });
};

// Function to filter nodes based on search and filters
const filterNodes = async () => {
    showFilteringLoader();

    const searchString = searchBar.value.toLowerCase();
    const selectedIpType = ipTypeFilter.value.toLowerCase();
    const selectedCountry = countryFilter.value.toLowerCase();
    const selectedCity = cityFilter.value.toLowerCase();
    const selectedIsp = ispFilter.value.toLowerCase();

    let filteredNodes = nodeIds.filter((node) => {
        return (
            (node.provider_id.toLowerCase().includes(searchString) ||
                node.location.city.toLowerCase().includes(searchString) ||
                node.location.isp.toLowerCase().includes(searchString) ||
                node.location.ip_type.toLowerCase().includes(searchString)) &&
            (selectedIpType === '' || node.location.ip_type.toLowerCase() === selectedIpType) &&
            (selectedCountry === '' || node.location.country_name.toLowerCase() === selectedCountry) &&
            (selectedCity === '' || node.location.city.toLowerCase() === selectedCity) &&
            (selectedIsp === '' || node.location.isp.toLowerCase() === selectedIsp)
        );
    });

    await displayFilteredNodes(filteredNodes);
};

// Function to display filtered nodes
const displayFilteredNodes = async (filteredNodes) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay for demonstration

    if (filteredNodes.length === 0) {
        showNoSearchResult();
    } else {
        displayNodes(filteredNodes);
    }
};

// Function to determine color dot based on quality value
const getColorDot = (quality) => {
    if (quality < 1.5) {
        return '<span class="dot red"></span>';
    } else if (quality >= 1.5 && quality <= 2.5) {
        return '<span class="dot yellow"></span>';
    } else {
        return '<span class="dot green"></span>';
    }
};

// Function to display nodes in the UI
const displayNodes = (nodes) => {
    const htmlString = nodes
        .map((node) => {
            const colorDot = getColorDot(node.quality.quality);
            return `
            <li class="nodes">
                <h4>${node.provider_id}</h4>
                <p><b>IP Type: </b> ${node.location.ip_type}</p>
                <p type="image/text"><b>Country: </b>${node.location.country_name} <img id="flags" src="asset/flags/${node.location.country}.png" alt="${node.location.country} flag"></p>
                <p><b>City: </b> ${node.location.city} (${node.location.isp})</p>
                <p><b>Quality: </b> ${colorDot} ${node.quality.quality}/3&nbsp;&nbsp; <b>Latency: </b> ${node.quality.latency}</p>
                <p><b>Bandwidth: </b> ${node.quality.bandwidth}&nbsp;&nbsp; <b>Uptime: </b> ${node.quality.uptime}</p>
            </li>
            `;
        })
        .join('');
    nodesList.innerHTML = htmlString;
};

const showFilteringLoader = () => {
    const filterLoad = `<div align="center">
                <div align="center" class="loader"></div>
                <h2 id="fetching">Filtering</h2>
            </div>`;
    nodesList.innerHTML = filterLoad;
};

const showNoSearchResult = () => {
    const noResult = `<div align="center">
                <h2 id="fetching">No Search Result. Please Check Search Query or Visit <a href="https://discovery-ui.mysterium.network">Discovery UI</a></h2>
            </div>`;
    nodesList.innerHTML = noResult;
};

const clearFilters = () => {
    searchBar.value = '';
    ipTypeFilter.value = '';
    countryFilter.value = '';
    cityFilter.value = '';
    ispFilter.value = '';
    filterNodes();
};

// Event listeners for search and filter changes
searchBar.addEventListener('keyup', filterNodes);
ipTypeFilter.addEventListener('change', filterNodes);
countryFilter.addEventListener('change', filterNodes);
cityFilter.addEventListener('change', filterNodes);
ispFilter.addEventListener('change', filterNodes);
clearFiltersButton.addEventListener('click', clearFilters);

// Load initial nodes data
loadNodes();
