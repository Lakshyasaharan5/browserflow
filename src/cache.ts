import { Page } from "playwright";
import { Logger } from "./logger";
import { createHash } from "crypto";
import path from "path";
import fs from "fs/promises";

const CACHE_VERSION = 1;

type CacheInit = {
    instructions: string;
    startUrl: string;
    logger: Logger;
};

type ToolStep = { type: "click"; xpath: string } | { type: "type"; xpath: string; text: string };

type CacheEntry = {
    version: number;
    timestamp: string;
    instructions: string;
    startUrl: string;
    steps: ToolStep[];
    result: string;
};

export class Cache {
    private key: string;
    private recording: ToolStep[] | null = null;
    private logger: Logger;

    private instructions: string;
    private startUrl: string;

    constructor({ instructions, startUrl, logger }: CacheInit) {
        this.instructions = instructions;
        this.startUrl = startUrl;
        this.key = this.buildKey(instructions, startUrl);
        this.logger = logger.child("Cache");
    }

    async tryReplay(page: Page): Promise<string | null> {
        const entry: CacheEntry | null = await this.readEntry();

        if (!entry) {
            this.logger.info("Miss");
            return null;
        }

        this.logger.info("Hit — replaying steps", {
            steps: entry.steps.length,
        });

        for (const step of entry.steps) {
            switch (step.type) {
                case "click":
                    await page.locator(step.xpath).click();
                    break;

                case "type":
                    await page.locator(step.xpath).fill(step.text);
                    break;
            }
        }

        this.logger.info("Replay completed");
        return entry.result;
    }

    beginRecording() {
        this.logger.info("Recording started");
        this.recording = [];
    }

    record(step: ToolStep) {
        if (!this.recording) return;
        this.recording.push(step);
    }

    endRecording() {
        if (!this.recording) return;
        this.recording = this.cloneForCache(this.recording);
        this.logger.info("Recording finalized", {
            steps: this.recording.length,
        });
    }

    async store(result: string) {
        if (!this.recording) {
            this.logger.info("No recording present — skipping store");
            return;
        }

        const entry: CacheEntry = {
            version: CACHE_VERSION,
            timestamp: new Date().toISOString(),
            instructions: this.instructions,
            startUrl: this.startUrl,
            steps: this.cloneForCache(this.recording),
            result,
        };

        this.writeEntry(entry);

        this.logger.info("Cache stored", {
            steps: entry.steps.length,
        });

        this.recording = null;
    }

    private buildKey(instructions: string, startUrl: string): string {
        return createHash("sha256").update(`${instructions}::${startUrl}`).digest("hex");
    }

    private getCacheDir() {
        return path.join(process.cwd(), ".cache");
    }

    private getCacheFile() {
        return path.join(this.getCacheDir(), `${this.key}.json`);
    }

    private cloneForCache<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    private async readEntry(): Promise<CacheEntry | null> {
        try {
            const file = this.getCacheFile();
            const raw = await fs.readFile(file, "utf-8");
            return this.deserialize(raw);
        } catch {
            return null;
        }
    }

    private async writeEntry(entry: CacheEntry) {
        const dir = this.getCacheDir();
        await fs.mkdir(dir, { recursive: true });

        const file = this.getCacheFile();
        const serialized = this.serialize(entry);

        await fs.writeFile(file, serialized, "utf-8");
    }

    private serialize(entry: CacheEntry): string {
        return JSON.stringify(entry, null, 2);
    }

    private deserialize(raw: string): CacheEntry {
        return JSON.parse(raw);
    }
}
