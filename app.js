const nodesList = document.getElementById('nodesList');
const searchBar = document.getElementById('searchBar');
const ipTypeFilter = document.getElementById('ipTypeFilter');
const countryFilter = document.getElementById('countryFilter');
const cityFilter = document.getElementById('cityFilter');
const ispFilter = document.getElementById('ispFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const prevPageButton = document.getElementById('prevPageButton');
const nextPageButton = document.getElementById('nextPageButton');
const prevPageButton2 = document.getElementById('prevPageButton2');
const nextPageButton2 = document.getElementById('nextPageButton2');
const encodedProxyUrl = 'aHR0cHM6Ly9jb3JzLWJyZWFkLWJiN2MuYXJ3ay53b3JrZXJzLmRldi8/dXJsPQ==';
const encodedPath1 = 'aHR0cHM6Ly9kaXNjb3ZlcnkubXlzdGVyaXVtLm5ldHdvcmsvYXBpL3YzL3Byb3Bvc2Fscw==';
const encodedPath2 = 'aHR0cHM6Ly9kaXNjb3ZlcnktdWkubXlzdGVyaXVtLm5ldHdvcmsvYXBpL3YzL3Byb3Bvc2Fscw==';
const encodedIsoUrl = 'aHR0cHM6Ly9wdWJsaWMub3BlbmRhdGFzb2Z0LmNvbS9hcGkvZXhwbG9yZS92Mi4xL2NhdGFsb2cvZGF0YXNldHMvY291bnRyaWVzLWNvZGVzL3JlY29yZHM/c2VsZWN0PWxhYmVsX2VuJmxpbWl0PTEmcmVmaW5lPWlzbzJfY29kZTo=';

let nodeIds = [];
let currentPage = 1;
let nodesPerPage = 32;

const setNodesPerPage = () => {
    if (window.innerWidth <= 600) { 
        nodesPerPage = 10;
    } else {
        nodesPerPage = 32;
    }
};

setNodesPerPage();

let load = `<div align="center">
                <div align="center" class="loader"></div>
                <h2 id="fetching">Fetching Nodes List</h2>
            </div>`;
nodesList.innerHTML = load;

const proxyUrl = atob(encodedProxyUrl);
const path1 = atob(encodedPath1);
const path2 = atob(encodedPath2);
const isoUrl = atob(encodedIsoUrl);

const choosePath = () => {
    return Math.random() > 0.5 ? path1 : path2;
};

const loadNodes = async () => {
    try {
        const chosenPath = choosePath();
        const res = await fetch(`${proxyUrl}${chosenPath}`, {
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
                const res = await fetch(`${isoUrl}${countryCode}`);
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
    populateDropdown(ipTypeFilter, ipTypes.map(ipType => ipType.charAt(0).toUpperCase() + ipType.slice(1)));

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
    updateClearFiltersButtonState();

    const searchString = searchBar.value.toLowerCase();
    if (searchString && !searchString.startsWith('0x')) {
        showInvalidNodeIdError();
        return;
    }

    const selectedIpType = ipTypeFilter.value.toLowerCase();
    const selectedCountry = countryFilter.value.toLowerCase();
    const selectedCity = cityFilter.value.toLowerCase();
    const selectedIsp = ispFilter.value.toLowerCase();

    let filteredNodes = nodeIds.filter((node) => {
        return (
            (node.provider_id.toLowerCase().includes(searchString)) &&
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

setNodesPerPage();
window.addEventListener('resize', setNodesPerPage);

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
            const ispName = (node.location.ip_type.toLowerCase() === 'government' || node.location.ip_type.toLowerCase() === 'education')
                ? '-ISP Hidden-'
                : node.location.isp;
            const ipType = node.location.ip_type.charAt(0).toUpperCase() + node.location.ip_type.slice(1);
            return `
            <li class="nodes">
                <h4>${providerId}</h4>
                <p><b>IP Type: </b> ${ipType}</p>
                <p type="image/text"><b>Country: </b>${node.location.country_name} <img id="flags" src="asset/flags/${node.location.country}.png" alt="${node.location.country} flag"></p>
                <p><b>City: </b> ${node.location.city} (${ispName})</p>
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
    if (totalNodes > nodesPerPage) {
        prevPageButton.hidden = false;
        nextPageButton.hidden = false;
        prevPageButton2.hidden = false;
        nextPageButton2.hidden = false;
    } else {
        prevPageButton.hidden = true;
        nextPageButton.hidden = true;
        prevPageButton2.hidden = true;
        nextPageButton2.hidden = true;
    }
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages || totalNodes === 0;
    prevPageButton2.disabled = currentPage === 1;
    nextPageButton2.disabled = currentPage === totalPages || totalNodes === 0;
};

const clearFilters = () => {
    searchBar.value = '';
    ipTypeFilter.value = '';
    countryFilter.value = '';
    cityFilter.value = '';
    ispFilter.value = '';
    currentPage = 1; 
    filterNodes();
    updateClearFiltersButtonState();
};

const updateClearFiltersButtonState = () => {
    const isAnyFilterApplied = 
        searchBar.value !== '' ||
        ipTypeFilter.value !== '' ||
        countryFilter.value !== '' ||
        cityFilter.value !== '' ||
        ispFilter.value !== '';

    clearFiltersButton.disabled = !isAnyFilterApplied;
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
                <h2 id="fetchingErrorMessage">No Search Result. Please Check Search Query or Visit <a href="https://discovery-ui.mysterium.network">Discovery UI</a></h2>
                <h2 id="fetchingErrorCode">(API_NULL_RESPONSE_ERROR: Failed to fetch data from the API)</h2>

            </div>`;
    nodesList.innerHTML = noResult;
};

const showInvalidNodeIdError = () => {
    const invalidIdError = `<div align="center">
                <h2 id="invalidIdError">Invalid Search: Node ID must begin with "0x"</h2>
                <h2 id="invalidIdError2">Please ensure your Node ID starts with the correct prefix</h2>
            </div>`;
    nodesList.innerHTML = invalidIdError;
};

searchBar.addEventListener('keyup', () => {
    currentPage = 1; 
    filterNodes();
});

ipTypeFilter.addEventListener('change', () => {
    currentPage = 1; 
    filterNodes();
});

countryFilter.addEventListener('change', () => {
    currentPage = 1; 
    filterNodes();
});

cityFilter.addEventListener('change', () => {
    currentPage = 1; 
    filterNodes();
});

ispFilter.addEventListener('change', () => {
    currentPage = 1; 
    filterNodes();
});

clearFiltersButton.addEventListener('click', () => {
    clearFilters();
});

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

prevPageButton2.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayNodes(nodeIds);
    }
});

nextPageButton2.addEventListener('click', () => {
    const totalPages = Math.ceil(nodeIds.length / nodesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayNodes(nodeIds);
    }
});

loadNodes();