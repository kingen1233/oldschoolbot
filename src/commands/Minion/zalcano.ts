import { calcWhatPercent, percentChance, reduceNumByPercent } from 'e';
import { CommandStore, KlasaMessage } from 'klasa';

import { Activity, Time, xpBoost, ZALCANO_ID } from '../../lib/constants';
//import { hasGracefulEquipped } from '../../lib/gear/functions/hasGracefulEquipped';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import removeFoodFromUser from '../../lib/minions/functions/removeFoodFromUser';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import { Skills } from '../../lib/types';
import { ZalcanoActivityTaskOptions } from '../../lib/types/minions';
import { formatDuration } from '../../lib/util';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';

const skillRequirements: Skills = {
	mining: 70,
	smithing: 70,
	cooking: 70,
	farming: 70,
	fishing: 70,
	woodcutting: 70,
	agility: 70,
	herblore: 70,
	construction: 70,
	hunter: 70
};

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			oneAtTime: true,
			altProtection: true,
			requiredPermissions: ['ADD_REACTIONS', 'ATTACH_FILES'],
			categoryFlags: ['minion', 'skilling', 'minigame'],
			description: 'Sends your minion to fight Zalcano. Requires food and 150 QP.',
			examples: ['+zalcano']
		});
	}

	calcPerformance(kcLearned: number, skillPercentage: number) {
		let basePerformance = 50;

		// Up to +25% performance for KC
		basePerformance += Math.floor(kcLearned / 4);

		// Up to +20% Performance for Skill Levels
		basePerformance += Math.floor(skillPercentage / 10);

		return Math.min(100, basePerformance);
	}

	@minionNotBusy
	@requiresMinion
	async run(msg: KlasaMessage) {
		const [hasSkillReqs, reason] = msg.author.hasSkillReqs(skillRequirements);
		if (!hasSkillReqs) {
			return msg.channel.send(`To fight Zalcano, you need: ${reason}.`);
		}
		if (msg.author.settings.get(UserSettings.QP) < 150) {
			return msg.send(`To fight Zalcano, you need 150 QP.`);
		}

		const kc = msg.author.getKC(ZALCANO_ID);
		const kcLearned = Math.min(100, calcWhatPercent(kc, 100));

		const boosts = [];
		let baseTime = Time.Minute * 6;
		baseTime = reduceNumByPercent(baseTime, kcLearned / 6);
		boosts.push(`${(kcLearned / 6).toFixed(2)}% boost for experience`);

		const skillPercentage =
			msg.author.skillLevel(SkillsEnum.Mining) + msg.author.skillLevel(SkillsEnum.Smithing);

		baseTime = reduceNumByPercent(baseTime, skillPercentage / 40);
		boosts.push(`${skillPercentage / 40}% boost for levels`);

		if (!msg.author.hasGracefulEquipped()) {
			baseTime *= 1.15;
			boosts.push(`-15% time penalty for not having graceful equipped`);
		}

		let healAmountNeeded = 7 * 12;
		if (kc > 100) healAmountNeeded = 1 * 12;
		else if (kc > 50) healAmountNeeded = 3 * 12;
		else if (kc > 20) healAmountNeeded = 5 * 12;

		const quantity = 32;//Math.floor(msg.author.maxTripLength(Activity.Zalcano) / baseTime);
		const duration = quantity * baseTime * xpBoost;

		const [food] = await removeFoodFromUser({
			client: this.client,
			user: msg.author,
			totalHealingNeeded: healAmountNeeded * quantity,
			healPerAction: Math.ceil(healAmountNeeded / quantity),
			activityName: 'Zalcano',
			attackStylesUsed: []
		});

		await addSubTaskToActivityTask<ZalcanoActivityTaskOptions>(this.client, {
			userID: msg.author.id,
			channelID: msg.channel.id,
			quantity,
			duration,
			type: Activity.Zalcano,
			performance: this.calcPerformance(kcLearned, skillPercentage),
			isMVP: percentChance(80)
		});

		return msg.send(
			`${
				msg.author.minionName
			} is now off to kill Zalcano ${quantity}x times, their trip will take ${formatDuration(
				duration
			)}. (${formatDuration(
				baseTime
			)} per kill). Removed ${food}.\n\n**Boosts:** ${boosts.join(', ')}.`
		);
	}
}
