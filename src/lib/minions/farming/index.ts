import { UserSettings } from '../../settings/types/UserSettings';
import * as PatchTypes from './types';

export { PatchTypes };

export const defaultPatches: PatchTypes.IPatchData = {
	lastPlanted: null,
	patchPlanted: false,
	plantTime: 0,
	lastQuantity: 0,
	lastUpgradeType: null,
	lastPayment: false
};

export const defaultFarmingContract: PatchTypes.FarmingContract = {
	hasContract: false,
	difficultyLevel: null,
	plantToGrow: null,
	plantTier: 0,
	contractsCompleted: 0
};

export function resolvePatchTypeSetting(type: string) {
	switch (type) {
		case PatchTypes.FarmingPatchTypes.Herb:
			return UserSettings.FarmingPatches.Herb;
		case PatchTypes.FarmingPatchTypes.FruitTree:
			return UserSettings.FarmingPatches.FruitTree;
		case PatchTypes.FarmingPatchTypes.Tree:
			return UserSettings.FarmingPatches.Tree;
		case PatchTypes.FarmingPatchTypes.Allotment:
			return UserSettings.FarmingPatches.Allotment;
		case PatchTypes.FarmingPatchTypes.Hops:
			return UserSettings.FarmingPatches.Hops;
		case PatchTypes.FarmingPatchTypes.Cactus:
			return UserSettings.FarmingPatches.Cactus;
		case PatchTypes.FarmingPatchTypes.Bush:
			return UserSettings.FarmingPatches.Bush;
		case PatchTypes.FarmingPatchTypes.Spirit:
			return UserSettings.FarmingPatches.Spirit;
		case PatchTypes.FarmingPatchTypes.Hardwood:
			return UserSettings.FarmingPatches.Hardwood;
		case PatchTypes.FarmingPatchTypes.Seaweed:
			return UserSettings.FarmingPatches.Seaweed;
		case PatchTypes.FarmingPatchTypes.Vine:
			return UserSettings.FarmingPatches.Vine;
		case PatchTypes.FarmingPatchTypes.Calquat:
			return UserSettings.FarmingPatches.Calquat;
		case PatchTypes.FarmingPatchTypes.Redwood:
			return UserSettings.FarmingPatches.Redwood;
		case PatchTypes.FarmingPatchTypes.Crystal:
			return UserSettings.FarmingPatches.Crystal;
		case PatchTypes.FarmingPatchTypes.Celastrus:
			return UserSettings.FarmingPatches.Celastrus;
		case PatchTypes.FarmingPatchTypes.Hespori:
			return UserSettings.FarmingPatches.Hespori;
		case PatchTypes.FarmingPatchTypes.Flower:
			return UserSettings.FarmingPatches.Flower;
		case PatchTypes.FarmingPatchTypes.Mushroom:
			return UserSettings.FarmingPatches.Mushroom;
		case PatchTypes.FarmingPatchTypes.Belladonna:
			return UserSettings.FarmingPatches.Belladonna;
	}
}
