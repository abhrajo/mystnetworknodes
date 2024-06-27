const nodesList = document.getElementById('nodesList');
const searchBar = document.getElementById('searchBar');
const ipTypeFilter = document.getElementById('ipTypeFilter');
const countryFilter = document.getElementById('countryFilter');
const cityFilter = document.getElementById('cityFilter');
const ispFilter = document.getElementById('ispFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const prevPageButton = document.getElementById('prevPageButton');
const nextPageButton = document.getElementById('nextPageButton');

let nodeIds = [];
let currentPage = 1;
const nodesPerPage = 30;

let load = `<div align="center">
                <div align="center" class="loader"></div>
                <h2 id="fetching">Fetching Nodes List</h2>
            </div>`;
nodesList.innerHTML = load;

const loadNodes = async () => {
    try {
        const res = await fetch('https://cors-anywhere-qpb6.onrender.com/https://discovery.mysterium.network/api/v3/proposals', {
            headers: {
                'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
                'accept': 'application/json'
            }
        });

        nodeIds = await res.json();

        await fetchCountryNames(nodeIds);

        populateFilterDropdowns(nodeIds);

        displayNodes(nodeIds);
    } catch (err) {
        console.error(err);
    }
};

const fetchCountryNames = async (nodes) => {
    const countryPromises = nodes.map(async (node) => {
        const countryCode = node.location.country;
        let countryName = localStorage.getItem(countryCode);

        if (!countryName) {
            try {
                const res = await fetch(`https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/countries-codes/records?select=label_en&limit=1&refine=iso2_code:${countryCode}`);
                const data = await res.json();
                countryName = data.results.length > 0 ? data.results[0].label_en : countryCode;
                localStorage.setItem(countryCode, countryName);
            } catch (err) {
                console.error(`Failed to fetch country name for ${countryCode}`, err);
                countryName = countryCode;
            }
        }

        node.location.country_name = countryName;
    });

    await Promise.all(countryPromises);
};

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

const populateDropdown = (dropdown, options) => {
    dropdown.innerHTML = '<option value="">All</option>';
    options.sort().forEach(option => {
        dropdown.innerHTML += `<option value="${option}">${option}</option>`;
    });
};

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

const displayFilteredNodes = async (filteredNodes) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (filteredNodes.length === 0) {
        showNoSearchResult();
    } else {
        displayNodes(filteredNodes);
    }
};

const getColorDot = (quality) => {
    if (quality < 1.5) {
        return '<span class="dot red"></span>';
    } else if (quality >= 1.5 && quality <= 2.5) {
        return '<span class="dot yellow"></span>';
    } else {
        return '<span class="dot green"></span>';
    }
};

const displayNodes = (nodes) => {
    const startIndex = (currentPage - 1) * nodesPerPage;
    const endIndex = startIndex + nodesPerPage;
    const currentNodes = nodes.slice(startIndex, endIndex);

    const htmlString = currentNodes
        .map((node) => {
            const colorDot = getColorDot(node.quality.quality);
            const providerId = (node.location.ip_type.toLowerCase() === 'government' || node.location.ip_type.toLowerCase() === 'education')
                ? `masked_uuid_${uuid.v4()}`
                : node.provider_id;
            return `
            <li class="nodes">
                <h4>${providerId}</h4>
                <p><b>IP Type: </b> ${node.location.ip_type}</p>
                <p type="image/text"><b>Country: </b>${node.location.country_name} <img id="flags" src="asset/flags/${node.location.country}.png" alt="${node.location.country} flag"></p>
                <p><b>City: </b> ${node.location.city} (${node.location.isp})</p>
                <p><b>Quality: </b> ${colorDot} ${node.quality.quality.toFixed(1)}/3&nbsp;&nbsp; <b>Latency: </b> ${node.quality.latency}</p>
                <p><b>Bandwidth: </b> ${node.quality.bandwidth}&nbsp;&nbsp; <b>Uptime: </b> ${node.quality.uptime}</p>
            </li>
            `;
        })
        .join('');
    nodesList.innerHTML = htmlString;

    updatePaginationButtons(nodes.length);
};

const updatePaginationButtons = (totalNodes) => {
    const totalPages = Math.ceil(totalNodes / nodesPerPage);
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages || totalNodes === 0;
};

const clearFilters = () => {
    searchBar.value = '';
    ipTypeFilter.value = '';
    countryFilter.value = '';
    cityFilter.value = '';
    ispFilter.value = '';
    filterNodes();
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

searchBar.addEventListener('keyup', filterNodes);
ipTypeFilter.addEventListener('change', filterNodes);
countryFilter.addEventListener('change', filterNodes);
cityFilter.addEventListener('change', filterNodes);
ispFilter.addEventListener('change', filterNodes);
clearFiltersButton.addEventListener('click', clearFilters);
prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayNodes(nodeIds);
    }
});
nextPageButton.addEventListener('click', () => {
    const totalPages = Math.ceil(nodeIds.length / nodesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayNodes(nodeIds);
    }
});

loadNodes();
