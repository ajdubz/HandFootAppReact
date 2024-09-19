import { Button, Table } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import "./gameHome.css";
import { useEffect, useState } from "react";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import GameService from "../services/GameService";
import PlayerTeamDTO from "../models/DTOs/Team/PlayerTeamDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";


interface RouteParams {
    [id: string]: string | undefined;
}

function GamePage() {
    const { id = "" } = useParams<RouteParams>();
    const { gameId = "" } = useParams<RouteParams>();
    const [game, setGame] = useState<GameWithRulesDTO>();
    const [teams, setTeams] = useState<PlayerTeamDTO[]>();
    const [rounds, setRounds] = useState<GameRoundDTO[]>();

    const navigate = useNavigate();

    const fetchData = async () => {
        await GameService.getGameById(Number(gameId))
            .then((data) => {
                setGame(data);
                // alert(`Game ${gameId} fetched`);
            })
            .catch((error) => {
                console.error("Error in getGameById:", error);
                setGame(new GameWithRulesDTO());
            });

        await GameService.getTeamsByGameId(Number(gameId))
            .then((data) => {
                console.log(data);
                setTeams(data);
            })
            .catch((error) => {
                console.error("Error in getTeamsByGameId:", error);
                setTeams([]);
            });

        // await GameService.getRoundsByGameId(Number(gameId))
        //     .then((data) => {
        //         console.log(data);
        //         setRounds(data);
        //     })
        //     .catch((error) => {
        //         console.error("Error in getRoundsByGameId:", error);
        //         setRounds([]);
        //     });
    };

    useEffect(() => {
        fetchData();
    }, [gameId]);


    const handleBack = () => {
        // alert(`Back to player ${id} from game ${gameId}`);
        navigate(`/player/${id}`);
    }



    return (
        <div>
            <h1>Game Home</h1>
            <div>
                <Table bordered id="gameTable">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Team Name</th>
                            <th>Total Score</th>
                            <th>Clean Books</th>
                            <th>Dirty Books</th>
                            <th>Red 3's</th>
                            <th>Round 1 Winner</th>
                            <th>Round 2 Winner</th>
                            <th>Round 3 Winner</th>
                            <th>Round 4 Winner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tempData.map((data) => (
                            <tr key={data.rank}>
                                <td>{data.rank}</td>
                                <td>{data.teamName}</td>
                                <td>{data.totalScore}</td>
                                <td>{data.cleanBooks}</td>
                                <td>{data.dirtyBooks}</td>
                                <td>{data.red3s}</td>
                                <td>{data.round1Winner}</td>
                                <td>{data.round2Winner}</td>
                                <td>{data.round3Winner}</td>
                                <td>{data.round4Winner}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
            <Button variant="primary" onClick={handleBack}>Back</Button>
        </div>
    );
}

const tempData = [
    {
        rank: 1,
        teamName: "Game 1",
        totalScore: 100,
        cleanBooks: 12,
        dirtyBooks: 16,
        red3s: 1,
        round1Winner: "X",
        round2Winner: "",
        round3Winner: "",
        round4Winner: "X"
    },
    {
        rank: 2,
        teamName: "Game 2",
        totalScore: 200,
        cleanBooks: 22,
        dirtyBooks: 26,
        red3s: 2,
        round1Winner: "",
        round2Winner: "X",
        round3Winner: "",
        round4Winner: ""
    },
    {
        rank: 3,
        teamName: "Game 3",
        totalScore: 300,
        cleanBooks: 32,
        dirtyBooks: 36,
        red3s: 3,
        round1Winner: "",
        round2Winner: "",
        round3Winner: "X",
        round4Winner: ""
    }
];

export default GamePage;