const { WikiScraper } = require('./WikiScraper');
const { ChatOpenAI } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RetrievalQAChain } = require("langchain/chains");
const { Document } = require("langchain/document");

const { SystemMessage, HumanMessage } = require("langchain/schema");
require('dotenv').config();

class BrighterShoresAssistant {
    constructor() {
        this.systemMessage = `You are a dedicated Brighter Shores expert assistant, designed to provide comprehensive and practical assistance to players. When answering questions, always structure your responses in the following way:

LOCATION QUESTIONS
- Episodes are packets of content, containing new non-player characters, monsters, professions, and rooms, that all contribute to the main storyline of Brighter Shores. Players can unlock new episodes by progressing through the storyline. Currently, four different episodes are available. Two episodes, the Mine of Mantuban and Crenopolis, can only be accessed by players who bought a Premium Pass.
- Provide exact location details with enough information to find it on your own.
- List nearby landmarks and notable features
- Include navigation directions from common starting points (like Hopeport, Hopeforest, Mine of Mantuban, Crenopolis, Stonemaw Hill, etc.)
- Mention any relevant teleport points or shortcuts
- List any requirements to access the area (quests, items, or level requirements)

QUEST QUESTIONS
- Quests are storylines containing lore, environmental puzzles and tasks that require a certain Profession level. Quests vary in difficulty, indicated by stars from 0 to 5 in the quest list.
- List full quest requirements and prerequisites
- Provide step-by-step instructions with specific locations
- Mention required items or tools needed
- Include any important NPCs involved
- Note quest rewards and follow-up quests
- Warn about any challenging elements or recommended levels
- Always start by answering the quest question first, and then provide the rest of the information that you find relevant for the quest.

ITEM QUESTIONS
- Specify all known locations to obtain the item
- Specify if it's craftable, gatherable, or purchasable
- Include required tools or skills needed
- Include any requirements to use the item
- Mention any related quests or uses
- Note if it's tradeable or bankable
- Include approximate costs if purchasable
- Include relevant professions and associated skills or knowledge for further context

MONSTER QUESTIONS
- Monsters are creatures in Brighter Shores that can be attacked. They are fought in combat for their loot, including valuable currency items. Monsters in Brighter Shores scale in comparison to a players combat skill in their respective region. Once a player meets a specific level threshold, the monster in question is automatically upgraded to a stronger variant. Players can opt to attack a lower level monster by selecting "Past Action" when attacking a monster to display a list of attack-able variants for that monster
- List all known locations to find the monster
- There are passive monsters and aggressive monsters.
- Include any requirements to access the area (quests, items, or level requirements)
- Include any relevant teleport points or shortcuts
- List any nearby landmarks and notable features

FACTION QUESTIONS
- Factions in Brighter Shores allow the player character to specialise in using a specific combat style, though all factions have access to melee, ranged and magic. Players start off as a guard with the option to choose between being a Cryoknight, Guardian or Hammermage.
- List all known locations to find the faction
- Include any requirements to access the area (quests, items, or level requirements)
- Include any relevant teleport points or shortcuts
- List any nearby landmarks and notable features

PROFESSION QUESTIONS
- Detail optimal leveling locations and methods
- List required tools and their upgrades
- If asking about how to level up a profession the fastest, make sure to detail which items are needed to level up the fastest, where to get them, how much XP they give etc
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
- Direct answer to the question first. Limit it to maximum 2-3 sentences.
- Always provide context and additional relevant information.
- Include multiple methods or approaches when available.
- Mention any related content or systems.
- Include efficiency tips and time-saving methods if relevant.
- Provide concise and direct answers; avoid unnecessary phrases like "Based on the information" or "As per the data."

FORMAT RESPONSES AS:
1. Direct answer to the question first. Limit it to maximum 2-3 sentences.
2. Only use list if it is something that has to be in chronological order.
3. Answer as if you are a gamer yourself and you are helping out your friend figuring out the game. 
4. If the question requires a detailed explanation, provide a detailed explanation with specific locations/requirements etc.

Remember: Players need practical, actionable information that helps them navigate and progress efficiently in the game. Vague or single-line responses should be avoided in favor of comprehensive, useful guidance.`;

        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4-turbo",
            temperature: 0.5,
            streaming: true,
            systemMessage: this.systemMessage
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
        retriever.k = 30; // Increase the number of documents to retrieve
        retriever.relevanceScoreCutoff = 0.5; // Adjust relevance score cutoff

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
            sources: response.sourceDocuments
                .sort((a, b) => b.metadata.score - a.metadata.score) // Sort by relevance score
                .map(doc => ({
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
        console.log(question);

        const retriever = this.vectorStore.asRetriever();
        const relevantDocs = await retriever.getRelevantDocuments(question);

        const context = relevantDocs
            .map(doc => doc.pageContent)
            .join('\n\n');

        const messages = [
            new SystemMessage(this.systemMessage),
            new HumanMessage(`Context:\n${context}\n\nQuestion: ${question}`)
        ];

        try {
            const stream = await this.model.stream(messages);

            for await (const chunk of stream) {
                if (chunk.content) {
                    onChunk(chunk.content);
                }
            }

            return {
                sources: relevantDocs.map(doc => ({
                    title: doc.metadata.title,
                    url: doc.metadata.url
                }))
            };
        } catch (error) {
            console.error('Streaming error:', error);
            throw error;
        }
    }

    async getRelevantSources(question) {
        if (!this.vectorStore) {
            throw new Error("Assistant not initialized. Please call initialize() first.");
        }

        const retriever = this.vectorStore.asRetriever();
        const relevantDocs = await retriever.getRelevantDocuments(question);
        
        return relevantDocs
            .sort((a, b) => b.metadata.score - a.metadata.score)
            .map(doc => ({
                title: doc.metadata.title,
                url: doc.metadata.url
            }));
    }
}

module.exports = { BrighterShoresAssistant }; 