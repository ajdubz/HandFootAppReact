import React, { useCallback, useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Form } from "react-bootstrap";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import Button from "react-bootstrap/Button";
import { isApiErrorCode } from "../services/apiClient";
import { isFirebaseBackend } from "../services/apiConfig";
import { getPlayerPublicId } from "./playerPublicId";
import "./playerAccount.css";

interface RouteParams {
    [id: string]: string | undefined;
}

interface PlayerAccountProps {
    isRegistration?: boolean;
}

const isDuplicateAccountError = (error: unknown) => (
    isApiErrorCode(error, "duplicate_player") ||
    (error instanceof Error && error.message.toLowerCase().includes("already exists"))
);

function PlayerAccount({ isRegistration = false }: PlayerAccountProps): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const location = useLocation();
    const isRegistrationPage = isRegistration || new URLSearchParams(location.search).get("registration") === "true";
    const [player, setPlayer] = useState<PlayerAccountDTO | undefined>();
    const [nickname, setNickname] = useState<string>(player?.nickName ?? "");
    const [fullName, setFullName] = useState<string>(player?.fullName ?? "");
    const [email, setEmail] = useState<string>(player?.email ?? "");
    const [password, setPassword] = useState<string>(player?.password ?? "");
    const [confirmPassword, setConfirmPassword] = useState<string>(player?.password ?? "");
    const navigate = useNavigate();
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showModalSave, setShowModalSave] = useState(false);
    const [copyStatus, setCopyStatus] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const publicPlayerId = id ? getPlayerPublicId(nickname, Number(id), player?.publicTag) : "";

    const fetchData = useCallback(async () => {
        if (!id) return;

        await PlayerService.getPlayerAccountById(Number(id))
            .then((response) => {
                // setPlayer(response);
                setPlayer(response);
                setEmail(response?.email ?? "");
                setNickname(response?.nickName ?? "");
                setFullName(response?.fullName ?? "");
                setPassword(response?.password ?? "");
                setConfirmPassword(response?.password ?? "");
            })
            .catch((error) => {
                console.log(error);
            });
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePlayer = async () => {
        const playerData: PlayerAccountDTO = {
            nickName: nickname,
            email: email,
            password: password,
            fullName: fullName,
        };

        await PlayerService.createPlayer(playerData)
            .then(() => { navigate(isRegistrationPage ? "/login" : "/playersList"); })
            .catch((error: unknown) => {
                if (isDuplicateAccountError(error)) {
                    setErrors({ accountExists: "Account already exists. Please use a different email." });
                    return;
                }
                console.log(error);
            });
    };

    const deletePlayer = async () => {
        await PlayerService.deletePlayer(Number(id))
            .then(() => { navigate("/playersList"); })
            .catch((error) => { console.log(error); });
    };

    const handleUpdatePlayer = async () => {
        const playerData: PlayerAccountDTO = {
            nickName: nickname,
            email: email,
            password: password,
            fullName: fullName,
        };

        await PlayerService.updatePlayerAccount(Number(id), playerData)
            .then(() => { navigate(`/player/${id}`); })
            .catch((error: unknown) => {
                if (isDuplicateAccountError(error)) {
                    setErrors({ accountExists: "Account already exists. Please use a different email." });
                    return;
                }
                console.log(error);
            });
    }

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!nickname || nickname.trim() === "") {
            newErrors.nickname = "Nickname is required";
        }

        if (!fullName || fullName.trim() === "") {
            newErrors.fullName = "Full Name is required";
        }

        if (!email || email.trim() === "") {
            newErrors.email = "Email is required";
        }

        if (!id) {
            if (!password.trim()) {
                newErrors.password = "Password is required";
            } else if (password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }

            if (password !== confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }

        return newErrors;
    };

    const checkDuplicateUser = async (): Promise<string | undefined> => {
        const allPlayers = await PlayerService.getPlayers();
        const normalizedEmail = email.trim().toLowerCase();
        const currentId = id ? Number(id) : undefined;
        const playerAccounts = await Promise.all(
            (allPlayers ?? []).map((existingPlayer) => PlayerService.getPlayerAccountById(existingPlayer.id ?? 0))
        );

        const duplicate = playerAccounts.find((existingPlayer) => {
            if (!existingPlayer) {
                return false;
            }
            if (currentId && existingPlayer.id === currentId) {
                return false;
            }

            const sameEmail = (existingPlayer.email ?? "").trim().toLowerCase() === normalizedEmail;
            return sameEmail;
        });

        if (!duplicate) {
            return undefined;
        }

        return "Account already exists. Please use a different email.";
    };

    const onSubmitFunc = async () => {
        // e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        try {
            if (!(isRegistrationPage && isFirebaseBackend() && !id)) {
                const duplicateError = await checkDuplicateUser();
                if (duplicateError) {
                    setErrors({ accountExists: duplicateError });
                    return;
                }
            }
        } catch (error) {
            // If fetching existing users fails (for example unauthenticated register mode),
            // server/mock create/update checks still enforce uniqueness.
            console.log(error);
        }

        if (id) {
            // console.log("Update player");
            await handleUpdatePlayer();
        } else {
            await handleCreatePlayer();
            // console.log("Create player");
        }
    };

    const returnToDetails = () => {
        if (id) navigate(`/player/${id}`);
        else navigate(isRegistrationPage ? "/" : "/playersList");
    };

    function handleModalConfirm(): void {
        if (showModalSave) {
            setShowModalSave(false);
            onSubmitFunc();
        } else {
            setShowModalDelete(false);
            deletePlayer();
        }
    }

    const copyPublicPlayerId = async () => {
        try {
            await navigator.clipboard.writeText(publicPlayerId);
            setCopyStatus("Copied.");
        } catch (error) {
            console.error("Unable to copy public player ID:", error);
            setCopyStatus("Unable to copy. Select the ID and copy it manually.");
        }
    };

    return (
        <main className="player-account-page">
            <header className="player-account-header">
                <p className="player-account-eyebrow">Your profile</p>
                <h1>Player Account Details</h1>
                <p>Update the information tied to your Hand &amp; Foot profile.</p>
            </header>
            {id && (
                <section className="account-public-id" aria-label="Public Player ID">
                    <div className="account-public-id-label">Public Player ID</div>
                    <div className="account-public-id-row">
                        <code>{publicPlayerId}</code>
                        <Button type="button" variant="outline-light" size="sm" onClick={copyPublicPlayerId}>
                            Copy
                        </Button>
                    </div>
                    <div className="account-public-id-help">Share this ID so other players can find the right account.</div>
                    <div className="account-public-id-status" aria-live="polite">{copyStatus}</div>
                </section>
            )}
            <Form className="player-account-form" onSubmit={(e) => e.preventDefault()}>
                <div className="player-account-form-grid">
                        <Form.Group className="player-account-field">
                            <Form.Label htmlFor="nickname">Nickname</Form.Label>
                            <Form.Control type="text" id="nickname" name="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                            {errors.nickname && <div className="text-danger">{errors.nickname}</div>}
                        </Form.Group>
                        <Form.Group className="player-account-field">
                            <Form.Label htmlFor="fullName">Full Name</Form.Label>
                            <Form.Control type="text" id="fullName" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            {errors.fullName && <div className="text-danger">{errors.fullName}</div>}
                        </Form.Group>
                        <Form.Group className="player-account-field is-wide">
                            <Form.Label htmlFor="email">Email</Form.Label>
                            <Form.Control type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            {errors.email && <div className="text-danger">{errors.email}</div>}
                        </Form.Group>
                        <Form.Group className="player-account-field">
                            <Form.Label htmlFor="password">Password</Form.Label>
                            <Form.Control type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            {errors.password && <div className="text-danger">{errors.password}</div>}
                        </Form.Group>
                        <Form.Group className="player-account-field">
                            <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
                            <Form.Control type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            {errors.confirmPassword && <div className="text-danger">{errors.confirmPassword}</div>}
                        </Form.Group>
                </div>
                {errors.accountExists && <div className="text-danger mt-2">{errors.accountExists}</div>}
                <div className="player-account-actions">
                    <Button type="submit" variant="primary" onClick={() => setShowModalSave(true)}>
                        Save Changes
                    </Button>
                    <Button type="button" variant="outline-secondary" onClick={returnToDetails}>
                        Cancel
                    </Button>
                    {!isRegistrationPage && id && (
                        <Button type="button" variant="outline-danger" onClick={() => setShowModalDelete(true)}>
                            Delete Account
                        </Button>
                    )}
                </div>
            </Form>
            <ConfirmChanges
                isOpen={showModalSave || showModalDelete}
                onConfirm={handleModalConfirm}
                onCancel={() => (showModalDelete ? setShowModalDelete(false) : setShowModalSave(false))}
            />
        </main>
    );
}

export default PlayerAccount;
