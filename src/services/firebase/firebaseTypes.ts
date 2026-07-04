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
    date?: string;
    rules?: Partial<Rules>;
    teamIds: number[];
    memberPlayerIds: number[];
}

export interface FirebaseGameTeamDocument {
    id: number;
    ownerUid: string;
    gameId: number;
    teamId: number;
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
