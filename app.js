const nodesList = document.getElementById('nodesList');
const searchBar = document.getElementById('searchBar');

let nodeIds = [];

let load = `<div align="center">
				<div align="center" class="loader"></div>
				<h2 id="fetching">Fetching Nodes List</h2>
			</div>`;
document.getElementById('nodesList').innerHTML = load;


searchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value.toLowerCase();

    const filteredNodes = nodeIds.filter((nodes) => {
        return (
            nodes.provider_id.toLowerCase().includes(searchString)
			
        );
    });
    displayNodes(filteredNodes);
});

const loadNodes = async () => {
    try {
        const res = await fetch('https://cors-anywhere-qpb6.onrender.com/https://discovery.mysterium.network/api/v3/proposals', {
		headers: {
			'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
				}
					});
		
        nodeIds = await res.json();
        displayNodes(nodeIds);
    } catch (err) {
        console.error(err);
    }
};

const displayNodes = (nodes) => {
    const htmlString = nodes
        .map((nodes) => {
            return `
            <li class="nodes">
                <h4>${nodes.provider_id}</h4>
				<p><b>IP Type: </b> ${nodes.location.ip_type}</p>
				<p type="image/text"><b>Country: </b>${nodes.location.country} <img id="flags" src="asset/flags/${nodes.location.country}.png" alt="${nodes.location.country} flag"></img></a></p>
                <p><b>City: </b> ${nodes.location.city} (${nodes.location.isp})</p>
				<p><b>Quality: </b> ${nodes.quality.quality}/3&nbsp;&nbsp; <b>Latency: </b> ${nodes.quality.latency}</p>
				<p><b>Bandwidth: </b> ${nodes.quality.bandwidth}&nbsp;&nbsp; <b>Uptime: </b> ${nodes.quality.uptime}</p>
                
            </li>
        `;
        })
        .join('');
    nodesList.innerHTML = htmlString;
};

loadNodes();