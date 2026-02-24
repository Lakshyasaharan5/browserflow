import chalk from "chalk";

export class Logger {
    constructor(private readonly source?: string) {}

    private timestamp(): string {
        return new Date().toISOString();
    }

    private log(level: string, source: string, message: string, ...data: unknown[]): void {
        console.log(`[${this.timestamp()}] ${level} [${source}]: ${message}`, ...data);
    }

    info(message: string, ...data: unknown[]) {
        if (!this.source) throw new Error("Logger source missing");
        this.log(chalk.green("INFO"), this.source, message, ...data);
    }

    error(message: string, ...data: unknown[]) {
        if (!this.source) throw new Error("Logger source missing");
        this.log(chalk.red("ERROR"), this.source, message, ...data);
    }

    metric(message: string, ...data: unknown[]) {
        if (!this.source) throw new Error("Logger source missing");
        this.log(chalk.cyanBright("METRIC"), this.source, message, ...data);
    }

    child(source: string): Logger {
        const next = this.source ? `${this.source}:${source}` : source;
        return new Logger(next);
    }
}
