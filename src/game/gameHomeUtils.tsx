import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import GameService from "../services/GameService";
import TeamService from "../services/TeamService";


export const calcCleans = async (gameTeam: GameTeamDTO): Promise<number | undefined> => {
    let cleans = 0;

    return await TeamService.getRoundsByTeamId(gameTeam.id ?? 0)
        .then((data) => {
            console.log(`getRoundsByTeamId: `);
            console.log(data);
            data?.forEach((round) => {
                cleans += round?.cleanBooks ?? 0;
            });
            return cleans;
        }
        )
        .catch((error) => {
            console.error("Error in getRoundsByTeamId:", error);
            return 0;
        });
}

export const calcDirties = async (gameTeam: GameTeamDTO): Promise<number | undefined> => {
    let dirties = 0;

    await TeamService.getRoundsByTeamId(gameTeam.id ?? 0)
        .then((data) => {
            console.log(`getRoundsByTeamId: `);
            console.log(data);
            data?.forEach((round) => {
                dirties += round?.dirtyBooks ?? 0;
            });
            return data;
        }
        )
        .catch((error) => {
            console.error("Error in getRoundsByTeamId:", error);
            return [];
        });

    return dirties;
}

export const calcRed3s = async (gameTeam: GameTeamDTO): Promise<number | undefined> => {
    let red3s = 0;

    await TeamService.getRoundsByTeamId(gameTeam.id ?? 0)
        .then((data) => {
            console.log(`getRoundsByTeamId: `);
            console.log(data);
            data?.forEach((round) => {
                red3s += round?.redThrees ?? 0;
            });
            return data;
        }
        )
        .catch((error) => {
            console.error("Error in getRoundsByTeamId:", error);
            return [];
        });

    return red3s;
}

export const calcScore = async (gameTeam: GameTeamDTO): Promise<number | undefined> => {
    let score = 0;

    await TeamService.getRoundsByTeamId(gameTeam.id ?? 0)
        .then((data) => {
            console.log(`getRoundsByTeamId: `);
            console.log(data);
            data?.forEach((round) => {
                score += round?.handScore ?? 0;
            });
            return data;
        }
        )
        .catch((error) => {
            console.error("Error in getRoundsByTeamId:", error);
            return [];
        });

    return score;
}