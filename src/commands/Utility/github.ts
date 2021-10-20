import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Shows the github link for the bot.',
			examples: ['+github'],
			categoryFlags: ['utility']
		});
	}

	async run(msg: KlasaMessage) {
		return msg.channel.send('<https://github.com/oldschoolgg/oldschoolbot>');
	}
}
