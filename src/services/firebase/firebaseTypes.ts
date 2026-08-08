import Rules from "../../models/Rules";

export interface FirebasePlayerDocument {
    id: number;
    uid?: string;
    ownerUid: string;
    nickName?: string;
    fullName?: string;
    email?: string;
    isGuest?: boolean;
}

export interface FirebasePlayerDirectoryDocument {
    id: number;
    ownerUid: string;
    nickName: string;
    nickNameNormalized: string;
    publicTag: string;
    publicTagNormalized: string;
}

export interface FirebaseTeamDocument {
    id: number;
    ownerUid: string;
    name?: string;
    memberPlayerIds: number[];
}

export interface FirebaseGameDocument {
    id: number;
    ownerUid: string;
    ownerPlayerId?: number;
    participantUids?: string[];
    accessProvisionedUids?: string[];
    date?: string;
    rules?: Partial<Rules>;
    teamIds: number[];
    memberPlayerIds: number[];
}

export interface FirebaseGameAccessDocument {
    gameId: number;
    ownerUid: string;
    participantUid: string;
}

export interface FirebaseGameTeamDocument {
    id: number;
    ownerUid: string;
    gameId: number;
    teamId: number;
    teamName?: string;
    memberPlayerIds: number[];
}

export interface FirebaseGameRoundDocument {
    id: number;
    ownerUid: string;
    gameId: number;
    gameTeamId: number;
    roundNumber?: number;
    cardPoints?: number;
    handScore?: number;
    cleanBooks?: number;
    dirtyBooks?: number;
    redThrees?: number;
    pulledCorrect?: number;
    isWinner?: boolean;
}

export interface FirebaseFriendDocument {
    id: number;
    ownerUid: string;
    playerId: number;
    friendId: number;
    recipientUid?: string;
    participantUids?: string[];
    participantUid1?: string;
    participantUid2?: string;
}
