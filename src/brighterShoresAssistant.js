const { WikiScraper } = require('./WikiScraper');
const { ChatOpenAI } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RetrievalQAChain } = require("langchain/chains");
const { Document } = require("langchain/document");
require('dotenv').config();

class BrighterShoresAssistant {
    constructor() {
        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4-turbo-preview",
            temperature: 0.2,
            systemMessage: `You are a dedicated Brighter Shores guide, designed to provide comprehensive and practical assistance to players. When answering questions, always structure your responses in the following way:

LOCATION QUESTIONS
- Provide exact location details with multiple reference points
- List nearby landmarks and notable features
- Include navigation directions from common starting points (like Hopeport)
- Mention any relevant teleport points or shortcuts
- List any requirements to access the area (quests, items, or level requirements)

QUEST QUESTIONS
- List full quest requirements and prerequisites
- Provide step-by-step instructions with specific locations
- Mention required items or tools needed
- Include any important NPCs involved
- Note quest rewards and follow-up quests
- Warn about any challenging elements or recommended levels

ITEM QUESTIONS
- List all known locations to obtain the item
- Specify if it's craftable, gatherable, or purchasable
- Include required tools or skills needed
- Mention any related quests or uses
- Note if it's tradeable or bankable
- Include approximate costs if purchasable
- Include relevant professions and associated skills or knowledge for further context

PROFESSION QUESTIONS
- Detail optimal leveling locations and methods
- List required tools and their upgrades
- Explain any special mechanics or techniques
- Provide efficiency tips and common mistakes to avoid
- Include relevant Knowledge Point recommendations
- Mention profitable aspects of the profession

COMBAT QUESTIONS
- Explain combat mechanics involved
- List recommended equipment and levels
- Include strategy tips and common pitfalls
- Mention any relevant passive skills
- Note any special attacks or mechanics

GENERAL GUIDELINES
1. Always provide context and additional relevant information.
2. Include multiple methods or approaches when available.
3. Mention any related content or systems.
4. Note any recent changes or known issues.
5. Include efficiency tips and time-saving methods.
6. Specify if information might change due to early access.
7. Provide concise and direct answers; avoid unnecessary phrases like "Based on the information" or "As per the data."

FORMAT RESPONSES AS:
1. Direct answer to the question, short and concise without losing too much information.
2. Detailed explanation with specific locations/requirements.
3. Additional relevant information.
4. Tips and recommendations.
5. Related content or warnings if applicable.
6. Supply sources only if it is relevant to the question.

Remember: Players need practical, actionable information that helps them navigate and progress efficiently in the game. Vague or single-line responses should be avoided in favor of comprehensive, useful guidance.`
        });

        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        this.vectorStore = null;
        this.scraper = new WikiScraper();
    }

    async initialize(forceRefresh = false) {
        console.log("Fetching wiki content...");
        const wikiContent = await this.scraper.scrapeWiki(forceRefresh);
        
        if (!wikiContent.length) {
            throw new Error("No wiki content found to process");
        }

        console.log("Processing wiki content...");
        const documents = wikiContent.map(page => {
            return new Document({
                pageContent: `Title: ${page.title}\n\nContent: ${page.content}`,
                metadata: {
                    title: page.title,
                    url: page.url,
                    categories: page.categories,
                    last_modified: page.last_modified
                }
            });
        });

        // Skip splitting to keep documents intact
        const splitDocs = documents;

        // Create vector store
        console.log("Creating vector store...");
        this.vectorStore = await MemoryVectorStore.fromDocuments(
            splitDocs,
            this.embeddings
        );

        console.log("Assistant initialization complete!");
    }

    async askQuestion(question) {
        if (!this.vectorStore) {
            throw new Error("Assistant not initialized. Please call initialize() first.");
        }

        const retriever = this.vectorStore.asRetriever();
        retriever.k = 15; // Increase the number of documents to retrieve
        retriever.relevanceScoreCutoff = 0.7; // Adjust relevance score cutoff

        const chain = RetrievalQAChain.fromLLM(
            this.model,
            retriever,
            {
                returnSourceDocuments: true,
                verbose: true
            }
        );

        const response = await chain.call({
            query: question
        });

        return {
            answer: response.text,
            sources: response.sourceDocuments.map(doc => ({
                title: doc.metadata.title,
                url: doc.metadata.url
            }))
        };
    }

    async refreshKnowledge() {
        console.log("Refreshing knowledge base...");
        await this.initialize();
    }

    async askQuestionStream(question, onChunk) {
        if (!this.vectorStore) {
            throw new Error("Assistant not initialized. Please call initialize() first.");
        }

        const retriever = this.vectorStore.asRetriever();
        const relevantDocs = await retriever.getRelevantDocuments(question);
        
        const stream = await this.model.stream({
            messages: [
                { role: "system", content: this.model.systemMessage },
                { role: "user", content: question }
            ]
        });

        let fullResponse = '';
        for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
                fullResponse += content;
                onChunk(content);
            }
        }

        return {
            text: fullResponse,
            sources: relevantDocs.map(doc => ({
                title: doc.metadata.title,
                url: doc.metadata.url
            }))
        };
    }
}

module.exports = { BrighterShoresAssistant }; 