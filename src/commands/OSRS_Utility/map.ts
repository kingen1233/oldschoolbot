import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Shows the link for the official OSRS map.',
			aliases: ['worldmap'],
			examples: ['+map']
		});
	}

	async run(msg: KlasaMessage) {
		return msg.channel.send('https://www.runescape.com/oldschool/world-map');
	}
}
