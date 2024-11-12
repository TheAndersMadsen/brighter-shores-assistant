const axios = require('axios');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const { Config } = require('./config');
require('dotenv').config();

class WikiScraper {
    constructor() {
        this.WIKI_BASE_URL = 'https://brightershoreswiki.org/api.php';
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.knownPages = {};
        this.headers = {
            'User-Agent': 'BrighterShoresAssistant/1.0 (Educational Purpose)'
        };
    }

    async getAllPages() {
        try {
            const allPages = [];
            let apcontinue = null;

            do {
                const params = {
                    action: 'query',
                    list: 'allpages',
                    aplimit: 500,
                    apfilterredir: 'nonredirects',
                    format: 'json',
                    formatversion: '2'
                };

                if (apcontinue) {
                    params.apcontinue = apcontinue;
                }

                const response = await axios.get(this.WIKI_BASE_URL, { params, headers: this.headers });
                const data = response.data;

                if (data.query && data.query.allpages) {
                    for (const page of data.query.allpages) {
                        allPages.push(page.title);
                    }
                }

                apcontinue = data.continue?.apcontinue;
            } while (apcontinue);

            console.log(`Found ${allPages.length} pages to scrape`);
            return allPages;
        } catch (error) {
            console.error('Error getting all pages:', error.message);
            return [];
        }
    }

    async scrapePageContent(title) {
        try {
            const params = {
                action: 'query',
                prop: 'revisions|categories|info',
                titles: title,
                rvslots: '*',
                rvprop: 'content|timestamp',
                inprop: 'url',
                format: 'json',
                formatversion: '2'
            };

            const response = await axios.get(this.WIKI_BASE_URL, { params, headers: this.headers });
            const page = response.data.query.pages[0];

            if (page.missing) {
                console.log(`Page ${title} not found`);
                return null;
            }

            const revision = page.revisions[0];
            const content = revision.slots.main.content;

            return {
                title: page.title,
                content: content,
                url: page.canonicalurl,
                last_modified: revision.timestamp,
                categories: page.categories ? page.categories.map(cat => cat.title) : []
            };

        } catch (error) {
            console.error(`Error scraping page ${title}:`, error.message);
            return null;
        }
    }

    async scrapeWiki(forceRefresh = false) {
        try {
            await this._loadKnownPages();
            const pages = await this.getAllPages();
            
            if (!pages.length) {
                console.warn("No pages found to scrape");
                return [];
            }

            const content = [];
            const batchSize = 5;
            
            for (let i = 0; i < pages.length; i += batchSize) {
                const batch = pages.slice(i, i + batchSize);
                const promises = batch.map(async (title) => {
                    // Check cache first
                    if (!forceRefresh && this.knownPages[title]) {
                        const cachedContent = await this._loadPageContent(title);
                        if (cachedContent) {
                            return cachedContent;
                        }
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const result = await this.scrapePageContent(title);
                    if (result) {
                        this.knownPages[title] = result.last_modified;
                        await this._savePageContent(result);
                        return result;
                    }
                });

                const results = await Promise.all(promises);
                content.push(...results.filter(Boolean));
                
                console.log(`Processed ${Math.min(i + batchSize, pages.length)} of ${pages.length} pages`);
            }

            // If no content was actually processed, force a refresh
            if (content.length === 0) {
                console.log("No content was processed. Forcing refresh...");
                return this.scrapeWiki(true);
            }

            await this._saveKnownPages();
            return content;

        } catch (error) {
            console.error('Error scraping wiki:', error);
            throw error;
        }
    }

    async _saveKnownPages() {
        try {
            const savePath = path.join(Config.CACHE_DIR, "known_pages.json");
            await fs.mkdir(Config.CACHE_DIR, { recursive: true });
            await fs.writeFile(savePath, JSON.stringify(this.knownPages), 'utf8');
        } catch (error) {
            console.error('Error saving known pages:', error);
        }
    }

    async _loadKnownPages() {
        try {
            const savePath = path.join(Config.CACHE_DIR, "known_pages.json");
            const data = await fs.readFile(savePath, 'utf8');
            this.knownPages = JSON.parse(data);
            console.log(`Loaded ${Object.keys(this.knownPages).length} known pages from cache`);
        } catch (error) {
            console.log('No existing cache found or error loading cache');
            this.knownPages = {};
        }
    }

    async _savePageContent(pageData) {
        try {
            const pagePath = path.join(Config.CACHE_DIR, 'pages', `${encodeURIComponent(pageData.title)}.json`);
            await fs.mkdir(path.join(Config.CACHE_DIR, 'pages'), { recursive: true });
            await fs.writeFile(pagePath, JSON.stringify(pageData), 'utf8');
        } catch (error) {
            console.error(`Error saving page content for ${pageData.title}:`, error);
        }
    }

    async _loadPageContent(title) {
        try {
            const pagePath = path.join(Config.CACHE_DIR, 'pages', `${encodeURIComponent(title)}.json`);
            const data = await fs.readFile(pagePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
}

module.exports = { WikiScraper }; 