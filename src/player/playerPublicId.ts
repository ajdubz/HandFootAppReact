import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";

const PUBLIC_TAG_SALT = 0x6d2b79f5;
const PUBLIC_TAG_MULTIPLIER = 0x9e3779b1;
const PUBLIC_TAG_LENGTH = 7;

export const normalizePlayerSearchText = (value?: string): string => (value ?? "").trim().toLowerCase();

export const getPlayerPublicTag = (playerId?: number, existingTag?: string): string => {
    const normalizedExistingTag = (existingTag ?? "").trim().replace(/^#/, "").toUpperCase();
    if (normalizedExistingTag) {
        return normalizedExistingTag;
    }

    const numericId = Number(playerId ?? 0);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        return "";
    }

    const mixedId = Math.imul((numericId >>> 0) ^ PUBLIC_TAG_SALT, PUBLIC_TAG_MULTIPLIER) >>> 0;
    return mixedId.toString(36).toUpperCase().padStart(PUBLIC_TAG_LENGTH, "0").slice(-PUBLIC_TAG_LENGTH);
};

export const getPlayerPublicId = (
    nickName?: string,
    playerId?: number,
    existingTag?: string,
): string => {
    const displayName = (nickName ?? "").trim() || "Unnamed player";
    const publicTag = getPlayerPublicTag(playerId, existingTag);
    return publicTag ? `${displayName}#${publicTag}` : displayName;
};

export const matchesPlayerPublicSearch = (player: PlayerGetBasicDTO, search: string): boolean => {
    const normalizedSearch = normalizePlayerSearchText(search);
    const normalizedNickName = normalizePlayerSearchText(player.nickName);
    const normalizedTag = normalizePlayerSearchText(getPlayerPublicTag(player.id, player.publicTag));

    if (normalizedSearch.startsWith("#")) {
        return normalizedTag.startsWith(normalizedSearch.slice(1));
    }

    return normalizedNickName.startsWith(normalizedSearch);
};
