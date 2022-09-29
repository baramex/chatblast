import { Dialog, Transition, } from "@headlessui/react";
import { ArrowLeftIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { CameraIcon } from "@heroicons/react/24/solid";
import { Fragment, memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, resetSession, uploadAvatar, USERS_TYPE } from "../../lib/service/authentification";
import { fetchMemberMessagesCount } from "../../lib/service/message";
import { fetchBadges, fetchProfile } from "../../lib/service/profile";
import { formatDuration } from "../../lib/utils/date";
import Loading from "../Misc/Loading";
import Tooltip from "../Misc/Tooltip";

function ProfileViewer({ profileId: _profileId, integrationId, onClose, onlines, setError, avatar, setAvatar, show }) {
    const [profiles, setProfiles] = useState([]);
    const [profileId, setProfileId] = useState(_profileId);
    if (_profileId && (!profileId || profileId !== _profileId)) setProfileId(_profileId);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            if (new Date().getTime() - (profiles.find(a => a.profile.id === profileId)?.date || new Date().getTime()) <= 1000 * 60 && profileId) {
                const p = await getProfile(profileId);
                const messages = await getMemberMessagesCount(profileId);
                const badges = await getBadges(profileId);
                if (p === undefined || messages === undefined || badges === undefined) return;
                setProfiles(prev => [...prev, { profile: p, messages, badges, date: new Date().getTime() }]);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileId]);

    const profile = profileId ? profiles.find(a => a.profile.id === profileId) : undefined;
    const isMe = profileId ? profileId === sessionStorage.getItem("id") : undefined;
    const online = profileId ? onlines?.find(a => a.id === profileId) : undefined;

    return (<Transition.Root show={show} as={Fragment}>
        <Dialog as="div" className="fixed w-full h-full top-0 left-0 z-30" onClose={onClose}>
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="bg-neutral-800/50 fixed top-0 left-0 w-[100vw] h-[100vh] backdrop-blur-sm" />
            </Transition.Child>

            <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <Dialog.Panel className="text-neutral-800 flex min-w-sm max-w-lg max-h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col fixed h-3/4 w-4/5 lg:w-3/5">
                    <div className="rounded-t-3xl relative w-full h-[30%] bg-emerald-500">
                        <button className="border-0 bg-transparent m-4 outline-none" onClick={onClose}><ArrowLeftIcon className="stroke-white" width="35" /></button>
                        {profile &&
                            <div className="absolute left-1/2 bottom-0 mt-[50%] translate-y-1/2 -translate-x-1/2 text-center z-10">
                                <div className="rounded-full p-2 bg-emerald-600 w-[120px] h-[120px]">
                                    {
                                        (isMe && profile?.profile.type === USERS_TYPE.DEFAULT) ?
                                            <label htmlFor="avatar" className="block group relative overflow-hidden rounded-full cursor-pointer bg-emerald-100">
                                                <input type="file" accept=".png,.jpg,.jpeg" name="avatar" id="avatar" onInput={(e) => handleAvatar(e, setAvatar, setError)} hidden />
                                                <img src={isMe ? avatar : "/profile/" + profile?.profile.id + "/avatar"} className="object-cover w-full h-full" style={{ aspectRatio: "1/1" }} alt="avatar" />
                                                <div className="transition bg-neutral-900/30 absolute -translate-x-1/2 translate-y-full bottom-0 left-1/2 w-full py-1 pb-2 flex items-center justify-center group-hover:-translate-y-0">
                                                    <CameraIcon className="text-white/80" width="20" />
                                                </div>
                                            </label>
                                            : <img src={isMe ? avatar : "/profile/" + profile?.profile.id + "/avatar"} className="object-cover rounded-full w-full h-full" style={{ aspectRatio: "1/1" }} alt="avatar" />
                                    }
                                </div>
                                <div>
                                    <p className="text-2xl font-bold inline">{profile?.profile.username}</p>{/*(isMe && profile?.profile.type === USERS_TYPE.DEFAULT) ? <button className="ml-2 bg-transparent border-0 align-text-bottom"><PencilSquareIcon width="20" /></button> : null*/}
                                </div>
                            </div>
                        }
                    </div>
                    <div className="grow rounded-b-3xl w-full flex items-center relative bg-emerald-100">
                        {!profile ? <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Loading width="w-14" height="h-14" /></div> : <>
                            <div className="absolute top-0 right-0 m-2 flex gap-1">
                                {
                                    profile?.badges.map(a =>
                                        <Tooltip key={a.name} text={a.description}>
                                            <img src={a.src} alt={a.name} width="24" />
                                        </Tooltip>)
                                }
                            </div>
                            <div className="flex w-full text-center items-center px-2">
                                <div className="w-full">
                                    <p className="font-bold text-2xl m-0">{profile?.messages}</p>
                                    <p className="m-0 text-lg text-neutral-700">messages</p>
                                </div>
                                <div className="w-full">
                                    <p className={"font-bold text-2xl m-0 " + (online ? "text-green-600" : "text-red-600")}>{online ? "En ligne" : "Hors ligne"}</p>
                                </div>
                            </div>
                            {(isMe && profile?.profile.type === USERS_TYPE.DEFAULT) ?
                                <button onClick={e => handleLogout(e, integrationId, navigate)} className="transition-colors bg-red-600 text-white px-3 py-2 rounded-lg absolute left-1/2 -translate-x-1/2 bottom-0 mb-9 hover:bg-red-700 w-4/5 sm:w-auto"><ArrowLeftOnRectangleIcon width="20" className="align-text-bottom inline mr-1 stroke-white" /> Se déconnecter</button>
                                : null}
                            <p className="absolute bottom-0 text-center text-neutral-500 mb-1 w-full">Membre depuis {formatDuration(profile?.profile.date)}</p>
                        </>}
                    </div>
                </Dialog.Panel>
            </Transition.Child>
        </Dialog>
    </Transition.Root >);
}

export default memo(ProfileViewer);

async function getMemberMessagesCount(id) {
    try {
        return await fetchMemberMessagesCount(id);
    } catch (error) { };
}

async function getProfile(id) {
    try {
        return await fetchProfile(id);
    } catch (error) { };
}

async function handleLogout(event, integrationId, navigate) {
    event.target.disabled = true;
    try {
        await logoutUser();
        resetSession();
        navigate("/login" + (integrationId ? "?to=/integrations/" + integrationId : ""));
    } catch (error) {
        event.target.disabled = false;
        console.error(error);
    };
}

async function getBadges(id) {
    try {
        return await fetchBadges(id);
    } catch (error) { }
}

async function handleAvatar(event, setAvatar, setError) {
    try {
        if (event.target.files && event.target.files[0]) {
            if (event.target.files[0].size >= 500_000) {
                throw new Error("Votre photo de profil est trop lourde, 500 Mo max.");
            }
            if (event.target.files.length > 1 || !["png", "jpeg", "jpg"].map(a => "image/" + a).includes(event.target.files[0].type)) {
                throw new Error("L'image doit être au format PNG, JPEG ou JPG.");
            }

            await uploadAvatar(event.target.files[0]);
            setAvatar(URL.createObjectURL(event.target.files[0]));
        }
    } catch (error) {
        event.preventDefault();
        return setError({ title: "Erreur d'avatar", message: error.message || "Une erreur est survenue." });
    }
}