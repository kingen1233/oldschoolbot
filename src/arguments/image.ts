import { Argument, KlasaMessage, Possible } from 'klasa';
import fetch from 'node-fetch';

export default class extends Argument {
	async parseURL(imageURL: string) {
		const imageBuffer = await fetch(imageURL).then((result: any) => result.buffer());
		return [imageBuffer, imageURL];
	}

	async run(arg: string, _: Possible, msg: KlasaMessage) {
		// If theres nothing provided, search the channel for an image.
		if (typeof arg === 'undefined') {
			const messageBank = await msg.channel.messages.fetch({
				limit: 20
			});

			for (const message of messageBank.values()) {
				const fetchedAttachment = message.attachments.first();
				if (fetchedAttachment && fetchedAttachment.height) {
					return this.parseURL(fetchedAttachment.proxyURL);
				}
			}
		} else {
			const constructor = this.constructor as typeof Argument;
			// If they mentioned someone, return their avatar.
			const member = constructor.regex.userOrMember.test(arg)
				? await msg.guild!.members.fetch(constructor.regex.userOrMember.exec(arg)![1]).catch(() => null)
				: null;

			if (member) {
				return this.parseURL(
					member.user.displayAvatarURL({
						format: 'png',
						size: 512
					})
				);
			}
		}

		// If we can't find any image, use the authors avatar.
		return this.parseURL(
			msg.author.displayAvatarURL({
				format: 'png',
				size: 512
			})
		);
	}
}
