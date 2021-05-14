import { CommandStore, KlasaMessage } from 'klasa';
import { Bank } from 'oldschooljs';

import { Activity, Time, xpBoost } from '../../lib/constants';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import {
	AnimatedArmourActivityTaskOptions,
	CyclopsActivityTaskOptions
} from '../../lib/types/minions';
import { formatDuration, itemID } from '../../lib/util';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';
import resolveItems from '../../lib/util/resolveItems';

export const Armours = [
	{
		name: 'Rune',
		timeToFinish: Time.Minute * 1.2,
		tokens: 40,
		items: resolveItems(['Rune full helm', 'Rune platebody', 'Rune platelegs'])
	},
	{
		name: 'Adamant',
		timeToFinish: Time.Minute * 1.15,
		tokens: 30,
		items: resolveItems(['Adamant full helm', 'Adamant platebody', 'Adamant platelegs'])
	},
	{
		name: 'Mithril',
		timeToFinish: Time.Minute * 0.95,
		tokens: 25,
		items: resolveItems(['Mithril full helm', 'Mithril platebody', 'Mithril platelegs'])
	},
	{
		name: 'Black',
		timeToFinish: Time.Minute * 0.65,
		tokens: 20,
		items: resolveItems(['Black full helm', 'Black platebody', 'Black platelegs'])
	}
];

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			altProtection: true,
			oneAtTime: true,
			cooldown: 1,
			usage: '[quantity:int{1}] <tokens|cyclops> [action:string]',
			usageDelim: ' ',
			aliases: ['wg', 'warriorguild']
		});
	}

	@requiresMinion
	@minionNotBusy
	async run(
		msg: KlasaMessage,
		[quantity = null, minigame]: [null | number, 'tokens' | 'cyclops']
	) {
		await msg.author.settings.sync(true);

		const atkLvl = msg.author.skillLevel(SkillsEnum.Attack);
		const strLvl = msg.author.skillLevel(SkillsEnum.Strength);
		if (atkLvl + strLvl < 130 && atkLvl !== 99 && strLvl !== 99) {
			return msg.send(
				`To enter the Warrior's Guild, your Attack and Strength levels must add up to atleast 130, or you must have level 99 in either.`
			);
		}

		const userBank = new Bank(msg.author.settings.get(UserSettings.Bank));

		if (minigame === 'tokens') {
			const maxTripLength = 200984200 

			const armorSet = Armours.find(set => userBank.has(set.items));
			if (!armorSet) {
				return msg.send(
					`You don't have any armor sets to use for getting tokens! Get a full helm, platebody and platelegs of one of the following: ${Armours.map(
						t => t.name
					).join(', ')}.`
				);
			}

			if (quantity === null) {
				quantity = Math.floor(maxTripLength / armorSet.timeToFinish);
			}

			const duration = armorSet.timeToFinish * quantity * xpBoost;

			if (duration > maxTripLength) {
				return msg.send(
					`${msg.author.minionName} can't go on trips longer than ${formatDuration(
						maxTripLength
					)}, try a lower quantity. The highest amount of animated ${
						armorSet.name
					} armour you can kill is ${Math.floor(maxTripLength / armorSet.timeToFinish)}.`
				);
			}

			await addSubTaskToActivityTask<AnimatedArmourActivityTaskOptions>(this.client, {
				armourID: armorSet.name,
				userID: msg.author.id,
				channelID: msg.channel.id,
				quantity,
				duration,
				type: Activity.AnimatedArmour
			});

			const response = `${msg.author.minionName} is now killing ${quantity}x animated ${
				armorSet.name
			} armour, it'll take around ${formatDuration(duration)} to finish.`;

			return msg.send(response);
		}

		if (minigame === 'cyclops') {
			const maxTripLength = 200984200 
			// Check if either 100 warrior guild tokens or attack cape (similar items in future)
			const amountTokens = userBank.amount('Warrior guild token');
			if (amountTokens < 100) {
				return msg.send(`You need atleast 100 Warriors guild tokens to kill Cyclops.`);
			}
			// If no quantity provided, set it to the max.
			if (quantity === null) {
				const maxTokensTripLength = Math.floor((amountTokens - 10) / 10) * Time.Minute;
				quantity = Math.floor(
					(maxTokensTripLength > maxTripLength ? maxTripLength : maxTokensTripLength) /
						(Time.Second * 30)
				);
			}

			const duration = Time.Second * 30 * quantity * xpBoost;

			if (duration > maxTripLength) {
				return msg.send(
					`${msg.author.minionName} can't go on trips longer than ${formatDuration(
						maxTripLength
					)}, try a lower quantity. The highest amount of cyclopes that can be killed is ${Math.floor(
						maxTripLength / (Time.Second * 30)
					)}.`
				);
			}

			const tokensToSpend = Math.floor((duration / Time.Minute) * 10 + 10);

			if (amountTokens < tokensToSpend) {
				return msg.send(
					`You don't have enough Warrior guild tokens to kill cyclopes for ${formatDuration(
						duration
					)}, try a lower quantity. You need atleast ${Math.floor(
						(duration / Time.Minute) * 10 + 10
					)}x Warrior guild tokens to kill ${quantity}x cyclopes.`
				);
			}

			await addSubTaskToActivityTask<CyclopsActivityTaskOptions>(this.client, {
				userID: msg.author.id,
				channelID: msg.channel.id,
				quantity,
				duration,
				type: Activity.Cyclops
			});

			let response = `${
				msg.author.minionName
			} is now off to kill ${quantity}x Cyclops, it'll take around ${formatDuration(
				duration
			)} to finish. Removed ${tokensToSpend} Warrior guild tokens from your bank.`;

			await msg.author.removeItemFromBank(itemID('Warrior guild token'), tokensToSpend);

			return msg.send(response);
		}
	}
}
