const nodesList = document.getElementById('nodesList');
const searchBar = document.getElementById('searchBar');

let nodeIds = [];

let load = `<div class="loader">
				<img src="asset/loader.gif"><h3>Loading Nodes List..</h3></img>
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
        const res = await fetch('https://protected-island-29616.herokuapp.com/https://discovery.mysterium.network/api/v3/proposals', {
		headers: {
			'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate'
				}
					});
		
        nodeIds = await res.json();
		console.log(nodeIds);
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
				<p><b>Country: </b> ${nodes.location.country}</p>
				<p><b>Quality: </b> ${nodes.quality.quality}</p>
				<p><b>Latency: </b> ${nodes.quality.latency}</p>
				<p><b>Bandwidth: </b> ${nodes.quality.bandwidth}</p>
                
            </li>
        `;
        })
        .join('');
    nodesList.innerHTML = htmlString;
};

loadNodes();