interface JobData {
  title: string;
  company: string;
  location: string;
  url: string;
  isSponsored: boolean;
  isRecruitmentAgency?: boolean;
  sponsorshipType?: string;
  dateFound: string;
}

interface PersonData {
  name: string;
  title: string;
  company: string;
  location: string;
  profileUrl: string;
  connectionDegree: string;
  isRelevant: boolean;
  relevanceScore?: number;
  keywords?: string[];
}

interface ConvexSponsorshipData {
  company: string;
  isSponsored: boolean;
  sponsorshipType: string | null;
  source: string;
  matchedName?: string;
}

interface AutofillProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  professional: {
    currentTitle: string;
    experience: string;
    education: string;
    skills: string;
    linkedinUrl: string;
    portfolioUrl: string;
    githubUrl: string;
  };
  preferences: {
    salaryExpectation: string;
    availableStartDate: string;
    workAuthorization: string;
    relocate: boolean;
    coverLetter: string;
  };
}

interface JobBoardEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  dateAdded: string;
  status: 'interested' | 'applied' | 'interviewing' | 'rejected' | 'offer';
  notes: string;
  salary?: string;
  sponsorshipInfo?: {
    isSponsored: boolean;
    sponsorshipType?: string;
  };
  isRecruitmentAgency?: boolean;
}

class JobTracker {
  private isHighlightMode = false;
  private isPeopleSearchMode = false;
  private convexUrl: string;
  private currentJobSite: string;
  private lastRequestTime = 0;
  private requestCount = 0;
  private rateLimitWindow = 60000; // 1 minute
  private maxRequestsPerWindow = 10;
  private peopleSearchPanel: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  constructor() {
    // Default Convex URL - will be updated from storage
    this.convexUrl = 'https://rare-chihuahua-615.convex.cloud';
    this.currentJobSite = this.detectJobSite();
    this.init();
  }

  private init() {
    this.loadConvexUrl();
    this.createToggleButton();
    this.createAutofillButton();
    if (this.currentJobSite === 'linkedin' && window.location.pathname.includes('/jobs/')) {
      this.createPeopleSearchButton();
    }
    this.setupAutoDetection();
  }

  private async loadConvexUrl() {
    try {
      const result = await chrome.storage.sync.get(['convexUrl']);
      if (result.convexUrl) {
        this.convexUrl = result.convexUrl;
      }
    } catch (error) {
      console.error('Failed to load Convex URL:', error);
    }
  }

  private detectJobSite(): string {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('indeed')) return 'indeed';
    if (hostname.includes('glassdoor')) return 'glassdoor';
    if (hostname.includes('monster')) return 'monster';
    if (hostname.includes('ziprecruiter')) return 'ziprecruiter';
    if (hostname.includes('jobs.google')) return 'google_jobs';
    if (hostname.includes('seek.com')) return 'seek';
    if (hostname.includes('totaljobs')) return 'totaljobs';
    if (hostname.includes('reed.co.uk')) return 'reed';
    if (hostname.includes('jobsite.co.uk')) return 'jobsite';
    return 'unknown';
  }

  private createToggleButton() {
    const button = document.createElement('button');
    button.id = 'jobloom-toggle';
    button.textContent = '🎯 Check Sponsored Jobs';
    button.style.cssText = `
      position: fixed;
      top: 140px;
      right: 20px;
      z-index: 10000;
      background: #4f46e5;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s;
    `;

    button.addEventListener('click', async () => {
      if (this.isHighlightMode) {
        this.clearHighlights();
        button.textContent = '🎯 Check Sponsored Jobs';
        button.style.background = '#4f46e5';
        this.isHighlightMode = false;
      } else {
        // Check rate limit before proceeding
        if (!await this.checkRateLimit()) {
          const timeUntilReset = this.rateLimitWindow - (Date.now() - this.lastRequestTime);
          button.textContent = `⏰ Rate limited (${Math.ceil(timeUntilReset / 1000)}s)`;
          button.style.background = '#f59e0b';
          
          // Reset button after rate limit expires
          setTimeout(() => {
            button.textContent = '🎯 Check Sponsored Jobs';
            button.style.background = '#4f46e5';
          }, timeUntilReset);
          return;
        }

        button.textContent = '⏳ Checking...';
        button.disabled = true;
        
        try {
          await this.checkAndHighlightSponsoredJobs();
          button.textContent = '❌ Clear Highlights';
          button.style.background = '#ef4444';
          this.isHighlightMode = true;
        } catch (error) {
          console.error('Error checking sponsored jobs:', error);
          button.textContent = '❌ Error occurred';
          button.style.background = '#ef4444';
          
          // Reset button after error
          setTimeout(() => {
            button.textContent = '🎯 Check Sponsored Jobs';
            button.style.background = '#4f46e5';
          }, 3000);
        } finally {
          button.disabled = false;
        }
      }
    });

    document.body.appendChild(button);
  }

  private createAutofillButton() {
    const button = document.createElement('button');
    button.id = 'jobloom-autofill';
    button.textContent = '📝 Autofill Application';
    button.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      background: #059669;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s;
      display: none;
    `;

    button.addEventListener('click', async () => {
      button.textContent = '⏳ Filling...';
      button.disabled = true;
      
      try {
        await this.autofillApplication();
        button.textContent = '✅ Filled!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
          button.textContent = '📝 Autofill Application';
          button.style.background = '#059669';
          button.disabled = false;
        }, 3000);
      } catch (error) {
        console.error('Autofill error:', error);
        button.textContent = '❌ Error';
        button.style.background = '#ef4444';
        
        setTimeout(() => {
          button.textContent = '📝 Autofill Application';
          button.style.background = '#059669';
          button.disabled = false;
        }, 3000);
      }
    });

    document.body.appendChild(button);
    
    // Show button only when application forms are detected
    this.detectApplicationForms();
  }

  private createPeopleSearchButton() {
    const button = document.createElement('button');
    button.id = 'jobloom-people-search';
    button.textContent = '👥 Find Relevant People';
    button.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      background: #0a66c2;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s;
    `;

    button.addEventListener('click', () => {
      if (this.isPeopleSearchMode) {
        this.closePeopleSearchPanel();
        button.textContent = '👥 Find Relevant People';
        button.style.background = '#0a66c2';
        this.isPeopleSearchMode = false;
      } else {
        this.openPeopleSearchPanel();
        button.textContent = '❌ Close People Search';
        button.style.background = '#ef4444';
        this.isPeopleSearchMode = true;
      }
    });

    document.body.appendChild(button);
  }

  private openPeopleSearchPanel() {
    if (this.peopleSearchPanel) {
      this.peopleSearchPanel.style.display = 'block';
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'jobloom-people-panel';
    panel.style.cssText = `
      position: fixed;
      top: 140px;
      right: 20px;
      width: 350px;
      max-height: 600px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 10001;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    panel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa;">
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">🔍 Find Relevant People</h3>
        
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #666; font-weight: 600;">SEARCH KEYWORDS</label>
          <input type="text" id="people-keywords" placeholder="e.g., software engineer, product manager" 
                 style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; color: #111 !important; background: #ffffff !important;">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #666; font-weight: 600;">COMPANY</label>
          <input type="text" id="people-company" placeholder="e.g., Google, Microsoft" 
                 style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; color: #111 !important; background: #ffffff !important;">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #666; font-weight: 600;">LOCATION</label>
          <input type="text" id="people-location" placeholder="e.g., San Francisco, Remote" 
                 style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; color: #111 !important; background: #ffffff !important;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #666; font-weight: 600;">CONNECTION LEVEL</label>
          <select id="people-connection" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; color: #111 !important; background: #ffffff !important;">
            <option value="all">All connections</option>
            <option value="1st">1st connections</option>
            <option value="2nd">2nd connections</option>
            <option value="3rd">3rd+ connections</option>
          </select>
        </div>
        
        <button id="search-people-btn" style="width: 100%; background: #0a66c2; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">
          🔍 Search People
        </button>
      </div>
      
      <div id="people-results" style="max-height: 400px; overflow-y: auto; padding: 15px;">
        <div style="text-align: center; color: #666; padding: 20px;">
          Enter search criteria and click "Search People" to find relevant connections
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.peopleSearchPanel = panel;

    // Add event listeners
    const searchBtn = panel.querySelector('#search-people-btn') as HTMLButtonElement;

    searchBtn.addEventListener('click', () => this.searchRelevantPeople());

    // Load default settings
    this.loadPeopleSearchDefaults();
  }

  private closePeopleSearchPanel() {
    if (this.peopleSearchPanel) {
      this.peopleSearchPanel.style.display = 'none';
    }
  }

  private async loadPeopleSearchDefaults() {
    try {
      const result = await chrome.storage.sync.get([
        'defaultKeywords', 
        'defaultConnectionLevel'
      ]);
      
      const panel = this.peopleSearchPanel;
      if (!panel) return;

      const keywordsInput = panel.querySelector('#people-keywords') as HTMLInputElement;
      const connectionSelect = panel.querySelector('#people-connection') as HTMLSelectElement;

      if (keywordsInput && result.defaultKeywords) {
        keywordsInput.value = result.defaultKeywords;
      }
      if (connectionSelect && result.defaultConnectionLevel) {
        connectionSelect.value = result.defaultConnectionLevel;
      }
    } catch (error) {
      console.error('Failed to load people search defaults:', error);
    }
  }

  private async searchRelevantPeople() {
    const panel = this.peopleSearchPanel;
    if (!panel) return;

    const keywords = (panel.querySelector('#people-keywords') as HTMLInputElement).value;
    const company = (panel.querySelector('#people-company') as HTMLInputElement).value;
    const location = (panel.querySelector('#people-location') as HTMLInputElement).value;
    const connectionLevel = (panel.querySelector('#people-connection') as HTMLSelectElement).value;
    const resultsDiv = panel.querySelector('#people-results') as HTMLElement;
    const searchBtn = panel.querySelector('#search-people-btn') as HTMLButtonElement;

    if (!keywords.trim()) {
      resultsDiv.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 20px;">Please enter search keywords</div>';
      return;
    }

    searchBtn.textContent = '⏳ Searching...';
    searchBtn.disabled = true;

    try {
      // Check rate limit
      if (!await this.checkRateLimit()) {
        resultsDiv.innerHTML = '<div style="color: #f59e0b; text-align: center; padding: 20px;">Rate limited. Please wait before searching again.</div>';
        return;
      }

      // Build LinkedIn search URL
      const searchUrl = this.buildLinkedInPeopleSearchUrl(keywords, company, location, connectionLevel);
      
      // Navigate to search results or extract current page people
      if (window.location.href.includes('/search/people/')) {
        // Already on people search page, extract results
        const people = this.extractPeopleFromCurrentPage();
        const relevantPeople = this.filterRelevantPeople(people, keywords);
        this.displayPeopleResults(relevantPeople);
      } else {
        // Show search URL and instructions
        resultsDiv.innerHTML = `
          <div style="padding: 15px; background: #f0f8ff; border-radius: 8px; margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #0a66c2;">🔗 LinkedIn Search URL Generated</p>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">Click the link below to search LinkedIn, then return to this page and click "Search People" again:</p>
            <a href="${searchUrl}" target="_blank" style="color: #0a66c2; text-decoration: none; font-size: 12px; word-break: break-all;">${searchUrl}</a>
          </div>
          <div style="text-align: center; color: #666;">
            <p>Or stay on this page if you're already viewing people search results</p>
          </div>
        `;
      }

    } catch (error) {
      console.error('Error searching people:', error);
      resultsDiv.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 20px;">Error occurred while searching. Please try again.</div>';
    } finally {
      searchBtn.textContent = '🔍 Search People';
      searchBtn.disabled = false;
    }
  }

  private buildLinkedInPeopleSearchUrl(keywords: string, company: string, location: string, connectionLevel: string): string {
    const baseUrl = 'https://www.linkedin.com/search/results/people/';
    const params = new URLSearchParams();

    // Add keywords to search
    if (keywords.trim()) {
      params.append('keywords', keywords.trim());
    }

    // Add company filter
    if (company.trim()) {
      params.append('currentCompany', `["${company.trim()}"]`);
    }

    // Add location filter
    if (location.trim()) {
      params.append('geoUrn', `["${location.trim()}"]`);
    }

    // Add connection level filter
    if (connectionLevel !== 'all') {
      const connectionMap = {
        '1st': 'F',
        '2nd': 'S',
        '3rd': 'O'
      };
      params.append('network', `["${connectionMap[connectionLevel as keyof typeof connectionMap]}"]`);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private extractPeopleFromCurrentPage(): PersonData[] {
    const people: PersonData[] = [];
    
    // LinkedIn people search result selectors
    const peopleElements = document.querySelectorAll('.reusable-search__result-container, .search-result__wrapper');
    
    peopleElements.forEach(element => {
      try {
        const nameEl = element.querySelector('.entity-result__title-text a, .search-result__result-link');
        const titleEl = element.querySelector('.entity-result__primary-subtitle, .subline-level-1');
        const companyEl = element.querySelector('.entity-result__secondary-subtitle, .subline-level-2');
        const locationEl = element.querySelector('.entity-result__summary, .search-result__snippets');
        const connectionEl = element.querySelector('.entity-result__badge-text, .dist-value');
        const profileLinkEl = element.querySelector('a[href*="/in/"]');

        if (nameEl && titleEl) {
          const person: PersonData = {
            name: nameEl.textContent?.trim() || 'Unknown',
            title: titleEl.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            location: locationEl?.textContent?.trim() || 'Unknown',
            profileUrl: profileLinkEl?.getAttribute('href') || '',
            connectionDegree: connectionEl?.textContent?.trim() || 'Unknown',
            isRelevant: false
          };
          
          people.push(person);
        }
      } catch (error) {
        console.error('Error extracting person data:', error);
      }
    });

    return people;
  }

  private filterRelevantPeople(people: PersonData[], keywords: string): PersonData[] {
    const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
    
    return people.map(person => {
      let relevanceScore = 0;
      const matchedKeywords: string[] = [];
      
      // Check keywords against title and company
      const searchText = `${person.title} ${person.company}`.toLowerCase();
      
      keywordList.forEach(keyword => {
        if (searchText.includes(keyword)) {
          relevanceScore += 1;
          matchedKeywords.push(keyword);
        }
      });
      
      // Boost score for exact title matches
      if (keywordList.some(keyword => person.title.toLowerCase().includes(keyword))) {
        relevanceScore += 0.5;
      }
      
      return {
        ...person,
        isRelevant: relevanceScore > 0,
        relevanceScore,
        keywords: matchedKeywords
      };
    }).filter(person => person.isRelevant)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private displayPeopleResults(people: PersonData[]) {
    const resultsDiv = this.peopleSearchPanel?.querySelector('#people-results') as HTMLElement;
    if (!resultsDiv) return;

    if (people.length === 0) {
      resultsDiv.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No relevant people found. Try different keywords or navigate to LinkedIn people search results.</div>';
      return;
    }

    const resultsHtml = people.map(person => `
      <div style="border: 1px solid #eee; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: white;">
        <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #333;">
              <a href="${person.profileUrl}" target="_blank" style="color: #0a66c2; text-decoration: none;">${person.name}</a>
            </h4>
            <p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">${person.title}</p>
            <p style="margin: 0 0 2px 0; font-size: 12px; color: #666;">${person.company}</p>
            <p style="margin: 0; font-size: 11px; color: #999;">${person.location} • ${person.connectionDegree}</p>
          </div>
          <div style="margin-left: 10px;">
            <span style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
              Score: ${person.relevanceScore?.toFixed(1)}
            </span>
          </div>
        </div>
        ${person.keywords && person.keywords.length > 0 ? `
          <div style="margin-top: 8px;">
            <div style="font-size: 10px; color: #666; margin-bottom: 4px;">Matched keywords:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${person.keywords.map(keyword => `
                <span style="background: #f0f8ff; color: #0a66c2; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${keyword}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div style="margin-top: 10px; display: flex; gap: 6px;">
          <button onclick="window.open('${person.profileUrl}', '_blank')" 
                  style="flex: 1; background: #0a66c2; color: white; border: none; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">
            👤 View Profile
          </button>
          <button onclick="this.textContent='✅ Noted'; this.disabled=true;" 
                  style="flex: 1; background: #057642; color: white; border: none; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">
            ➕ Connect
          </button>
        </div>
      </div>
    `).join('');

    resultsDiv.innerHTML = `
      <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border-radius: 6px;">
        <p style="margin: 0; font-size: 12px; color: #0a66c2; font-weight: 600;">
          📊 Found ${people.length} relevant people
        </p>
      </div>
      ${resultsHtml}
    `;
  }

  private async checkAndHighlightSponsoredJobs() {
    const jobElements = this.findJobElements();
    const jobsToCheck: Array<{element: Element, data: JobData}> = [];
    
    // Extract job data from all elements
    jobElements.forEach((element) => {
      const jobData = this.extractJobData(element);
      jobsToCheck.push({ element, data: jobData });
    });

    if (jobsToCheck.length === 0) {
      console.log('No job elements found on this page');
      return;
    }

    // Extract unique company names for batch checking
    const companyNames = [...new Set(jobsToCheck.map(job => job.data.company))];
    
    // Check company sponsorship status via Convex
    const sponsorshipResults = await this.checkCompanySponsorship(companyNames);
    
    // Create a map for quick lookup
    const sponsorshipMap = new Map();
    sponsorshipResults.forEach(result => {
      sponsorshipMap.set(result.company, result);
    });
    
    // Apply highlights based on results
    jobsToCheck.forEach((job) => {
      const sponsorshipData = sponsorshipMap.get(job.data.company);
      if (sponsorshipData && sponsorshipData.isSponsored) {
        job.data.isSponsored = true;
        job.data.sponsorshipType = sponsorshipData.sponsorshipType || 'sponsored';
        this.applyHighlight(job.element, sponsorshipData.sponsorshipType || 'sponsored');
        this.addJobToBoard(job.data);
      } else if (job.data.isRecruitmentAgency) {
        // Highlight recruitment agency jobs
        this.applyHighlight(job.element, 'recruitment_agency');
        this.addJobToBoard(job.data);
      }
    });

    // Show summary
    const sponsoredCount = jobsToCheck.filter(job => job.data.isSponsored).length;
    const recruitmentAgencyCount = jobsToCheck.filter(job => job.data.isRecruitmentAgency).length;
    console.log(`Found ${sponsoredCount} sponsored jobs and ${recruitmentAgencyCount} recruitment agency jobs out of ${jobsToCheck.length} total jobs`);
  }

  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.lastRequestTime > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    // Check if we've exceeded the limit
    if (this.requestCount >= this.maxRequestsPerWindow) {
      const timeUntilReset = this.rateLimitWindow - (now - this.lastRequestTime);
      console.warn(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`);
      return false;
    }
    
    return true;
  }

  private generateClientId(): string {
    // Generate a session-based client ID for rate limiting
    let clientId = localStorage.getItem('jobloom-client-id');
    if (!clientId) {
      clientId = 'ext-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      localStorage.setItem('jobloom-client-id', clientId);
    }
    return clientId;
  }

  private async checkCompanySponsorship(companies: string[]): Promise<ConvexSponsorshipData[]> {
    // Check rate limit before making request
    if (!await this.checkRateLimit()) {
      return companies.map(company => ({ 
        company,
        isSponsored: false, 
        sponsorshipType: null, 
        source: 'rate_limited' 
      }));
    }

    try {
      // Increment request counter
      this.requestCount++;
      
      // Limit companies per request
      const maxCompaniesPerRequest = 50;
      const limitedCompanies = companies.slice(0, maxCompaniesPerRequest);
      
      if (companies.length > maxCompaniesPerRequest) {
        console.warn(`Too many companies (${companies.length}). Limited to ${maxCompaniesPerRequest}.`);
      }

      const response = await fetch(`${this.convexUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'sponsorship:checkCompanySponsorship',
          args: { 
            companies: limitedCompanies,
            clientId: this.generateClientId()
          }
        })
      });

      if (response.status === 429) {
        // Rate limited by server
        console.warn('Rate limited by server. Please wait before making more requests.');
        return companies.map(company => ({ 
          company,
          isSponsored: false, 
          sponsorshipType: null, 
          source: 'server_rate_limited' 
        }));
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      
      // Handle rate limit error from Convex
      if (results.error && results.error.includes('Rate limit exceeded')) {
        console.warn('Convex rate limit exceeded:', results.error);
        return companies.map(company => ({ 
          company,
          isSponsored: false, 
          sponsorshipType: null, 
          source: 'convex_rate_limited' 
        }));
      }

      return results;
    } catch (error) {
      console.error('Failed to check company sponsorship:', error);
      // Fallback: return empty results
      return companies.map(company => ({ 
        company,
        isSponsored: false, 
        sponsorshipType: null, 
        source: 'error' 
      }));
    }
  }

  private findJobElements(): Element[] {
    const siteSelectors = {
      linkedin: [
        '.jobs-search-results__list-item',
        '.job-card-container',
        '[data-job-id]',
        '.reusable-search__result-container'
      ],
      indeed: [
        '.job_seen_beacon',
        '.slider_container .slider_item',
        '[data-jk]',
        '.jobsearch-SerpJobCard'
      ],
      glassdoor: [
        '.react-job-listing',
        '.jobContainer',
        '[data-test=\"job-listing\"]',
        '.JobCard'
      ],
      monster: [
        '.job-card',
        '.job-listing',
        '[data-jobid]'
      ],
      ziprecruiter: [
        '.job_content',
        '.job-listing',
        '[data-job-id]'
      ],
      google_jobs: [
        '.PwjeAc',
        '.gws-plugins-horizon-jobs__li-ed',
        '[data-ved]'
      ],
      seek: [
        '.job-card',
        '[data-automation=\"jobListing\"]',
        '.JobCard'
      ],
      totaljobs: [
        '.job',
        '.job-item',
        '[data-job-id]'
      ],
      reed: [
        '.job-result',
        '.job-card',
        '[data-id]'
      ],
      jobsite: [
        '.job',
        '.job-item',
        '.job-card'
      ],
      unknown: [
        '.job-card',
        '.job-listing',
        '.job-result',
        '[data-job-id]'
      ]
    };

    const selectors = siteSelectors[this.currentJobSite as keyof typeof siteSelectors] || siteSelectors.unknown;
    const elements: Element[] = [];
    
    selectors.forEach(selector => {
      elements.push(...Array.from(document.querySelectorAll(selector)));
    });

    // Remove nested duplicates: keep only outermost elements
    const filtered = elements.filter(el => !elements.some(other => other !== el && other.contains(el)));

    // Return unique elements (in case of duplicates in selectors)
    return Array.from(new Set(filtered));
  }

  private extractJobData(element: Element): JobData {
    const siteSpecificSelectors = {
      linkedin: {
        title: '.job-card-list__title, .job-card-container__link',
        company: '.job-card-container__primary-description, .job-card-list__company',
        location: '.job-card-container__metadata-item, .job-card-list__metadata',
        link: 'a[data-control-name="job_card_click"]'
      },
      indeed: {
        title: '[data-testid="job-title"], .jobTitle',
        company: '[data-testid="company-name"], .companyName',
        location: '[data-testid="job-location"], .companyLocation',
        link: 'h2 a, .jobTitle a'
      },
      glassdoor: {
        title: '[data-test="job-title"], .jobTitle',
        company: '[data-test="employer-name"], .employerName',
        location: '[data-test="job-location"], .location',
        link: '[data-test="job-link"], .jobTitle a'
      },
      unknown: {
        title: 'h3, .job-title, [data-testid="job-title"]',
        company: '.company, .job-company, [data-testid="job-company"]',
        location: '.location, .job-location, [data-testid="job-location"]',
        link: 'a'
      }
    };

    const selectors = siteSpecificSelectors[this.currentJobSite as keyof typeof siteSpecificSelectors] || siteSpecificSelectors.unknown;

    const titleEl = element.querySelector(selectors.title);
    const companyEl = element.querySelector(selectors.company);
    const locationEl = element.querySelector(selectors.location);
    const linkEl = element.querySelector(selectors.link);

    const title = titleEl?.textContent?.trim() || 'Unknown Title';
    const company = companyEl?.textContent?.trim() || 'Unknown Company';
    const location = locationEl?.textContent?.trim() || 'Unknown Location';
    
    return {
      title,
      company,
      location,
      url: linkEl?.getAttribute('href') || window.location.href,
      isSponsored: false,
      isRecruitmentAgency: this.detectRecruitmentAgency(title, company, element),
      dateFound: new Date().toISOString()
    };
  }

  private detectRecruitmentAgency(title: string, company: string, element: Element): boolean {
    const recruitmentAgencyIndicators = [
      // Common recruitment agency names
      /recruitment|recruiting|staffing|talent|headhunt|placement|search|consulting/i,
      // Common recruitment agency suffixes
      /\b(recruitment|recruiting|staffing|talent|search|consulting|solutions|services|group|partners|associates)\b/i,
      // Job title indicators
      /recruiter|talent acquisition|hr consultant|staffing specialist/i,
      // Description indicators (check element text content)
      /on behalf of|our client|leading company|confidential client|global organization/i
    ];

    // Check company name
    for (const indicator of recruitmentAgencyIndicators) {
      if (indicator.test(company)) {
        return true;
      }
    }

    // Check job title
    if (/recruiter|talent acquisition|hr consultant|staffing/i.test(title)) {
      return true;
    }

    // Check element text content for recruitment agency language
    const elementText = element.textContent || '';
    if (/on behalf of|our client|leading company|confidential client/i.test(elementText)) {
      return true;
    }

    return false;
  }

  private applyHighlight(element: Element, sponsorshipType: string = 'sponsored') {
    const htmlElement = element as HTMLElement;
    htmlElement.classList.add('jobloom-highlighted');
    
    const colors = {
      sponsored: { border: '#ff6b35', bg: 'rgba(255, 107, 53, 0.1)', badge: '#ff6b35' },
      promoted: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', badge: '#8b5cf6' },
      featured: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', badge: '#10b981' },
      premium: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', badge: '#f59e0b' },
      recruitment_agency: { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', badge: '#dc2626' }
    };

    const color = colors[sponsorshipType as keyof typeof colors] || colors.sponsored;

    htmlElement.style.cssText += `
      border: 3px solid ${color.border} !important;
      background: ${color.bg} !important;
      position: relative !important;
    `;

    if (!element.querySelector('.jobloom-badge')) {
      const badge = document.createElement('div');
      badge.className = 'jobloom-badge';
      const badgeIcon = sponsorshipType === 'recruitment_agency' ? '🏢' : '🎯';
      const badgeText = sponsorshipType === 'recruitment_agency' ? 'AGENCY' : sponsorshipType.toUpperCase();
      badge.textContent = `${badgeIcon} ${badgeText}`;
      badge.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: ${color.badge};
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1001;
      `;
      element.appendChild(badge);
    }
  }

  public clearHighlights() {
    document.querySelectorAll('.jobloom-highlighted').forEach(element => {
      element.classList.remove('jobloom-highlighted');
      (element as HTMLElement).style.border = '';
      (element as HTMLElement).style.background = '';
    });

    document.querySelectorAll('.jobloom-badge').forEach(badge => {
      badge.remove();
    });

    document.querySelectorAll('.jobloom-company-info').forEach(info => {
      info.remove();
    });
  }

  private setupAutoDetection() {
    // Auto-detect and highlight sponsored jobs when page loads or content changes
    this.observer = new MutationObserver((mutations) => {
      // Debounce the auto-detection to avoid too many API calls
      clearTimeout((this as any).autoDetectionTimeout);
      (this as any).autoDetectionTimeout = setTimeout(() => {
        this.autoDetectAndHighlight();
      }, 1000);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial auto-detection - always enabled by default
    setTimeout(() => {
      this.autoDetectAndHighlight();
    }, 2000);
  }

  private async autoDetectAndHighlight() {
    try {
      const jobElements = this.findJobElements();
      if (jobElements.length === 0) return;

      // Process jobs in smaller batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < jobElements.length; i += batchSize) {
        const batch = jobElements.slice(i, i + batchSize);
        await this.processBatchWithBadges(batch);
        
        // Small delay between batches
        if (i + batchSize < jobElements.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Auto-detection error:', error);
    }
  }

  private async processBatchWithBadges(jobElements: Element[]) {
    const jobsToCheck: Array<{element: Element, data: JobData}> = [];
    
    jobElements.forEach((element) => {
      // Skip if already processed
      if (element.querySelector('.jobloom-badge') || element.querySelector('.jobloom-company-info')) {
        return;
      }
      
      const jobData = this.extractJobData(element);
      jobsToCheck.push({ element, data: jobData });
    });

    if (jobsToCheck.length === 0) return;

    // Extract unique company names for batch checking
    const companyNames = [...new Set(jobsToCheck.map(job => job.data.company))];
    
    // Check company sponsorship status via Convex
    const sponsorshipResults = await this.checkCompanySponsorship(companyNames);
    
    // Create a map for quick lookup
    const sponsorshipMap = new Map();
    sponsorshipResults.forEach(result => {
      sponsorshipMap.set(result.company, result);
    });
    
    // Apply badges, company info, and job board buttons
    jobsToCheck.forEach((job) => {
      const sponsorshipData = sponsorshipMap.get(job.data.company);
      this.addJobBadge(job.element, sponsorshipData);
      this.addCompanyInfo(job.element, sponsorshipData);
      this.addJobBoardButton(job.element, job.data, sponsorshipData);
      
      if (sponsorshipData && sponsorshipData.isSponsored) {
        job.data.isSponsored = true;
        job.data.sponsorshipType = sponsorshipData.sponsorshipType || 'sponsored';
        this.addJobToBoard(job.data);
      }
    });
  }

  private addJobBadge(element: Element, sponsorshipData: any) {
    // Add badge at the top of the job posting (like UK Visa Checker)
    const badge = document.createElement('div');
    badge.className = 'jobloom-badge';
    
    if (sponsorshipData && sponsorshipData.isSponsored) {
      const sponsorshipType = sponsorshipData.sponsorshipType || 'sponsored';
      const badgeConfig = this.getBadgeConfig(sponsorshipType);
      
      badge.innerHTML = `
        <span style="
          background: ${badgeConfig.background};
          color: ${badgeConfig.color};
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          ${badgeConfig.icon} ${sponsorshipType}
        </span>
      `;
    } else {
      // Show "No Sponsorship" badge for clarity
      badge.innerHTML = `
        <span style="
          background: #f3f4f6;
          color: #6b7280;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        ">
          ❌ No Sponsorship
        </span>
      `;
    }
    
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1002;
      pointer-events: none;
    `;
    
    // Make parent element relative if it's not already
    const htmlElement = element as HTMLElement;
    if (getComputedStyle(htmlElement).position === 'static') {
      htmlElement.style.position = 'relative';
    }
    
    element.appendChild(badge);
  }

  private addCompanyInfo(element: Element, sponsorshipData: any) {
    // Add company info under the company name (like UK Visa Checker)
    const companyElement = this.findCompanyElement(element);
    if (!companyElement) return;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'jobloom-company-info';
    
    if (sponsorshipData && sponsorshipData.isSponsored) {
      const sponsorshipType = sponsorshipData.sponsorshipType || 'sponsored';
      const badgeConfig = this.getBadgeConfig(sponsorshipType);
      
      infoDiv.innerHTML = `
        <div style="
          margin-top: 4px;
          padding: 6px 10px;
          background: ${badgeConfig.background}15;
          border-left: 3px solid ${badgeConfig.background};
          border-radius: 4px;
          font-size: 12px;
          color: ${badgeConfig.background};
          font-weight: 600;
        ">
          ${badgeConfig.icon} Sponsors ${sponsorshipType} positions
          ${sponsorshipData.matchedName && sponsorshipData.matchedName !== sponsorshipData.company ? 
            `<br><span style="font-size: 10px; opacity: 0.8;">Matched as: ${sponsorshipData.matchedName}</span>` : ''}
        </div>
      `;
    } else {
      infoDiv.innerHTML = `
        <div style="
          margin-top: 4px;
          padding: 6px 10px;
          background: #f9fafb;
          border-left: 3px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        ">
          ℹ️ No sponsorship data available
        </div>
      `;
    }
    
    companyElement.appendChild(infoDiv);
  }

  private addJobBoardButton(element: Element, jobData: JobData, sponsorshipData: any) {
    // Skip if button already exists
    if (element.querySelector('.jobloom-job-board-btn')) return;

    const button = document.createElement('button');
    button.className = 'jobloom-job-board-btn';
    button.innerHTML = '📋 Add to Board';
    
    button.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      background: #4f46e5;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      z-index: 1003;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#4338ca';
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#4f46e5';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const originalContent = button.innerHTML;
      button.innerHTML = '⏳ Adding...';
      button.disabled = true;
      
      try {
        const success = await this.addToJobBoard(jobData, sponsorshipData);
        
        if (success) {
          button.innerHTML = '✅ Added!';
          button.style.background = '#10b981';
          
          // Show success animation
          button.style.transform = 'scale(1.1)';
          setTimeout(() => {
            button.style.transform = 'scale(1)';
          }, 150);
          
          // Revert after 2 seconds
          setTimeout(() => {
            button.innerHTML = '📋 On Board';
            button.style.background = '#6b7280';
            button.disabled = true;
          }, 2000);
        } else {
          throw new Error('Failed to add to job board');
        }
      } catch (error) {
        console.error('Error adding to job board:', error);
        button.innerHTML = '❌ Error';
        button.style.background = '#ef4444';
        
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.style.background = '#4f46e5';
          button.disabled = false;
        }, 2000);
      }
    });

    // Make parent element relative if it's not already
    const htmlElement = element as HTMLElement;
    if (getComputedStyle(htmlElement).position === 'static') {
      htmlElement.style.position = 'relative';
    }
    
    element.appendChild(button);
  }

  private findCompanyElement(jobElement: Element): Element | null {
    const siteSpecificSelectors = {
      linkedin: '.job-card-container__primary-description, .job-card-list__company, .entity-result__primary-subtitle',
      indeed: '[data-testid="company-name"], .companyName',
      glassdoor: '[data-test="employer-name"], .employerName',
      google_jobs: '.vNEEBe, .nJlQNd',
      seek: '[data-automation="jobCompany"], .company',
      totaljobs: '.company, .job-company',
      reed: '.gtmJobListingPostedBy, .company',
      jobsite: '.company, .job-company',
      unknown: '.company, .job-company, [data-testid="job-company"]'
    };

    const selectors = siteSpecificSelectors[this.currentJobSite as keyof typeof siteSpecificSelectors] || siteSpecificSelectors.unknown;
    return jobElement.querySelector(selectors);
  }

  private getBadgeConfig(sponsorshipType: string) {
    const configs = {
      sponsored: { 
        background: '#ef4444', 
        color: 'white', 
        icon: '🎯' 
      },
      promoted: { 
        background: '#8b5cf6', 
        color: 'white', 
        icon: '⭐' 
      },
      featured: { 
        background: '#10b981', 
        color: 'white', 
        icon: '🌟' 
      },
      premium: { 
        background: '#f59e0b', 
        color: 'white', 
        icon: '👑' 
      },
      verified: { 
        background: '#3b82f6', 
        color: 'white', 
        icon: '✅' 
      }
    };

    return configs[sponsorshipType as keyof typeof configs] || configs.sponsored;
  }

  private addJobToBoard(jobData: JobData) {
    chrome.runtime.sendMessage({
      action: 'addJob',
      data: jobData
    });
  }

  private detectApplicationForms() {
    // Check for common application form patterns
    const formSelectors = [
      'form[action*="apply"]',
      'form[action*="application"]',
      'form[id*="apply"]',
      'form[id*="application"]',
      'form[class*="apply"]',
      'form[class*="application"]',
      '.application-form',
      '.job-application',
      '.apply-form',
      '#application-form',
      '[data-testid*="application"]',
      '[data-testid*="apply"]'
    ];

    const inputSelectors = [
      'input[name*="name"]',
      'input[name*="email"]',
      'input[name*="phone"]',
      'input[type="email"]',
      'textarea[name*="cover"]',
      'input[name*="resume"]',
      'input[type="file"]'
    ];

    const hasApplicationForm = formSelectors.some(selector => 
      document.querySelector(selector)
    ) || inputSelectors.some(selector => 
      document.querySelectorAll(selector).length >= 2
    );

    const autofillButton = document.getElementById('jobloom-autofill');
    if (autofillButton) {
      autofillButton.style.display = hasApplicationForm ? 'block' : 'none';
    }

    // Re-check periodically as forms may load dynamically
    setTimeout(() => this.detectApplicationForms(), 3000);
  }

  private async autofillApplication() {
    // Load user profile data
    const profile = await this.loadAutofillProfile();
    if (!profile) {
      throw new Error('No autofill profile configured. Please set up your profile in settings.');
    }

    // Find and fill form fields
    const fieldsToFill = this.findFormFields();
    let filledCount = 0;

    for (const field of fieldsToFill) {
      try {
        const value = this.getValueForField(field, profile);
        if (value && this.fillField(field.element, value)) {
          filledCount++;
          // Small delay between fills to appear more natural
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn('Failed to fill field:', field.name, error);
      }
    }

    console.log(`Autofilled ${filledCount} fields`);
    
    if (filledCount === 0) {
      throw new Error('No compatible form fields found on this page.');
    }
  }

  private async loadAutofillProfile(): Promise<AutofillProfile | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['autofillProfile'], (result) => {
        resolve(result.autofillProfile || null);
      });
    });
  }

  private findFormFields() {
    const fields: Array<{element: HTMLElement, name: string, type: string}> = [];
    
    // Common field patterns for job applications
    const fieldPatterns = [
      // Personal Information
      { pattern: /first.*name|fname|given.*name/i, type: 'firstName' },
      { pattern: /last.*name|lname|family.*name|surname/i, type: 'lastName' },
      { pattern: /full.*name|name/i, type: 'fullName' },
      { pattern: /email/i, type: 'email' },
      { pattern: /phone|mobile|tel/i, type: 'phone' },
      { pattern: /address|street/i, type: 'address' },
      { pattern: /city/i, type: 'city' },
      { pattern: /state|province/i, type: 'state' },
      { pattern: /zip|postal/i, type: 'zipCode' },
      { pattern: /country/i, type: 'country' },
      
      // Professional Information
      { pattern: /current.*title|job.*title|position/i, type: 'currentTitle' },
      { pattern: /experience|years/i, type: 'experience' },
      { pattern: /education|degree|school|university/i, type: 'education' },
      { pattern: /skills|expertise/i, type: 'skills' },
      { pattern: /linkedin|profile/i, type: 'linkedinUrl' },
      { pattern: /portfolio|website/i, type: 'portfolioUrl' },
      { pattern: /github/i, type: 'githubUrl' },
      
      // Application Specific
      { pattern: /salary|compensation|expected.*pay/i, type: 'salaryExpectation' },
      { pattern: /start.*date|available|when/i, type: 'availableStartDate' },
      { pattern: /authorization|visa|work.*status/i, type: 'workAuthorization' },
      { pattern: /relocate|move|willing/i, type: 'relocate' },
      { pattern: /cover.*letter|motivation|why/i, type: 'coverLetter' }
    ];

    // Find input fields
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const element = input as HTMLElement;
      const name = element.getAttribute('name') || element.getAttribute('id') || element.getAttribute('placeholder') || '';
      const label = this.findFieldLabel(element);
      const searchText = `${name} ${label}`.toLowerCase();

      for (const pattern of fieldPatterns) {
        if (pattern.pattern.test(searchText)) {
          fields.push({
            element,
            name: searchText,
            type: pattern.type
          });
          break;
        }
      }
    });

    return fields;
  }

  private findFieldLabel(element: HTMLElement): string {
    // Try to find associated label
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }

    // Look for nearby label or text
    const parent = element.parentElement;
    if (parent) {
      const label = parent.querySelector('label');
      if (label) return label.textContent || '';
      
      // Check for text content in parent
      const textContent = parent.textContent || '';
      return textContent.replace(element.textContent || '', '').trim();
    }

    return element.getAttribute('placeholder') || '';
  }

  private getValueForField(field: {element: HTMLElement, name: string, type: string}, profile: AutofillProfile): string {
    switch (field.type) {
      // Personal Information
      case 'firstName': return profile.personalInfo.firstName;
      case 'lastName': return profile.personalInfo.lastName;
      case 'fullName': return `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
      case 'email': return profile.personalInfo.email;
      case 'phone': return profile.personalInfo.phone;
      case 'address': return profile.personalInfo.address;
      case 'city': return profile.personalInfo.city;
      case 'state': return profile.personalInfo.state;
      case 'zipCode': return profile.personalInfo.zipCode;
      case 'country': return profile.personalInfo.country;
      
      // Professional Information
      case 'currentTitle': return profile.professional.currentTitle;
      case 'experience': return profile.professional.experience;
      case 'education': return profile.professional.education;
      case 'skills': return profile.professional.skills;
      case 'linkedinUrl': return profile.professional.linkedinUrl;
      case 'portfolioUrl': return profile.professional.portfolioUrl;
      case 'githubUrl': return profile.professional.githubUrl;
      
      // Application Specific
      case 'salaryExpectation': return profile.preferences.salaryExpectation;
      case 'availableStartDate': return profile.preferences.availableStartDate;
      case 'workAuthorization': return profile.preferences.workAuthorization;
      case 'relocate': return profile.preferences.relocate ? 'Yes' : 'No';
      case 'coverLetter': return profile.preferences.coverLetter;
      
      default: return '';
    }
  }

  private fillField(element: HTMLElement, value: string): boolean {
    try {
      const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      
      if (input.type === 'checkbox' || input.type === 'radio') {
        const checkboxInput = input as HTMLInputElement;
        const shouldCheck = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
        if (checkboxInput.checked !== shouldCheck) {
          checkboxInput.checked = shouldCheck;
          checkboxInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      }
      
      if (input.tagName === 'SELECT') {
        const select = input as HTMLSelectElement;
        // Try to find matching option
        for (let i = 0; i < select.options.length; i++) {
          const option = select.options[i];
          if (option.text.toLowerCase().includes(value.toLowerCase()) || 
              option.value.toLowerCase().includes(value.toLowerCase())) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      }
      
      // Regular input or textarea
      if (input.value !== value) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to fill field:', error);
      return false;
    }
  }

  private async addToJobBoard(jobData: JobData, sponsorshipData: any): Promise<boolean> {
    try {
      // Generate unique ID for the job
      const jobId = `${jobData.company}-${jobData.title}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '-');
      
      // Create job board entry
      const jobBoardEntry: JobBoardEntry = {
        id: jobId,
        company: jobData.company,
        title: jobData.title,
        location: jobData.location,
        url: jobData.url,
        dateAdded: new Date().toISOString(),
        status: 'interested',
        notes: '',
        sponsorshipInfo: sponsorshipData ? {
          isSponsored: sponsorshipData.isSponsored,
          sponsorshipType: sponsorshipData.sponsorshipType
        } : undefined,
        isRecruitmentAgency: jobData.isRecruitmentAgency
      };

      // Get existing job board data
      const existingData = await this.getJobBoardData();
      
      // Check for duplicates (same company and similar title)
      const isDuplicate = existingData.some(entry => 
        entry.company.toLowerCase() === jobData.company.toLowerCase() &&
        this.similarTitles(entry.title, jobData.title)
      );

      if (isDuplicate) {
        console.log('Job already exists in board');
        return false;
      }

      // Add new entry
      existingData.push(jobBoardEntry);
      
      // Save to storage
      await this.saveJobBoardData(existingData);
      
      // Send message to background script for analytics
      chrome.runtime.sendMessage({
        action: 'jobAddedToBoard',
        data: jobBoardEntry
      });

      console.log('Job added to board successfully:', jobBoardEntry);
      return true;
      
    } catch (error) {
      console.error('Failed to add job to board:', error);
      return false;
    }
  }

  private async getJobBoardData(): Promise<JobBoardEntry[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['jobBoardData'], (result) => {
        resolve(result.jobBoardData || []);
      });
    });
  }

  private async saveJobBoardData(data: JobBoardEntry[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ jobBoardData: data }, () => {
        resolve();
      });
    });
  }

  private similarTitles(title1: string, title2: string): boolean {
    // Simple similarity check - normalize and compare
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm1 = normalize(title1);
    const norm2 = normalize(title2);
    
    // Check if one title contains the other or they're very similar
    return norm1.includes(norm2) || norm2.includes(norm1) || 
           this.levenshteinDistance(norm1, norm2) < Math.min(norm1.length, norm2.length) * 0.3;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'togglePeopleSearch') {
    const peopleSearchBtn = document.getElementById('jobloom-people-search') as HTMLButtonElement;
    if (peopleSearchBtn) {
      peopleSearchBtn.click();
    }
    return true;
  }
  
  if (request.action === 'triggerAutofill') {
    const autofillBtn = document.getElementById('jobloom-autofill') as HTMLButtonElement;
    if (autofillBtn && autofillBtn.style.display !== 'none') {
      autofillBtn.click();
    }
    return true;
  }
  
  if (request.action === 'toggleHighlight') {
    const highlightBtn = document.getElementById('jobloom-toggle') as HTMLButtonElement;
    if (highlightBtn) {
      highlightBtn.click();
    }
    return true;
  }
  
  if (request.action === 'clearHighlights') {
    const jobTracker = new JobTracker();
    jobTracker.clearHighlights();
    return true;
  }
  
  return false;
});

function initJobloomTracker() {
  chrome.storage.sync.get(['userId'], (result) => {
    if (result.userId) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new JobTracker());
      } else {
        new JobTracker();
      }
    } else {
      console.log('Jobloom: user not signed in, extension features disabled on this page.');
    }
  });
}

initJobloomTracker();