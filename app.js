class SpaceflightTimeline {
    constructor() {
        this.launches = [];
        this.filteredLaunches = [];
        this.selectedLaunch = null;
        this.zoomLevel = 1;
        this.panOffset = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.apiUrl = 'https://ll2.craigmouser.com/2.3.0/launches/upcoming/?format=json';
        this.pastApiUrl = 'https://ll2.craigmouser.com/2.3.0/launches/previous/?format=json';
        
        // Timeline state
        this.timeRange = {
            start: new Date(),
            end: new Date()
        };
        this.visibleTimeRange = {
            start: new Date(),
            end: new Date()
        };
        this.canvasWidth = 0;
        this.timeScale = 1; // pixels per millisecond
        
        // Smooth scrolling and momentum
        this.momentum = {
            velocity: 0,
            lastTime: 0,
            isAnimating: false
        };
        
        // Infinite timeline support
        this.baseTime = new Date('1969-01-01'); // Start from 1969
        this.maxTime = new Date('2050-01-01'); // Extend to 2050
        this.currentTimeCenter = new Date(); // Center of current view
        this.timeSpan = 30 * 24 * 60 * 60 * 1000; // 30 days default view
        
        // Rendering optimization
        this.renderScheduled = false;
        this.currentHoverLaunch = null;
        
        this.targetTimeSpan = this.timeSpan;
        this.targetTimeCenter = this.currentTimeCenter;
        this.zoomAnimation = { inProgress: false };
        
        this.panHistory = [];
        this.panMomentum = { inProgress: false };
        
        this.justZoomed = false;
        this.wheelEventInProgress = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadLaunches();
        // Start real-time indicator update
        setInterval(() => this.updateCurrentTimeIndicator(), 1000);
    }

    // Fallback data in case API is not accessible
    getFallbackData() {
        return {
            "count": 336,
            "next": "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json&limit=10&offset=10",
            "previous": null,
            "results": [
                {
                    "id": "d260a1bc-c448-4751-8ea6-bc20a3cab779",
                    "name": "HASTE | JAKE 4",
                    "status": {
                        "id": 1,
                        "name": "Go for Launch",
                        "abbrev": "Go",
                        "description": "Current T-0 confirmed by official or reliable sources."
                    },
                    "net": "2025-07-11T23:45:00Z",
                    "launch_service_provider": {
                        "id": 147,
                        "name": "Rocket Lab",
                        "abbrev": "RL",
                        "type": {"id": 3, "name": "Commercial"}
                    },
                    "rocket": {
                        "id": 8660,
                        "configuration": {
                            "id": 26,
                            "name": "Electron",
                            "families": [],
                            "full_name": "Electron",
                            "variant": ""
                        }
                    },
                    "mission": {
                        "id": 7252,
                        "name": "JAKE 4",
                        "type": "Government/Top Secret",
                        "description": "Sub-orbital launch under Rocket Lab's Hypersonic Accelerator Suborbital Test Electron (HASTE) program, details TBD."
                    },
                    "pad": {
                        "id": 79,
                        "name": "Rocket Lab Launch Complex 2 (Launch Area 0 C)",
                        "location": {
                            "id": 21,
                            "name": "Wallops Flight Facility, Virginia, USA"
                        }
                    }
                },
                {
                    "id": "example-2",
                    "name": "Starlink 8-1",
                    "status": {
                        "id": 2,
                        "name": "TBD",
                        "abbrev": "TBD",
                        "description": "To be determined."
                    },
                    "net": "2025-07-15T10:30:00Z",
                    "launch_service_provider": {
                        "id": 121,
                        "name": "SpaceX",
                        "abbrev": "SPX",
                        "type": {"id": 3, "name": "Commercial"}
                    },
                    "rocket": {
                        "id": 8661,
                        "configuration": {
                            "id": 27,
                            "name": "Falcon 9",
                            "families": [],
                            "full_name": "Falcon 9",
                            "variant": "Block 5"
                        }
                    },
                    "mission": {
                        "id": 7253,
                        "name": "Starlink 8-1",
                        "type": "Communications",
                        "description": "A SpaceX Falcon 9 rocket will launch Starlink satellites to low Earth orbit."
                    },
                    "pad": {
                        "id": 80,
                        "name": "Launch Complex 40",
                        "location": {
                            "id": 22,
                            "name": "Cape Canaveral Space Force Station, Florida, USA"
                        }
                    }
                },
                {
                    "id": "example-3",
                    "name": "Artemis II",
                    "status": {
                        "id": 3,
                        "name": "TBD",
                        "abbrev": "TBD",
                        "description": "To be determined."
                    },
                    "net": "2025-09-20T14:00:00Z",
                    "launch_service_provider": {
                        "id": 44,
                        "name": "NASA",
                        "abbrev": "NASA",
                        "type": {"id": 1, "name": "Government"}
                    },
                    "rocket": {
                        "id": 8662,
                        "configuration": {
                            "id": 28,
                            "name": "SLS",
                            "families": [],
                            "full_name": "Space Launch System",
                            "variant": "Block 1"
                        }
                    },
                    "mission": {
                        "id": 7254,
                        "name": "Artemis II",
                        "type": "Human Exploration",
                        "description": "NASA's Artemis II mission will send astronauts around the Moon and back to Earth."
                    },
                    "pad": {
                        "id": 81,
                        "name": "Launch Complex 39B",
                        "location": {
                            "id": 23,
                            "name": "Kennedy Space Center, Florida, USA"
                        }
                    }
                },
                // Add some past launches for testing
                {
                    "id": "past-1",
                    "name": "Apollo 11",
                    "status": {
                        "id": 4,
                        "name": "Success",
                        "abbrev": "Success",
                        "description": "Mission completed successfully."
                    },
                    "net": "1969-07-16T13:32:00Z",
                    "launch_service_provider": {
                        "id": 44,
                        "name": "NASA",
                        "abbrev": "NASA",
                        "type": {"id": 1, "name": "Government"}
                    },
                    "rocket": {
                        "id": 8663,
                        "configuration": {
                            "id": 29,
                            "name": "Saturn V",
                            "families": [],
                            "full_name": "Saturn V",
                            "variant": ""
                        }
                    },
                    "mission": {
                        "id": 7255,
                        "name": "Apollo 11",
                        "type": "Human Exploration",
                        "description": "First human landing on the Moon. Neil Armstrong and Buzz Aldrin became the first humans to walk on the lunar surface."
                    },
                    "pad": {
                        "id": 82,
                        "name": "Launch Complex 39A",
                        "location": {
                            "id": 23,
                            "name": "Kennedy Space Center, Florida, USA"
                        }
                    }
                },
                {
                    "id": "past-2",
                    "name": "Space Shuttle Discovery STS-31",
                    "status": {
                        "id": 4,
                        "name": "Success",
                        "abbrev": "Success",
                        "description": "Mission completed successfully."
                    },
                    "net": "1990-04-24T12:33:00Z",
                    "launch_service_provider": {
                        "id": 44,
                        "name": "NASA",
                        "abbrev": "NASA",
                        "type": {"id": 1, "name": "Government"}
                    },
                    "rocket": {
                        "id": 8664,
                        "configuration": {
                            "id": 30,
                            "name": "Space Shuttle",
                            "families": [],
                            "full_name": "Space Shuttle",
                            "variant": "Discovery"
                        }
                    },
                    "mission": {
                        "id": 7256,
                        "name": "Hubble Space Telescope Deployment",
                        "type": "Science",
                        "description": "Deployed the Hubble Space Telescope, which has revolutionized our understanding of the universe."
                    },
                    "pad": {
                        "id": 82,
                        "name": "Launch Complex 39A",
                        "location": {
                            "id": 23,
                            "name": "Kennedy Space Center, Florida, USA"
                        }
                    }
                }
            ]
        };
    }

    initializeElements() {
        this.elements = {
            loading: document.getElementById('loading'),
            timelineContainer: document.getElementById('timeline-container'),
            timelineWrapper: document.getElementById('timeline-wrapper'),
            timelineCanvas: document.getElementById('timeline-canvas'),
            timelineAxis: document.getElementById('timeline-axis'),
            timelineRuler: document.getElementById('timeline-ruler'),
            launchPoints: document.getElementById('launch-points'),
            hoverCard: document.getElementById('hover-card'),
            launchCount: document.getElementById('launch-count'),
            timeRange: document.getElementById('time-range'),
            zoomLevel: document.getElementById('zoom-level'),
            currentTimeRange: document.getElementById('current-time-range'),
            launchDetails: document.getElementById('launch-details'),
            detailsTitle: document.getElementById('details-title'),
            detailsContent: document.getElementById('details-content'),
            closeDetails: document.getElementById('close-details'),
            refreshBtn: document.getElementById('refresh-btn'),
            zoomIn: document.getElementById('zoom-in'),
            zoomOut: document.getElementById('zoom-out'),
            resetView: document.getElementById('reset-view'),
            fitView: document.getElementById('fit-view'),
            filters: {
                agency: document.getElementById('agency-filter'),
                status: document.getElementById('status-filter'),
                dateRange: document.getElementById('date-range'),
                startDate: document.getElementById('start-date'),
                endDate: document.getElementById('end-date'),
                search: document.getElementById('search')
            },
            timelineRulers: document.getElementById('timeline-rulers'),
            centerLineIndicator: document.getElementById('center-line-indicator'),
            centerDateLabel: document.getElementById('center-date-label')
        };
    }

    bindEvents() {
        // Filter events
        this.elements.filters.agency.addEventListener('change', () => this.applyFilters());
        this.elements.filters.status.addEventListener('change', () => this.applyFilters());
        this.elements.filters.dateRange.addEventListener('change', () => this.handleDateRangeChange());
        this.elements.filters.startDate.addEventListener('change', () => this.applyFilters());
        this.elements.filters.endDate.addEventListener('change', () => this.applyFilters());
        this.elements.filters.search.addEventListener('input', () => this.applyFilters());

        // Control events
        this.elements.refreshBtn.addEventListener('click', () => this.loadLaunches());
        this.elements.fallbackBtn = document.getElementById('fallback-btn');
        this.elements.fallbackBtn.addEventListener('click', () => this.loadFallbackData());
        this.elements.zoomIn.addEventListener('click', () => this.zoomIn());
        this.elements.zoomOut.addEventListener('click', () => this.zoomOut());
        this.elements.resetView.addEventListener('click', () => this.resetView());
        this.elements.fitView.addEventListener('click', () => this.fitToView());

        // Timeline interaction events
        this.elements.timelineCanvas.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false });
        this.elements.timelineCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.elements.timelineCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.elements.timelineCanvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.elements.timelineCanvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Touch events for mobile
        this.elements.timelineCanvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.elements.timelineCanvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.elements.timelineCanvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Modal events
        this.elements.closeDetails.addEventListener('click', () => this.closeDetails());
        this.elements.launchDetails.addEventListener('click', (e) => {
            if (e.target === this.elements.launchDetails) {
                this.closeDetails();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDetails();
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    async loadLaunches() {
        try {
            this.showLoading(true);
            
            // Fetch both upcoming and past launches
            console.log('Fetching upcoming launches from:', this.apiUrl);
            const upcomingResponse = await fetch(this.apiUrl);
            console.log('Upcoming response status:', upcomingResponse.status);
            
            if (!upcomingResponse.ok) {
                throw new Error(`HTTP error! status: ${upcomingResponse.status}`);
            }
            
            const upcomingData = await upcomingResponse.json();
            console.log('Upcoming API Response:', upcomingData);
            
            // Fetch past launches
            console.log('Fetching past launches from:', this.pastApiUrl);
            const pastResponse = await fetch(this.pastApiUrl);
            console.log('Past response status:', pastResponse.status);
            
            let pastData = { results: [] };
            if (pastResponse.ok) {
                pastData = await pastResponse.json();
                console.log('Past API Response:', pastData);
            } else {
                console.warn('Failed to fetch past launches, continuing with upcoming only');
            }
            
            // Combine upcoming and past launches
            this.launches = [
                ...(upcomingData.results || []),
                ...(pastData.results || [])
            ];
            
            console.log('Total launches loaded:', this.launches.length);
            console.log('Upcoming launches:', upcomingData.results?.length || 0);
            console.log('Past launches:', pastData.results?.length || 0);
            
            if (this.launches.length === 0) {
                console.warn('No launches found in the response');
            }
            
            this.populateAgencyFilter();
            this.applyFilters();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error loading launches:', error);
            
            // Try alternative API endpoints if the first ones fail
            if (this.apiUrl.includes('ll2.craigmouser.com')) {
                console.log('Trying alternative API endpoints...');
                this.apiUrl = 'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json';
                this.pastApiUrl = 'https://ll.thespacedevs.com/2.3.0/launches/previous/?format=json';
                this.loadLaunches();
                return;
            }
            
            // If both API endpoints fail, use fallback data
            console.log('Using fallback data...');
            const fallbackData = this.getFallbackData();
            this.launches = fallbackData.results || [];
            console.log('Using fallback data with', this.launches.length, 'launches');
            
            this.populateAgencyFilter();
            this.applyFilters();
            this.showLoading(false);
            
            // Show a warning that we're using fallback data
            setTimeout(() => {
                this.showError('Using offline data. Some information may be outdated.');
            }, 1000);
        }
    }

    populateAgencyFilter() {
        const agencies = [...new Set(this.launches.map(launch => launch.launch_service_provider?.name).filter(Boolean))];
        agencies.sort();
        
        this.elements.filters.agency.innerHTML = '<option value="">All Agencies</option>';
        agencies.forEach(agency => {
            const option = document.createElement('option');
            option.value = agency;
            option.textContent = agency;
            this.elements.filters.agency.appendChild(option);
        });
    }

    applyFilters() {
        const agencyFilter = this.elements.filters.agency.value;
        const statusFilter = this.elements.filters.status.value;
        const dateRangeFilter = this.elements.filters.dateRange.value;
        const searchFilter = this.elements.filters.search.value.toLowerCase();

        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        
        // Handle different date range filters
        if (dateRangeFilter.startsWith('past-')) {
            // Past date ranges
            const days = parseInt(dateRangeFilter.replace('past-', ''));
            startDate.setDate(now.getDate() - days);
            endDate = new Date(now); // Up to now
        } else if (dateRangeFilter === 'all-time') {
            // All launches (past and upcoming)
            startDate = new Date('1969-01-01'); // Start from 1969
            endDate = new Date('2050-01-01'); // Extend to 2050
        } else if (dateRangeFilter === 'all') {
            // All upcoming
            startDate = new Date(now);
            endDate.setFullYear(now.getFullYear() + 10); // 10 years into future
        } else if (dateRangeFilter === 'custom') {
            // Custom date range
            const startDateStr = this.elements.filters.startDate.value;
            const endDateStr = this.elements.filters.endDate.value;
            
            if (startDateStr && endDateStr) {
                startDate = new Date(startDateStr + 'T00:00:00Z');
                endDate = new Date(endDateStr + 'T23:59:59Z');
            } else {
                // If custom dates are not set, use default range
                startDate = new Date(now);
                endDate.setDate(now.getDate() + 30);
            }
        } else {
            // Future date ranges
            const days = parseInt(dateRangeFilter);
            startDate = new Date(now);
            endDate.setDate(now.getDate() + days);
        }

        this.filteredLaunches = this.launches.filter(launch => {
            // Agency filter
            if (agencyFilter && launch.launch_service_provider?.name !== agencyFilter) {
                return false;
            }

            // Status filter
            if (statusFilter && launch.status?.name !== statusFilter) {
                return false;
            }

            // Date range filter
            const launchDate = new Date(launch.net);
            if (launchDate < startDate || launchDate > endDate) {
                return false;
            }

            // Search filter
            if (searchFilter) {
                const searchText = `${launch.mission?.name || ''} ${launch.rocket?.configuration?.name || ''} ${launch.launch_service_provider?.name || ''} ${launch.name || ''}`.toLowerCase();
                if (!searchText.includes(searchFilter)) {
                    return false;
                }
            }

            return true;
        });

        this.updateTimeRange();
        this.smoothRenderTimeline();
    }

    handleDateRangeChange() {
        const dateRangeValue = this.elements.filters.dateRange.value;
        const customDateRange = document.getElementById('custom-date-range');
        const customDateRangeEnd = document.getElementById('custom-date-range-end');
        
        if (dateRangeValue === 'custom') {
            customDateRange.style.display = 'flex';
            customDateRangeEnd.style.display = 'flex';
            
            // Set default dates (last 30 days to next 30 days)
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            const thirtyDaysFromNow = new Date(now);
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            
            this.elements.filters.startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
            this.elements.filters.endDate.value = thirtyDaysFromNow.toISOString().split('T')[0];
        } else {
            customDateRange.style.display = 'none';
            customDateRangeEnd.style.display = 'none';
        }
        
        this.applyFilters();
    }

    updateTimeRange() {
        // Calculate the visible time range based on current center and span
        const halfSpan = this.timeSpan / 2;
        this.timeRange.start = new Date(this.currentTimeCenter.getTime() - halfSpan);
        this.timeRange.end = new Date(this.currentTimeCenter.getTime() + halfSpan);
        
        // Ensure we stay within bounds
        if (this.timeRange.start < this.baseTime) {
            this.timeRange.start = new Date(this.baseTime);
            this.timeRange.end = new Date(this.baseTime.getTime() + this.timeSpan);
        }
        if (this.timeRange.end > this.maxTime) {
            this.timeRange.end = new Date(this.maxTime);
            this.timeRange.start = new Date(this.maxTime.getTime() - this.timeSpan);
        }
    }

    renderTimeline() {
        this.elements.launchCount.textContent = this.filteredLaunches.length;
        
        // Always render ruler and points, even if no launches
        this.renderRuler();
        this.renderLaunchPoints();
        this.updateTimeInfo();
        this.updateCurrentTimeIndicator();
        this.updateTimelineTransform();
    }

    smoothRenderTimeline() {
        // Use requestAnimationFrame for smooth rendering
        if (!this.renderScheduled) {
            this.renderScheduled = true;
            requestAnimationFrame(() => {
                this.renderTimeline();
                this.renderScheduled = false;
            });
        }
        this.updateCurrentTimeIndicator();
        this.updateCenterLineIndicator();
        this.updateTimelineTransform();
    }

    renderRuler() {
        const rulersContainer = this.elements.timelineRulers;
        rulersContainer.innerHTML = '';
        const timeSpan = this.timeRange.end - this.timeRange.start;
        const canvasWidth = this.elements.timelineCanvas.offsetWidth;
        const intervals = this.getDynamicTimeIntervals(timeSpan, canvasWidth);
        const unitClassMap = {
            'decade': 'level-decade',
            'year': 'level-year',
            'month': 'level-month',
            'day': 'level-day',
            'hour': 'level-hour',
            'minute': 'level-minute',
            'second': 'level-second'
        };
        const formatMap = {
            'decade': d => Math.floor(d.getFullYear() / 10) * 10 + 's',
            'year': d => d.getFullYear(),
            'month': d => d.toLocaleString('en-US', { month: 'short' }),
            'day': d => {
                const day = d.getDate();
                const suffix = this.getOrdinalSuffix(day);
                return day + suffix;
            },
            'hour': d => d.getHours() + 'h',
            'minute': d => d.getMinutes() + 'm',
            'second': d => d.getSeconds()
        };
        intervals.forEach((intervalData, level) => {
            const { interval, format, opacity, showLabels } = intervalData;
            let start = new Date(this.timeRange.start);
            let end = new Date(this.timeRange.end);
            start = this.roundToInterval(start, interval);
            const ruler = document.createElement('div');
            ruler.className = `timeline-ruler active ${unitClassMap[interval.unit] || ''}`;
            ruler.style.opacity = opacity;
            ruler.style.position = 'relative';
            rulersContainer.appendChild(ruler);
            // Collect all tick dates for this bar
            let tickDates = [];
            if (interval.unit === 'decade') {
                let decade = Math.floor(start.getFullYear() / 10) * 10;
                const endDecade = Math.floor(end.getFullYear() / 10) * 10;
                while (decade <= endDecade) {
                    tickDates.push(new Date(decade, 0, 1, 0, 0, 0, 0));
                    decade += 10;
                }
            } else if (interval.unit === 'year') {
                for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
                    tickDates.push(new Date(year, 0, 1, 0, 0, 0, 0));
                }
            } else if (interval.unit === 'month') {
                let year = start.getFullYear();
                let month = start.getMonth();
                while (year < end.getFullYear() || (year === end.getFullYear() && month <= end.getMonth())) {
                    tickDates.push(new Date(year, month, 1, 0, 0, 0, 0));
                    month++;
                    if (month > 11) {
                        month = 0;
                        year++;
                    }
                }
            } else if (interval.unit === 'day') {
                let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                while (current <= end) {
                    tickDates.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
            } else if (interval.unit === 'hour') {
                let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours());
                while (current <= end) {
                    tickDates.push(new Date(current));
                    current.setHours(current.getHours() + 1);
                }
            } else if (interval.unit === 'minute') {
                let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes());
                while (current <= end) {
                    tickDates.push(new Date(current));
                    current.setMinutes(current.getMinutes() + 1);
                }
            } else if (interval.unit === 'second') {
                let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds());
                while (current <= end) {
                    tickDates.push(new Date(current));
                    current.setSeconds(current.getSeconds() + 1);
                }
            }
            // Render all normal ticks
            tickDates.forEach(tickDate => {
                this._renderTickMark(tickDate, format, 1, showLabels, 0, interval, ruler, canvasWidth);
            });
            // Always show context labels for left and right edge
            let leftContext = null, rightContext = null;
            if (tickDates.length > 0) {
                // Find the tick at or before the left edge
                leftContext = tickDates[0];
                for (let i = 0; i < tickDates.length; i++) {
                    if (this.timeToPixel(tickDates[i]) >= 0) {
                        leftContext = tickDates[i];
                        if (i > 0 && this.timeToPixel(tickDates[i]) > 0) {
                            leftContext = tickDates[i - 1];
                        }
                        break;
                    }
                }
                // Find the tick at or after the right edge
                rightContext = tickDates[tickDates.length - 1];
                for (let i = tickDates.length - 1; i >= 0; i--) {
                    if (this.timeToPixel(tickDates[i]) <= canvasWidth) {
                        rightContext = tickDates[i];
                        if (i < tickDates.length - 1 && this.timeToPixel(tickDates[i]) < canvasWidth) {
                            rightContext = tickDates[i + 1];
                        }
                        break;
                    }
                }
            }
            // Add left label
            if (leftContext) {
                const leftLabel = document.createElement('div');
                leftLabel.className = 'bar-unit-label left';
                leftLabel.textContent = formatMap[interval.unit](leftContext);
                ruler.appendChild(leftLabel);
            }
            // Add right label
            if (rightContext) {
                const rightLabel = document.createElement('div');
                rightLabel.className = 'bar-unit-label right';
                rightLabel.textContent = formatMap[interval.unit](rightContext);
                ruler.appendChild(rightLabel);
            }
        });
    }

    _renderTickMark(tickDate, format, opacity, showLabels, level, interval, ruler, canvasWidth) {
        const x = this.timeToPixel(tickDate);
        const isOnScreen = x >= -50 && x <= canvasWidth + 50;
        // We'll handle sticky edge ticks outside this function
        if (!isOnScreen && !tickDate._isEdgeTick) return;
        
        // Calculate edge fade-out
        const fadeDistance = 150; // pixels from edge where fade starts - increased for earlier fade
        let edgeOpacity = 1;
        
        if (x < fadeDistance) {
            // Fade out near left edge
            edgeOpacity = Math.max(0.1, x / fadeDistance);
        } else if (x > canvasWidth - fadeDistance) {
            // Fade out near right edge
            edgeOpacity = Math.max(0.1, (canvasWidth - x) / fadeDistance);
        }
        
                const mark = document.createElement('div');
                mark.className = 'ruler-mark';
                mark.style.left = `${x}px`;
        mark.style.opacity = opacity * edgeOpacity; // Combine base opacity with edge fade
        mark.style.zIndex = 10 - level;
        if (showLabels) {
            mark.textContent = this.formatTime(tickDate, format);
        }
        if (this.isMajorMark(tickDate, interval)) {
                    mark.classList.add('major');
                }
        if (tickDate._isEdgeTick) {
            mark.classList.add('edge-tick');
            mark.style.left = tickDate._edge === 'left' ? '0px' : (canvasWidth - 1) + 'px';
            mark.style.opacity = 0.7;
            mark.title = 'Edge tick';
        }
        mark.classList.add(`level-${level}`);
                ruler.appendChild(mark);
            }

    // Helper to render sticky edge ticks for a given set of tick dates
    _renderStickyEdgeTicks(tickDates, format, showLabels, level, interval, ruler, canvasWidth) {
        if (tickDates.length < 2) return;
        // Only clamp to edge if the tick would be off screen
        const leftTick = tickDates[0];
        const rightTick = tickDates[tickDates.length - 1];
        const leftX = this.timeToPixel(leftTick);
        const rightX = this.timeToPixel(rightTick);
        // Clamp left tick if off screen
        if (leftX < 0) {
            const edgeTick = new Date(leftTick);
            edgeTick._isEdgeTick = true;
            edgeTick._edge = 'left';
            this._renderTickMark(edgeTick, format, 1, showLabels, level, interval, ruler, canvasWidth);
        }
        // Clamp right tick if off screen
        if (rightX > canvasWidth) {
            const edgeTick = new Date(rightTick);
            edgeTick._isEdgeTick = true;
            edgeTick._edge = 'right';
            this._renderTickMark(edgeTick, format, 1, showLabels, level, interval, ruler, canvasWidth);
        }
    }

    getDynamicTimeIntervals(timeSpan, canvasWidth) {
        const msPerDay = 24 * 60 * 60 * 1000;
        const msPerHour = 60 * 60 * 1000;
        const msPerMinute = 60 * 1000;
        const msPerSecond = 1000;

        // Increased minPixelsPerMark for better performance - second tick marks appear later
        const allIntervals = [
            { unit: 'decade', value: 1, minPixelsPerMark: 400, format: 'decade', subdivisions: 10 },
            { unit: 'year', value: 1, minPixelsPerMark: 250, format: 'year', subdivisions: 12 },
            { unit: 'month', value: 1, minPixelsPerMark: 150, format: 'month', subdivisions: 'days' },
            { unit: 'day', value: 1, minPixelsPerMark: 60, format: 'day', subdivisions: 24 },
            { unit: 'hour', value: 1, minPixelsPerMark: 30, format: 'hour', subdivisions: 60 },
            { unit: 'minute', value: 1, minPixelsPerMark: 15, format: 'minute', subdivisions: 60 },
            { unit: 'second', value: 1, minPixelsPerMark: 8, format: 'second', subdivisions: 1 }
        ];

        const intervalEvaluations = allIntervals.map(intervalDef => {
            const intervalMs = this.getIntervalMs(intervalDef);
            const numMarks = Math.ceil(timeSpan / intervalMs);
            const pixelsPerMark = canvasWidth / numMarks;
            return {
                ...intervalDef,
                intervalMs,
                numMarks,
                pixelsPerMark
            };
        });

        const selectedIntervals = [];
        intervalEvaluations.forEach((intervalEval, index) => {
            const { pixelsPerMark, minPixelsPerMark, unit } = intervalEval;
            let opacity = 0;
            let showLabels = false;

            // Hard cutoff: don't render if < 2px per tick
            if (pixelsPerMark < 2) return;

            // For granular units, fade in more slowly (require more space)
            let fadeStart = minPixelsPerMark * 0.8;
            let fadeEnd = minPixelsPerMark;
            if (unit === 'hour') { fadeStart = 12; fadeEnd = 20; }
            if (unit === 'minute') { fadeStart = 8; fadeEnd = 15; } // More space required for better performance
            if (unit === 'second') { fadeStart = 3; fadeEnd = 6; }

            if (pixelsPerMark >= fadeEnd) {
                opacity = Math.min(1, (pixelsPerMark - fadeEnd + minPixelsPerMark) / minPixelsPerMark);
                showLabels = pixelsPerMark >= fadeEnd * 1.2;
            } else if (pixelsPerMark >= fadeStart) {
                opacity = (pixelsPerMark - fadeStart) / (fadeEnd - fadeStart);
                showLabels = false;
            }
            if (opacity > 0.1) {
                selectedIntervals.push({
                    interval: { unit: intervalEval.unit, value: intervalEval.value },
                    format: intervalEval.format,
                    opacity: opacity,
                    showLabels: showLabels,
                    level: selectedIntervals.length,
                    subdivisions: intervalEval.subdivisions
                });
            }
        });
        return selectedIntervals.slice(0, 6); // allow up to 6 levels for fine granularity
    }

    getIntervalMs(interval) {
        const msPerDay = 24 * 60 * 60 * 1000;
        const msPerHour = 60 * 60 * 1000;
        const msPerMinute = 60 * 1000;
        const msPerSecond = 1000;
        switch (interval.unit) {
            case 'decade':
                return interval.value * 10 * 365 * msPerDay;
            case 'year':
                return interval.value * 365 * msPerDay;
            case 'month':
                return interval.value * 30 * msPerDay;
            case 'day':
                return interval.value * msPerDay;
            case 'hour':
                return interval.value * msPerHour;
            case 'minute':
                return interval.value * msPerMinute;
            case 'second':
                return interval.value * msPerSecond;
            default:
                return msPerDay;
        }
    }

    getTimeInterval(timeSpan) {
        // This function is kept for backward compatibility but is no longer used
        // The new getDynamicTimeIntervals function handles all interval logic
        const msPerDay = 24 * 60 * 60 * 1000;
        const msPerHour = 60 * 60 * 1000;
        const msPerMinute = 60 * 1000;
        const msPerSecond = 1000;
        
        if (timeSpan > 365 * msPerDay) return { unit: 'year', value: 1 };
        if (timeSpan > 30 * msPerDay) return { unit: 'month', value: 1 };
        if (timeSpan > 7 * msPerDay) return { unit: 'day', value: 1 };
        if (timeSpan > msPerDay) return { unit: 'hour', value: 6 };
        if (timeSpan > msPerHour) return { unit: 'hour', value: 1 };
        if (timeSpan > msPerMinute) return { unit: 'minute', value: 15 };
        if (timeSpan > msPerSecond) return { unit: 'second', value: 30 };
        return { unit: 'second', value: 1 };
    }

    getTimeFormat(interval) {
        switch (interval.unit) {
            case 'year': return 'year';
            case 'month': return 'month';
            case 'day': return 'day';
            case 'hour': return 'hour';
            case 'minute': return 'minute';
            case 'second': return 'second';
            default: return 'day';
        }
    }

    roundToInterval(date, interval) {
        const newDate = new Date(date);
        switch (interval.unit) {
            case 'year':
                // Round to January 1st of the year
                newDate.setMonth(0, 1);
                newDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                // Round to the 1st of the month
                newDate.setDate(1);
                newDate.setHours(0, 0, 0, 0);
                break;
            case 'day':
                // Round to midnight
                newDate.setHours(0, 0, 0, 0);
                break;
            case 'hour':
                // Round to the start of the hour
                newDate.setMinutes(0, 0, 0);
                break;
            case 'minute':
                // Round to the start of the minute
                newDate.setSeconds(0, 0);
                break;
            case 'second':
                // Round to the start of the second
                newDate.setMilliseconds(0);
                break;
        }
        return newDate;
    }

    addTime(date, interval) {
        const newDate = new Date(date);
        switch (interval.unit) {
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + interval.value);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + interval.value);
                break;
            case 'day':
                newDate.setDate(newDate.getDate() + interval.value);
                break;
            case 'hour':
                newDate.setHours(newDate.getHours() + interval.value);
                break;
            case 'minute':
                newDate.setMinutes(newDate.getMinutes() + interval.value);
                break;
            case 'second':
                newDate.setSeconds(newDate.getSeconds() + interval.value);
                break;
        }
        return newDate;
    }

    addTimeWithSubdivisions(date, interval, subdivisions) {
        const newDate = new Date(date);
        
        switch (interval.unit) {
            case 'year':
                // Add one year
                newDate.setFullYear(newDate.getFullYear() + 1);
                break;
            case 'month':
                // Add one month (handles varying days per month correctly)
                newDate.setMonth(newDate.getMonth() + 1);
                break;
            case 'day':
                // Add one day
                newDate.setDate(newDate.getDate() + 1);
                break;
            case 'hour':
                // Add one hour
                newDate.setHours(newDate.getHours() + 1);
                break;
            case 'minute':
                // Add one minute
                newDate.setMinutes(newDate.getMinutes() + 1);
                break;
            case 'second':
                // Add one second
                newDate.setSeconds(newDate.getSeconds() + 1);
                break;
        }
        
        return newDate;
    }

    isMajorMark(date, interval) {
        switch (interval.unit) {
            case 'year': return date.getMonth() === 0;
            case 'month': return date.getDate() === 1;
            case 'day': return date.getHours() === 0;
            case 'hour': return date.getMinutes() === 0;
            case 'minute': return date.getSeconds() === 0;
            default: return true;
        }
    }

    renderLaunchPoints() {
        // Clear existing points
        const existingPoints = this.elements.launchPoints.querySelectorAll('.launch-point-hitbox, .launch-point');
        existingPoints.forEach(point => point.remove());
        
        // Clear existing message
        const existingMessage = this.elements.launchPoints.querySelector('.no-launches-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Check if current hover launch is still visible
        if (this.currentHoverLaunch) {
            const hoverLaunchDate = new Date(this.currentHoverLaunch.net);
            const hoverX = this.timeToPixel(hoverLaunchDate);
            const canvasWidth = this.elements.timelineCanvas.offsetWidth;
            
            // Hide hover card if the launch point is no longer visible
            if (hoverX < -20 || hoverX > canvasWidth + 20) {
                this.hideHoverCard();
            }
        }
        
        if (this.filteredLaunches.length === 0) {
            // Show message when no launches in current view
            const canvasWidth = this.elements.timelineCanvas.offsetWidth;
            const centerX = canvasWidth / 2;
            
            const message = document.createElement('div');
            message.className = 'no-launches-message';
            message.style.cssText = `
                position: absolute;
                left: ${centerX}px;
                top: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: #b0b0b0;
                font-size: 0.9rem;
                pointer-events: none;
            `;
            message.innerHTML = `
                <i class="fas fa-search" style="font-size: 1.5rem; margin-bottom: 8px; opacity: 0.5; display: block;"></i>
                <div>No launches in this time range</div>
            `;
            this.elements.launchPoints.appendChild(message);
            return;
        }
        
        // Sort launches by date
        const sortedLaunches = [...this.filteredLaunches].sort((a, b) => new Date(a.net) - new Date(b.net));
        
        sortedLaunches.forEach((launch, index) => {
            const launchDate = new Date(launch.net);
            const x = this.timeToPixel(launchDate);
            const y = 50; // Center of the timeline
            
            // Show points that are within or near the visible area
            if (x >= -20 && x <= this.elements.timelineCanvas.offsetWidth + 20) {
                // Create hitbox
                const hitbox = document.createElement('div');
                hitbox.className = 'launch-point-hitbox';
                hitbox.style.left = `${x}px`;
                hitbox.style.top = `${y}%`;
                hitbox.dataset.launchIndex = index;

                // Create the visible point inside the hitbox
                const point = document.createElement('div');
                point.className = `launch-point ${this.getStatusClass(launch.status?.name)}`;
                // No need to set left/top on point, it's centered in hitbox
                hitbox.appendChild(point);

                // Add hover/click events to hitbox
                hitbox.addEventListener('mouseenter', (e) => this.showHoverCard(e, launch));
                hitbox.addEventListener('mouseleave', () => this.hideHoverCard());
                hitbox.addEventListener('click', () => this.showLaunchDetails(launch));
                
                // Handle wheel events on plot points to prevent panning
                hitbox.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Manually trigger zoom at the plot point location
                    const rect = hitbox.getBoundingClientRect();
                    const canvasRect = this.elements.timelineCanvas.getBoundingClientRect();
                    const mouseX = rect.left + rect.width / 2 - canvasRect.left;
                    
                    // Ensure we're not in a dragging state
                    this.isDragging = false;
                    this.panHistory = [];
                    this.panMomentum.inProgress = false;
                    this.justZoomed = true;
                    
                    // Reverse the scroll direction
                    const delta = e.deltaY > 0 ? 1.1 : 0.9;
                    this.zoomAtPoint(mouseX, delta);
                }, { passive: false });

                this.elements.launchPoints.appendChild(hitbox);
            }
        });
    }

    timeToPixel(time) {
        const timeSpan = this.timeRange.end - this.timeRange.start;
        const canvasWidth = this.elements.timelineCanvas.offsetWidth;
        const timePosition = time - this.timeRange.start;
        return (timePosition / timeSpan) * canvasWidth;
    }

    pixelToTime(pixel) {
        const timeSpan = this.timeRange.end - this.timeRange.start;
        const canvasWidth = this.elements.timelineCanvas.offsetWidth;
        const timeRatio = pixel / canvasWidth;
        return new Date(this.timeRange.start.getTime() + timeRatio * timeSpan);
    }

    showHoverCard(event, launch) {
        const card = this.elements.hoverCard;
        const launchDate = new Date(launch.net);
        
        card.innerHTML = `
            <div class="mission-name">${launch.mission?.name || 'Mission TBD'}</div>
            <div class="launch-date">${this.formatDate(launchDate)}</div>
            <div class="agency-name">${launch.launch_service_provider?.name || 'Unknown Agency'}</div>
        `;
        
        // Position the card above the plot point (centered on the hitbox, not the mouse)
        const canvasRect = this.elements.timelineCanvas.getBoundingClientRect();
        const axis = this.elements.timelineAxis;
        const axisRect = axis.getBoundingClientRect();
        const hitboxRect = event.currentTarget.getBoundingClientRect();
        // X position: center of hitbox relative to canvas
        const x = (hitboxRect.left + hitboxRect.right) / 2 - canvasRect.left;
        // The axis Y position relative to the canvas
        const axisY = axisRect.top - canvasRect.top + axisRect.height / 2;
        // Place card so its bottom is above the axis, with a gap
        const gap = 16;
        card.style.left = `${x}px`;
        card.style.removeProperty('top');
        card.style.bottom = `${canvasRect.height - axisY + gap}px`;
        card.style.transform = 'translateX(-50%)';
        card.classList.add('active');
        // Store the current launch for tracking
        this.currentHoverLaunch = launch;
    }

    hideHoverCard() {
        this.elements.hoverCard.classList.remove('active');
        this.currentHoverLaunch = null;
    }

    showLaunchDetails(launch) {
        this.selectedLaunch = launch;
        this.elements.detailsTitle.textContent = launch.mission?.name || 'Launch Details';
        
        const launchDate = new Date(launch.net);
        const statusClass = this.getStatusClass(launch.status?.name);
        
        this.elements.detailsContent.innerHTML = `
            <div class="detail-item">
                <div class="detail-label">Mission Name</div>
                <div class="detail-value">${launch.mission?.name || 'TBD'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Launch Date</div>
                <div class="detail-value">${this.formatDate(launchDate)} at ${this.formatTime(launchDate)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Launch Service Provider</div>
                <div class="detail-value">${launch.launch_service_provider?.name || 'Unknown'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Rocket</div>
                <div class="detail-value">${launch.rocket?.configuration?.name || 'TBD'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">
                    <span class="launch-status ${statusClass}">${launch.status?.name || 'TBD'}</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Launch Pad</div>
                <div class="detail-value">${launch.pad?.name || 'TBD'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Location</div>
                <div class="detail-value">${launch.pad?.location?.name || 'TBD'}</div>
            </div>
            ${launch.mission?.description ? `
                <div class="detail-item">
                    <div class="detail-label">Mission Description</div>
                    <div class="detail-value">${launch.mission.description}</div>
                </div>
            ` : ''}
            ${launch.mission?.type ? `
                <div class="detail-item">
                    <div class="detail-label">Mission Type</div>
                    <div class="detail-value">${launch.mission.type}</div>
                </div>
            ` : ''}
        `;

        this.elements.launchDetails.classList.add('active');
    }

    closeDetails() {
        this.elements.launchDetails.classList.remove('active');
        this.selectedLaunch = null;
    }

    handleWheel(event) {
        event.preventDefault();
        
        // Ensure we're not in a dragging state when wheel event occurs
        this.isDragging = false;
        this.panHistory = [];
        this.panMomentum.inProgress = false;
        this.justZoomed = true;
        
        // Set a flag to prevent any mouse events from interfering
        this.wheelEventInProgress = true;
        setTimeout(() => {
            this.wheelEventInProgress = false;
        }, 50);
        
        // Reverse the scroll direction - doubled zoom speed
        const delta = event.deltaY > 0 ? 1.2 : 0.8;
        const mouseX = event.offsetX;
        this.zoomAtPoint(mouseX, delta);
    }

    zoomAtPoint(mouseX, factor) {
        this.hideHoverCard();
        this.panMomentum.inProgress = false;
        // Calculate the time at mouse position before zoom
        const mouseTime = this.pixelToTime(mouseX);
        // Compute new target zoom
        const newTargetTimeSpan = Math.max(1000, Math.min(100 * 365 * 24 * 60 * 60 * 1000, this.targetTimeSpan * factor));
        const canvasWidth = this.elements.timelineCanvas.offsetWidth;
        const mouseRatio = mouseX / canvasWidth;
        const newStartTime = new Date(mouseTime.getTime() - (mouseRatio * newTargetTimeSpan));
        const newEndTime = new Date(mouseTime.getTime() + ((1 - mouseRatio) * newTargetTimeSpan));
        const newTargetCenter = new Date((newStartTime.getTime() + newEndTime.getTime()) / 2);
        this.targetTimeSpan = newTargetTimeSpan;
        this.targetTimeCenter = newTargetCenter;
        // Start or retarget animation
        if (!this.zoomAnimation.inProgress) {
            this.animateZoom();
        }
    }

    animateZoom() {
        this.zoomAnimation.inProgress = true;
        const duration = 75; // Doubled speed - animation completes in half the time
        let startSpan = this.timeSpan;
        let startCenter = this.currentTimeCenter.getTime();
        let endSpan = this.targetTimeSpan;
        let endCenter = this.targetTimeCenter.getTime();
        let startTime = performance.now();
        const step = (now) => {
            // If target changed, restart animation from current state
            if (endSpan !== this.targetTimeSpan || endCenter !== this.targetTimeCenter.getTime()) {
                startSpan = this.timeSpan;
                startCenter = this.currentTimeCenter.getTime();
                endSpan = this.targetTimeSpan;
                endCenter = this.targetTimeCenter.getTime();
                startTime = now;
            }
            const t = Math.min(1, (now - startTime) / duration);
            // Fast start, smooth ease out (minimal ease-in, strong ease-out)
            const ease = 1 - Math.pow(1 - t, 2.5);
            this.timeSpan = startSpan + (endSpan - startSpan) * ease;
            this.currentTimeCenter = new Date(startCenter + (endCenter - startCenter) * ease);
            this.updateTimeRange();
            this.smoothRenderTimeline();
            if (t < 1 || endSpan !== this.targetTimeSpan || endCenter !== this.targetTimeCenter.getTime()) {
                requestAnimationFrame(step);
            } else {
                // Snap to final values
                this.timeSpan = this.targetTimeSpan;
                this.currentTimeCenter = new Date(this.targetTimeCenter);
                this.updateTimeRange();
                this.smoothRenderTimeline();
                this.zoomAnimation.inProgress = false;
            }
        };
        requestAnimationFrame(step);
    }

    zoomIn() {
        const centerX = this.elements.timelineCanvas.offsetWidth / 2;
        this.zoomAtPoint(centerX, 0.4); // Zoom in (smaller time span) - 4x original rate
    }

    zoomOut() {
        const centerX = this.elements.timelineCanvas.offsetWidth / 2;
        this.zoomAtPoint(centerX, 2.0); // Zoom out (larger time span) - 4x original rate
    }

    resetView() {
        this.currentTimeCenter = new Date();
        this.timeSpan = 30 * 24 * 60 * 60 * 1000; // 30 days
        this.updateTimeRange();
        this.smoothRenderTimeline();
    }

    fitToView() {
        if (this.filteredLaunches.length === 0) {
            this.resetView();
            return;
        }
        
        // Find the time range of all launches
        const dates = this.filteredLaunches.map(launch => new Date(launch.net));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        // Set center to middle of launch range
        this.currentTimeCenter = new Date((minDate.getTime() + maxDate.getTime()) / 2);
        
        // Set time span to cover all launches with padding
        const launchSpan = maxDate.getTime() - minDate.getTime();
        this.timeSpan = Math.max(launchSpan * 1.2, 24 * 60 * 60 * 1000); // At least 1 day
        
        this.updateTimeRange();
        this.smoothRenderTimeline();
    }

    getZoomLevelText() {
        const days = this.timeSpan / (24 * 60 * 60 * 1000);
        if (days >= 365) {
            const years = days / 365;
            return `${years.toFixed(1)} years`;
        } else if (days >= 30) {
            const months = days / 30;
            return `${months.toFixed(1)} months`;
        } else if (days >= 1) {
            return `${days.toFixed(1)} days`;
        } else {
            const hours = this.timeSpan / (60 * 60 * 1000);
            return `${hours.toFixed(1)} hours`;
        }
    }

    handleMouseDown(event) {
        if (event.button !== 0) return; // Only left mouse button
        if (this.wheelEventInProgress) return; // Don't start dragging during wheel events
        this.isDragging = true;
        this.lastMouseX = event.clientX;
        this.panHistory = [{ x: event.clientX, t: Date.now() }];
        this.panMomentum.inProgress = false;
        this.elements.timelineCanvas.style.cursor = 'grabbing';
    }

    handleMouseMove(event) {
        if (this.justZoomed || this.wheelEventInProgress) {
            this.justZoomed = false;
            return;
        }
        if (!this.isDragging || !(event.buttons & 1)) return; // Only pan if dragging with left button
        this.hideHoverCard();
        const now = Date.now();
        const deltaX = event.clientX - this.lastMouseX;
        const deltaTime = (deltaX / this.elements.timelineCanvas.offsetWidth) * this.timeSpan;
        this.currentTimeCenter = new Date(this.currentTimeCenter.getTime() - deltaTime);
        this.updateTimeRange();
        this.smoothRenderTimeline();
        this.lastMouseX = event.clientX;
        // Track pan history for velocity
        this.panHistory.push({ x: event.clientX, t: now });
        if (this.panHistory.length > 10) this.panHistory.shift();
    }

    handleMouseUp() {
        if (this.isDragging) {
            // Calculate velocity over last 50ms
            const now = Date.now();
            const recent = this.panHistory.filter(p => now - p.t <= 50);
            if (recent.length >= 2) {
                const first = recent[0];
                const last = recent[recent.length - 1];
                const dt = (last.t - first.t) || 1;
                const dx = last.x - first.x;
                const velocityPxPerMs = dx / dt;
                this.startPanMomentum(velocityPxPerMs);
            }
        }
        this.isDragging = false;
        this.elements.timelineCanvas.style.cursor = 'grab';
    }

    startPanMomentum(velocityPxPerMs) {
        if (Math.abs(velocityPxPerMs) < 0.01) return;
        this.panMomentum.inProgress = true;
        let velocity = velocityPxPerMs;
        let lastTime = Date.now();
        const animate = () => {
            if (!this.panMomentum.inProgress) return;
            const now = Date.now();
            const dt = now - lastTime;
            lastTime = now;
            // Move timeline center
            const deltaX = velocity * dt;
            const deltaTime = (deltaX / this.elements.timelineCanvas.offsetWidth) * this.timeSpan;
            this.currentTimeCenter = new Date(this.currentTimeCenter.getTime() - deltaTime);
            this.updateTimeRange();
            this.smoothRenderTimeline();
            // Apply friction
            velocity *= 0.92;
            if (Math.abs(velocity) > 0.01) {
                requestAnimationFrame(animate);
            } else {
                this.panMomentum.inProgress = false;
            }
        };
        requestAnimationFrame(animate);
    }

    // Touch event handlers for mobile
    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            this.isDragging = true;
            this.lastMouseX = event.touches[0].clientX;
            this.momentum.isAnimating = false;
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1 && this.isDragging) {
            const deltaX = event.touches[0].clientX - this.lastMouseX;
            const deltaTime = (deltaX / this.elements.timelineCanvas.offsetWidth) * this.timeSpan;
            
            this.currentTimeCenter = new Date(this.currentTimeCenter.getTime() - deltaTime);
            this.updateTimeRange();
            this.smoothRenderTimeline();
            
            this.lastMouseX = event.touches[0].clientX;
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        if (this.isDragging) {
            this.handleMouseUp();
        }
    }

    updateTimelineTransform() {
        // Calculate the offset in pixels for the current time range
        const canvasWidth = this.elements.timelineCanvas.offsetWidth;
        const totalTimeSpan = this.timeRange.end - this.timeRange.start;
        // The leftmost time is this.timeRange.start, so offset is 0
        // If you want to support infinite scroll, you can adjust this
        // For now, just set transform to 0
        const offset = 0;
        const content = this.elements.timelineContent || document.getElementById('timeline-content');
        if (content) {
            content.style.transform = `translateX(${offset}px)`;
        }
    }

    updateTimeInfo() {
        const timeSpan = this.timeRange.end - this.timeRange.start;
        const days = Math.ceil(timeSpan / (24 * 60 * 60 * 1000));
        
        this.elements.timeRange.textContent = `(${this.getZoomLevelText()})`;
        this.elements.currentTimeRange.textContent = 
            `${this.formatDate(this.timeRange.start)} - ${this.formatDate(this.timeRange.end)}`;
    }

    handleResize() {
        this.smoothRenderTimeline();
    }

    loadFallbackData() {
        console.log('Loading fallback data manually...');
        this.showLoading(true);
        
        setTimeout(() => {
            const fallbackData = this.getFallbackData();
            this.launches = fallbackData.results || [];
            console.log('Loaded fallback data with', this.launches.length, 'launches');
            
            this.populateAgencyFilter();
            this.applyFilters();
            this.showLoading(false);
            
            this.showError('Loaded offline data successfully!');
        }, 500);
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatTime(date, format = 'default') {
        switch (format) {
            case 'decade':
                return Math.floor(date.getFullYear() / 10) * 10 + 's';
            case 'year':
                return date.getFullYear().toString();
            case 'month':
                return date.toLocaleDateString('en-US', { month: 'short' });
            case 'day':
                return date.getDate().toString();
            case 'hour':
                return date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false });
            case 'minute':
                return date.toLocaleTimeString('en-US', { minute: '2-digit' });
            case 'second':
                return date.getSeconds().toString().padStart(2, '0');
            default:
                return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                });
        }
    }

    getStatusClass(status) {
        if (!status) return 'status-tbd';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('go')) {
            return 'status-go';
        } else if (statusLower.includes('hold')) {
            return 'status-hold';
        } else if (statusLower.includes('success')) {
            return 'status-success';
        } else if (statusLower.includes('failure')) {
            return 'status-failure';
        } else if (statusLower.includes('partial')) {
            return 'status-partial-failure';
        } else {
            return 'status-tbd';
        }
    }

    showLoading(show) {
        this.elements.loading.style.display = show ? 'flex' : 'none';
        this.elements.timelineContainer.style.display = show ? 'none' : 'block';
    }

    showError(message) {
        this.elements.launchPoints.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff6b6b; width: 100%;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <p>${message}</p>
            </div>
        `;
    }

    updateCurrentTimeIndicator() {
        const indicator = this.elements.currentTimeIndicator || document.getElementById('current-time-indicator');
        if (!indicator || !this.elements.timelineCanvas) return;
        // Get current time
        const now = new Date();
        // Only show if now is within the visible time range
        if (now < this.timeRange.start || now > this.timeRange.end) {
            indicator.style.display = 'none';
            return;
        }
        // Find X position for current time
        const x = this.timeToPixel(now);
        indicator.style.left = `${x}px`;
        indicator.style.display = 'block';
    }

    updateCenterLineIndicator() {
        const centerIndicator = this.elements.centerLineIndicator;
        const centerDateLabel = this.elements.centerDateLabel;
        
        if (!centerIndicator || !centerDateLabel || !this.elements.timelineCanvas) return;
        
        // The center line is always at the center of the view (currentTimeCenter)
        const centerDate = this.currentTimeCenter;
        
        // Format the full date for the label
        const formattedDate = this.formatFullDate(centerDate);
        centerDateLabel.textContent = formattedDate;
        
        // Show the center line indicator
        centerIndicator.style.display = 'block';
    }

    formatFullDate(date) {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return date.toLocaleDateString('en-US', options);
    }

    /** Helper to get ordinal suffix for day numbers */
    getOrdinalSuffix(day) {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    /** Helper to get the current context values for all coarser units */
    getContextValuesForDate(date) {
        return [
            date.getFullYear(),
            date.toLocaleString('en-US', { month: 'short' }),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        ];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpaceflightTimeline();
});

// Add some utility functions for better user experience
window.addEventListener('load', () => {
    // Add smooth scrolling to timeline
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (timelineWrapper) {
        timelineWrapper.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                timelineWrapper.scrollLeft += e.deltaY;
            }
        });
    }
});
