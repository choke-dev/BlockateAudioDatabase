import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationCommandType, MessageContextMenuCommandInteraction, MessageFlags } from 'discord.js';
import { prisma } from '../lib/database';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const filePath = "./data/uploadtable-command-usage.json";

@ApplyOptions<Command.Options>({
	description: 'Extract table data from a message and upload it to the database',
	preconditions: ["StaffOnly"]
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register context menu command available from any message
		registry.registerContextMenuCommand({
			name: 'Upload Table Data',
			type: ApplicationCommandType.Message
		});
	}

	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		// Cast to MessageContextMenuCommandInteraction to access message property
		const menuInteraction = interaction as MessageContextMenuCommandInteraction;
		const targetMessage = menuInteraction.targetMessage;
		const content = targetMessage.content;

		await interaction.deferReply({
			flags: [MessageFlags.Ephemeral]
		});

		// Parse the table from the message content
		const tableData = this.parseTableFromMessage(content);

		if (!tableData || tableData.length === 0) {
			return interaction.editReply({
				content: ":x: No valid table data found in the message. Make sure the message contains a table with ID, Name, and Category columns."
			});
		}

		// Upload each row to the database
		const results = {
			success: 0,
			failed: 0,
			errors: [] as string[]
		};

		for (const row of tableData) {
			try {
				await prisma.audio.create({
					data: {
						id: row.id,
						name: row.name,
						category: row.category,
						whitelisterName: interaction.user.username,
						whitelisterUserId: BigInt(interaction.user.id),
						whitelisterType: "roblox"
					}
				});
				results.success++;
			} catch (error) {
				results.failed++;
				if (error instanceof PrismaClientKnownRequestError) {
					if (error.code === "P2002") {
						results.errors.push(`ID ${row.id} already exists in the database.`);
					} else {
						results.errors.push(`Error adding ID ${row.id}: ${error.message}`);
					}
				} else {
					results.errors.push(`Unknown error adding ID ${row.id}`);
				}
			}
		}

		// Log command usage
		this.logCommandUsage(interaction, tableData);

		// Prepare response message
		const responseLines = [
			`:white_check_mark: Table data upload complete:`,
			``,
			`Successfully added: ${results.success}`,
			`Failed: ${results.failed}`
		];

		if (results.errors.length > 0) {
			responseLines.push(``, `Errors:`);
			// Limit to first 10 errors to avoid hitting Discord message length limits
			const displayErrors = results.errors.slice(0, 10);
			responseLines.push(...displayErrors.map(err => `- ${err}`));
			
			if (results.errors.length > 10) {
				responseLines.push(`... and ${results.errors.length - 10} more errors.`);
			}
		}

		return interaction.editReply({
			content: responseLines.join('\n')
		});
	}

	/**
	 * Parse a table from a message content
	 * Supports markdown tables and plain text tables with varying formats
	 */
	private parseTableFromMessage(content: string): { id: string, name: string, category: string }[] {
		const results: { id: string, name: string, category: string }[] = [];
		
		// Split the content into lines
		const lines = content.split('\n');
		
		// Find header line (contains ID, Name, Category)
		let headerIndex = -1;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].toLowerCase();
			if (line.includes('id') && line.includes('name') && line.includes('category')) {
				headerIndex = i;
				break;
			}
		}
		
		if (headerIndex === -1) return results;
		
		// Skip the header line and the separator line (if it exists)
		let startIndex = headerIndex + 1;
		if (startIndex < lines.length && lines[startIndex].includes('---')) {
			startIndex++;
		}
		
		// Process data rows
		for (let i = startIndex; i < lines.length; i++) {
			const line = lines[i].trim();
			
			// Skip empty lines or separator lines
			if (!line || line.startsWith('---') || line.startsWith('===')) continue;
			
			// Stop if we hit another header or end of table
			if (line.startsWith('#') || line.startsWith('|') === false) break;
			
			// Parse the row
			const row = this.parseTableRow(line);
			if (row) {
				results.push(row);
			}
		}
		
		return results;
	}
	
	/**
	 * Parse a single table row
	 */
	private parseTableRow(line: string): { id: string, name: string, category: string } | null {
		// Remove leading and trailing | characters and split by |
		const cleanLine = line.trim().replace(/^\||\|$/g, '');
		const cells = cleanLine.split('|').map(cell => cell.trim());
		
		// We need at least 3 cells for ID, Name, and Category
		if (cells.length < 3) return null;
		
		// Extract the data
		const id = cells[0];
		const name = cells[1];
		const category = cells[2];
		
		// Validate the data
		if (!id || !name || !category) return null;
		
		return { id, name, category };
	}

	/**
	 * Log command usage to a JSON file
	 */
	private logCommandUsage(interaction: Command.ContextMenuCommandInteraction, tableData: { id: string, name: string, category: string }[]) {
		if (!existsSync(filePath)) {
			writeFileSync(filePath, JSON.stringify([]));
		}

		const fileContent = readFileSync(filePath, 'utf-8');
		const jsonData = JSON.parse(fileContent);

		const newEntry = {
			user: interaction.user.id,
			timestamp: Date.now(),
			timestamp_string: new Date().toISOString(),
			rowCount: tableData.length,
			rows: tableData
		};

		jsonData.push(newEntry);
		writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
	}
}