import { CommandStore, KlasaMessage } from 'klasa';
import { Bank } from 'oldschooljs';

import { Activity, Time, xpBoost } from '../../lib/constants';
//import { hasGracefulEquipped } from '../../lib/gear/functions/hasGracefulEquipped';
import { minionNotBusy, requiresMinion } from '../../lib/minions/decorators';
import defaultPatches from '../../lib/minions/farming/defaultPatches';
import resolvePatchTypeSetting from '../../lib/minions/farming/functions/resolvePatchTypeSettings';
import { ClientSettings } from '../../lib/settings/types/ClientSettings';
import { UserSettings } from '../../lib/settings/types/UserSettings';
import { calcNumOfPatches, returnListOfPlants } from '../../lib/skilling/functions/calcsFarming';
import Farming from '../../lib/skilling/skills/farming';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import { FarmingActivityTaskOptions } from '../../lib/types/minions';
import {
	bankHasItem,
	formatDuration,
	itemNameFromID,
	removeItemFromBank,
	stringMatches
} from '../../lib/util';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';
import itemID from '../../lib/util/itemID';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			altProtection: true,
			oneAtTime: true,
			cooldown: 1,
			usage: '[quantity:int{1}|name:...string] [plantName:...string]',
			aliases: ['plant'],
			usageDelim: ' ',
			description: `Allows a player to plant or harvest and replant seeds for farming.`,
			examples: ['+plant ranarr seed', '+farm oak tree'],
			categoryFlags: ['minion']
		});
	}

	@minionNotBusy
	@requiresMinion
	async run(msg: KlasaMessage, [quantity, plantName = '']: [null | number | string, string]) {
		if (msg.flagArgs.plants) {
			return returnListOfPlants(msg);
		}

		await msg.author.settings.sync(true);
		const userBank = msg.author.settings.get(UserSettings.Bank);
		const questPoints = msg.author.settings.get(UserSettings.QP);
		const GP = msg.author.settings.get(UserSettings.GP);
		const currentWoodcuttingLevel = msg.author.skillLevel(SkillsEnum.Woodcutting);
		const currentDate = new Date().getTime();

		let payment = false;
		let upgradeType: 'compost' | 'supercompost' | 'ultracompost' | null = null;
		const infoStr: string[] = [];
		const boostStr: string[] = [];

		if (typeof quantity === 'string') {
			plantName = quantity;
			quantity = null;
		}

		const plants = Farming.Plants.find(plants =>
			plants.aliases.some(
				alias =>
					stringMatches(alias, plantName) || stringMatches(alias.split(' ')[0], plantName)
			)
		);

		if (!plants) {
			throw `That's not a valid seed to plant. Valid seeds are ${Farming.Plants.map(
				plants => plants.name
			).join(', ')}. *Make sure you are not attempting to farm 0 crops.*`;
		}

		if (msg.author.skillLevel(SkillsEnum.Farming) < plants.level) {
			throw `${msg.author.minionName} needs ${plants.level} Farming to plant ${plants.name}.`;
		}

		const getPatchType = resolvePatchTypeSetting(plants.seedType);
		if (!getPatchType) return;
		const patchType = msg.author.settings.get(getPatchType) ?? defaultPatches;

		const timePerPatchTravel = Time.Second * plants.timePerPatchTravel;
		const timePerPatchHarvest = Time.Second * plants.timePerHarvest;
		const timePerPatchPlant = Time.Second * 5;

		const storeHarvestablePlant = patchType.lastPlanted;
		const planted = storeHarvestablePlant
			? Farming.Plants.find(
					plants =>
						stringMatches(plants.name, storeHarvestablePlant) ||
						stringMatches(plants.name.split(' ')[0], storeHarvestablePlant)
			  )
			: null;

		const lastPlantTime: number = patchType.plantTime;
		const difference = currentDate - lastPlantTime;
		/* Initiate a cooldown feature for each of the seed types.
			Allows for a run of specific seed type to only be possible until the
			previous run's plants have been fully grown.*/
		if (planted && difference < planted.growthTime * Time.Minute) {
			throw `Please come back when your crops have finished growing in ${formatDuration(
				lastPlantTime + planted.growthTime * Time.Minute - currentDate
			)}!`;
		}

		const storeHarvestableQuantity = patchType.lastQuantity;

		if (
			planted &&
			planted.needsChopForHarvest &&
			planted.treeWoodcuttingLevel &&
			currentWoodcuttingLevel < planted.treeWoodcuttingLevel
		) {
			const gpToCutTree =
				planted.seedType === 'redwood'
					? 2000 * storeHarvestableQuantity
					: 200 * storeHarvestableQuantity;
			if (GP < gpToCutTree) {
				throw `${msg.author.minionName} remembers that they do not have ${planted.treeWoodcuttingLevel} woodcutting or the ${gpToCutTree} GP required to be able to harvest the currently planted trees, and so they cancel their trip.`;
			}
		}

		if (msg.flagArgs.supercompost || msg.flagArgs.sc) {
			upgradeType = 'supercompost';
			infoStr.push(`You are treating all of your patches with supercompost.`);
		} else if (msg.flagArgs.ultracompost || msg.flagArgs.uc) {
			upgradeType = 'ultracompost';
			infoStr.push(`You are treating all of your patches with ultracompost.`);
		}

		if (
			msg.flagArgs.pay ||
			(msg.author.settings.get(UserSettings.Minion.DefaultPay) && plants.canPayFarmer)
		) {
			payment = true;
		}

		if (!plants.canPayFarmer && payment) {
			throw `You cannot pay a farmer to look after your ${plants.name}s!`;
		}
		if (
			!plants.canCompostandPay &&
			payment &&
			(upgradeType === 'supercompost' || upgradeType === 'ultracompost')
		) {
			throw `You do not need to use compost if you are paying a nearby farmer to look over your crops.`;
		}

		if (!plants.canCompostPatch && upgradeType !== null) {
			throw `There would be no point to add compost to your ${plants.name}s!`;
		}

		if (!plants.canPayFarmer && payment) {
			throw `You cannot pay a farmer to look after your ${plants.name}s!`;
		}

		const numOfPatches = calcNumOfPatches(plants, msg.author, questPoints);

		if (numOfPatches === 0) {
			throw 'There are no available patches to you. Check requirements for additional patches by with the command `+farm --plants`';
		}

		const maxTripLength = 200984200 

		// If no quantity provided, set it to the max PATCHES available.
		if (quantity === null) {
			quantity = Math.min(
				Math.floor(
					maxTripLength / (timePerPatchTravel + timePerPatchPlant + timePerPatchHarvest)
				),
				numOfPatches
			);
		}

		if (quantity > numOfPatches) {
			throw `There are not enough ${plants.seedType} patches to plant that many. The max amount of patches to plant in is ${numOfPatches}.`;
		}

		let duration: number = 0;
		if (patchType.patchPlanted) {
			duration =
				patchType.lastQuantity * xpBoost *
				(timePerPatchTravel + timePerPatchPlant + timePerPatchHarvest);
			if (quantity > patchType.lastQuantity) {
				duration +=
					(quantity - patchType.lastQuantity) * (timePerPatchTravel + timePerPatchPlant);
			}
		} else {
			duration = quantity * (timePerPatchTravel + timePerPatchPlant) * xpBoost;
		}

		// Reduce time if user has graceful equipped
		if (msg.author.hasGracefulEquipped()) {
			boostStr.push('10% time for Graceful');
			duration *= 0.9;
		}

		if (msg.author.hasItemEquippedAnywhere(itemID(`Ring of endurance`))) {
			boostStr.push('10% time for Ring of Endurance');
			duration *= 0.9;
		}

		duration = 1

		if (duration > maxTripLength) {
			throw `${msg.author.minionName} can't go on trips longer than ${formatDuration(
				maxTripLength
			)}, try a lower quantity. The highest amount of ${plants.name} you can plant is ${
				(Math.floor(
					maxTripLength / (timePerPatchTravel + timePerPatchPlant + timePerPatchHarvest)
				),
				numOfPatches)
			}.`;
		}

		let newBank = { ...userBank };
		let econBank = new Bank();
		const requiredSeeds: [string, number][] = Object.entries(plants.inputItems);
		for (const [seedID, qty] of requiredSeeds) {
			if (!bankHasItem(userBank, parseInt(seedID), qty * quantity)) {
				if (msg.author.numItemsInBankSync(parseInt(seedID)) > qty) {
					quantity = Math.floor(msg.author.numItemsInBankSync(parseInt(seedID)) / qty);
				} else {
					throw `You don't have enough ${itemNameFromID(parseInt(seedID))}s.`;
				}
			}
			newBank = removeItemFromBank(newBank, parseInt(seedID), qty * quantity);
			econBank.add(parseInt(seedID), qty * quantity);
		}

		let paymentBank = { ...newBank };
		let canPay = false;
		if (payment) {
			if (!plants.protectionPayment) return;
			const requiredPayment: [string, number][] = Object.entries(plants.protectionPayment);
			for (const [paymentID, qty] of requiredPayment) {
				if (!bankHasItem(userBank, parseInt(paymentID), qty * quantity)) {
					canPay = false;
					if (msg.flagArgs.pay) {
						return msg.send(
							`You don't have enough ${itemNameFromID(
								parseInt(paymentID)
							)} to make payments to nearby farmers.`
						);
					}
					break;
				}
				paymentBank = removeItemFromBank(paymentBank, parseInt(paymentID), qty * quantity);
				econBank.add(parseInt(paymentID), qty * quantity);
				canPay = true;
			}
		}

		if (canPay) {
			newBank = paymentBank;
			infoStr.push(`You are paying a nearby farmer to look after your patches.`);
		} else if (
			!canPay &&
			msg.author.settings.get(UserSettings.Minion.DefaultPay) &&
			plants.canPayFarmer
		) {
			infoStr.push(
				`You did not have enough payment to automatically pay for crop protection.`
			);
		}

		const defaultCompostTier = msg.author.settings.get(UserSettings.Minion.DefaultCompostToUse);
		if (upgradeType === 'supercompost' || upgradeType === 'ultracompost') {
			const hasCompostType = await msg.author.hasItem(itemID(upgradeType), quantity);
			if (!hasCompostType) {
				throw `You dont have ${quantity}x ${upgradeType}.`;
			}
		} else if (
			!(!plants.canCompostandPay && payment) ||
			(msg.author.settings.get(UserSettings.Minion.DefaultPay) && !canPay)
		) {
			if (
				bankHasItem(userBank, itemID(defaultCompostTier), quantity) &&
				plants.canCompostPatch
			) {
				upgradeType = defaultCompostTier;
				infoStr.push(`You are treating all of your patches with ${defaultCompostTier}.`);
			} else if (
				bankHasItem(userBank, itemID('compost'), quantity) &&
				plants.canCompostPatch
			) {
				upgradeType = 'compost';
				infoStr.push(`You are treating all of your patches with compost.`);
			}
		}

		if (upgradeType !== null) {
			econBank.add(itemID(upgradeType), quantity);
			newBank = removeItemFromBank(newBank, itemID(upgradeType), quantity);
		}

		await msg.author.settings.update(UserSettings.Bank, newBank);
		await this.client.settings.update(
			ClientSettings.EconomyStats.FarmingCostBank,
			new Bank(this.client.settings.get(ClientSettings.EconomyStats.FarmingCostBank)).add(
				econBank
			).bank
		);
		// If user does not have something already planted, just plant the new seeds.
		if (!patchType.patchPlanted) {
			infoStr.unshift(
				`${msg.author.minionName} is now planting ${quantity}x ${plants.name}.`
			);
		} else if (patchType.patchPlanted) {
			if (!planted)
				throw `This error shouldn't happen. Just to clear possible undefined error`;

			if (
				bankHasItem(userBank, itemID('Magic secateurs')) ||
				msg.author.hasItemEquippedAnywhere(itemID(`Magic secateurs`))
			) {
				boostStr.push('10% crop yield for Magic Secateurs');
			}

			if (
				bankHasItem(userBank, itemID('Farming cape')) ||
				bankHasItem(userBank, itemID('Farming cape(t)')) ||
				msg.author.hasItemEquippedAnywhere(itemID(`Farming cape`)) ||
				msg.author.hasItemEquippedAnywhere(itemID(`Farming cape(t)`))
			) {
				boostStr.push('5% crop yield for Farming Skillcape');
			}

			infoStr.unshift(
				`${msg.author.minionName} is now harvesting ${storeHarvestableQuantity}x ${storeHarvestablePlant}, and then planting ${quantity}x ${plants.name}.`
			);
		}

		await addSubTaskToActivityTask<FarmingActivityTaskOptions>(this.client, {
			plantsName: plants.name,
			patchType,
			getPatchType,
			userID: msg.author.id,
			channelID: msg.channel.id,
			quantity,
			upgradeType,
			payment,
			planting: true,
			duration,
			currentDate,
			type: Activity.Farming
		});

		return msg.send(
			`${infoStr.join(' ')}\n\nIt'll take around ${formatDuration(duration)} to finish.\n\n${
				boostStr.length > 0 ? `**Boosts**: ` : ``
			}${boostStr.join(', ')}`
		);
	}
}
