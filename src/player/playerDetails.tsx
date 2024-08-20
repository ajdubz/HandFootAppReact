import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicsDTO";
import PlayerGetWithFriendsDTO from "../models/DTOs/Player/PlayerGetWithFriendsDTO";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import PlayerUpdateDTO from "../models/DTOs/Player/PlayerUpdateDTO";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerDetails() {
    const { id = "" } = useParams<RouteParams>();
    const [player, setPlayer] = useState<PlayerGetWithFriendsDTO>();
    const [teams, setTeams] = useState<TeamGetBasicDTO[]>([]);
    const [nickname, setNickname] = useState<string>(player?.nickName || '');
    const [email, setEmail] = useState<string>(player?.email || '');
    const [selectedTeam, setSelectedTeam] = useState<number>(player?.team?.id || 0);

    useEffect(() => {
        const fetchData = async () => {
            const players = await PlayerService.getPlayerById(Number(id));
            const teams = await TeamService.getTeams();
            setPlayer(players);
            setTeams(teams);

            setEmail(players?.email || '');
            setNickname(players?.nickName || '');
            setSelectedTeam(players?.team?.id || 0);
        };
        
        fetchData();
        
    }, [id]);

    const onSubmitFunc = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form values
        if (!nickname?.trim()) {
            alert('Nickname is required');
            return;
        }

        if (selectedTeam === 0) {
            alert('Please select a team');
            return;
        }

        if (!email?.trim()) {
            alert('Email is required');
            return;
        }

        // Push to backend
        const playerData: PlayerUpdateDTO = {
            id: Number(id),
            nickName: nickname,
            email: email,
            teamId: Number(selectedTeam),
        };

        console.log('Submitting:', playerData);

        PlayerService.updatePlayer(playerData);
    };

    const onCancelFunc = () => {
        console.log('Cancel');
        window.history.back();
    };

    return (
        <div>
            <h2>Player Details</h2>
            <form onSubmit={onSubmitFunc}>
                <label>
                    Nickname:
                    <input type="text" name="nickname" defaultValue={nickname} onChange={(e) => setNickname(e.target.value)} />
                </label>
                <br />
                <label>
                    Email:
                    <input type="email" name="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                <label>
                    Team:
                    {player?.team && teams && (
                        <select defaultValue={player?.team?.id} name="teamSelect" onChange={(e) => setSelectedTeam(Number(e.target.value))}>
                            <option value="0">Select a team</option>
                            {teams.map((team: TeamGetBasicDTO) => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    )}
                </label>
                <br />
                <br />
                <label>
                    Friends:
                    {player?.friends && ListFriends(player.friends)}
                </label>
                <br />
                <button type="submit">Save</button>
                <button type="button" onClick={onCancelFunc}>
                    Cancel
                </button>
            </form>
        </div>
    );
}

function ListFriends(friends: PlayerGetBasicDTO[]) {
    return (
        <span>
            {friends.map((friend) => (
                <span key={friend.id}> {friend.nickName}</span>
            ))}
        </span>
    );
}

export default PlayerDetails;








// function PlayerDetails() {
//     const { id = 0 } = useParams<RouteParams>();
//     const [player, setPlayer] = useState<PlayerGetWithFriendsDTO>();
//     const [teams, setTeams] = useState<TeamGetBasicDTO[]>([]);

//     let selectedTeam = 0;


//     useEffect(() => {
//         const fetchData = async () => {
//             const players = await PlayerService.getPlayerById(Number(id));
//             const teams = await TeamService.getTeams();
//             setPlayer(players);
//             setTeams(teams);
//         };
        
//         fetchData();
//     }, [id]);

//     selectedTeam = player?.team?.id || 0;


//     return (
//         <div>
//             <h1>Player Details</h1>

//             <form>
//                 <label>
//                     Nickname:
//                     <input type="text" name="nickname" defaultValue={player?.nickName} />
//                 </label>
//                 <br />
//                 <label>
//                     Team:
//                     {player?.team && teams && TeamSelect(teams, selectedTeam)}
//                 </label>
//                 <br />
//                 <br />
//                 <label>
//                     Friends: 
//                     {player?.friends && ListFriends(player.friends)}
//                 </label>
//                 <br />
//                 <DetailSave></DetailSave>
//                 <DetailCancel></DetailCancel>
//             </form>
//         </div>
//     );
// }

// function ListFriends(friends: PlayerGetBasicDTO[]) {
//     return (
//         <span>
//             {friends.map((friend) => {
//                 return <span key={friend.id}> {friend.nickName}</span>;
//             })}
//         </span>
//     );
// }

// function TeamSelect(teams: TeamGetBasicDTO[], defaultId: number) {
//     return (
//         <select defaultValue={defaultId} name="teamSelect" onChange={(e) => console.log('made select')}>
//             <option value="0">Select a team</option>
//             {teams.map((team) => {
//                 return <option key={team.id} value={team.id}>{team.name}</option>;
//             })}
//         </select>
//     );
// }

// function DetailSave() {
//     return (
//         <button type="button" onClick={onSubmitFunc}>Save</button>
//     );
// }

// const onSubmitFunc = (e: any) => {

//     console.log(e.target.value);
//     e.preventDefault();
// };

// function DetailCancel() {
//     return (
//         <button type="button" onClick={onCancelFunc}>Cancel</button>
//     );
// }

// function onCancelFunc() {
//     console.log('Cancel');
//     window.history.back();
// }

// export default PlayerDetails;
