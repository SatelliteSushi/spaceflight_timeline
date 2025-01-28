// Configuration
const width = window.innerWidth;
const height = window.innerHeight - 80;
const casHeight = 80;
const startDate = new Date(1957, 9, 4);
const endDate = new Date();

// Setup containers
const container = d3.select("#timeline-container");
const svg = d3.select("#timeline")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "#0a0a0a");

// CAS System Container
const cas = d3.select("#cas");
const casLabel = cas.append("div")
    .attr("class", "cas-label");

// Time Scale
const timeScale = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, width]);

// Zoom Handler
const zoom = d3.zoom()
    .scaleExtent([0.1, 1e9])
    .translateExtent([[-1e6, -Infinity], [1e6, Infinity]])
    .on("zoom", zoomed);

svg.call(zoom);

// Axis Setup
const axis = d3.axisBottom(timeScale)
    .tickSize(10)
    .tickPadding(10);

const axisGroup = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height / 2})`)
    .call(axis);

// Sample Data
const launches = [
    { date: new Date(1969, 6, 20, 20, 17, 40), name: "Apollo 11 Landing" },
    { date: new Date(1990, 3, 24, 12, 33, 51), name: "Hubble Deployment" },
    { date: new Date(2020, 4, 30, 19, 22, 45), name: "Crew Dragon Launch" },
    { date: new Date(2012, 4, 22, 7, 44, 15), name: "SpaceX COTS 2" },
    { date: new Date(2011, 6, 8, 15, 29, 4), name: "STS-135 Launch" },
    { date: new Date(1998, 10, 20, 6, 40, 0), name: "ISS Zarya" },
];

// Launch Points
const points = svg.selectAll(".launch-point")
    .data(launches)
    .enter()
    .append("circle")
    .attr("class", "launch-point")
    .attr("r", 4)
    .attr("cx", d => timeScale(d.date))
    .attr("cy", height / 2);

// Tooltip
const tooltip = d3.select(".tooltip");

// CAS Configuration
const timeUnits = [
    {
        threshold: 31536000000 * 100, // Century
        format: d => `${d.getFullYear()}`
    },
    {
        threshold: 31536000000 * 20, // Decade
        format: d => `${d.getFullYear()}`
    },
    {
        threshold: 31536000000 * 2, // Year
        format: d => d3.timeFormat("%Y")(d)
    },
    {
        threshold: 2629800000, // Month
        format: d => d3.timeFormat("%B")(d).toUpperCase()
    },
    {
        threshold: 604800000, // Week
        format: d => `WEEK ${d3.timeWeek.count(d3.timeYear(d), d)}`
    },
    {
        threshold: 86400000, // Day
        format: d => d3.timeFormat("%e")(d)
    },
    {
        threshold: 3600000, // Hour
        format: d => d3.timeFormat("%H:%M")(d)
    }
];

function updateCAS(domain) {
    const timeSpan = domain[1] - domain[0];
    const midDate = new Date((domain[0].getTime() + domain[1].getTime()) / 2);
    
    // Determine current level
    let currentLevel = timeUnits.findIndex(u => timeSpan < u.threshold);
    if(currentLevel === -1) currentLevel = timeUnits.length - 1;
    
    // Build hierarchy (current level + parents)
    const hierarchy = [];
    for(let i = currentLevel; i >= 0 && hierarchy.length < 3; i--) {
        hierarchy.push({
            text: timeUnits[i].format(midDate),
            level: currentLevel - i
        });
    }

    // Update CAS elements
    const labels = casHierarchy.selectAll(".cas-level")
        .data(hierarchy, d => d.level);

    // Enter + Update
    const entering = labels.enter()
        .append("div")
        .attr("class", d => `cas-level ${getLevelClass(d.level)}`)
        .style("opacity", 0)
        .style("transform", "translateY(20px)");

    entering.merge(labels)
        .text(d => d.text)
        .transition()
        .duration(400)
        .style("opacity", 1)
        .style("transform", "translateY(0)");

    // Exit
    labels.exit()
        .transition()
        .duration(300)
        .style("opacity", 0)
        .style("transform", "translateY(-20px)")
        .remove();

    function getLevelClass(level) {
        return [
            "cas-current",
            "cas-parent",
            "cas-grandparent"
        ][level] || "";
    }
}

// Zoom Handler
function zoomed(event) {
    const transform = event.transform;
    const newScale = transform.rescaleX(timeScale);
    
    const t = svg.transition()
        .duration(300)
        .ease(d3.easeCubicOut);

    axisGroup.transition(t)
        .call(axis.scale(newScale));

    points.transition(t)
        .attrTween("cx", function(d) {
            const currentX = newScale(d.date);
            return t => d3.interpolateNumber(this.getAttribute("cx"), currentX)(t);
        });

    t.on("end", () => {
        updateTickFormatting(newScale);
        updateCAS(newScale.domain());
    });
}

// Axis Formatting (same as before)
function updateTickFormatting(scale) { /* ... */ }

// Event Listeners (same as before)
points.on("mouseover", function(event, d) { /* ... */ })
      .on("mouseout", () => tooltip.style("opacity", 0));

// Resize Handler (same as before)
window.addEventListener("resize", () => { /* ... */ });

// Initial Setup
updateCAS(timeScale.domain());