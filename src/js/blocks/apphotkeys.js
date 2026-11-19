import React, { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAuthContext } from "../app";
import { Redirect } from "react-router-dom";

export default function AppHotKeys() {
    const { isAdmin } = useAuthContext();
    const [redirect,setRedirect] = useState();

    const hotKeysHandler = (_,handler) => {
        switch (handler.key) {
            case "ctrl+alt+u":
                if (!isAdmin) return;
                setRedirect('/admin/users');
                break;
            case "ctrl+alt+g":
                if (!isAdmin) return;
                setRedirect('/admin/groups');
                break;
            case "ctrl+alt+h":
                setRedirect('/');
                break;
        }
    }

    useHotkeys('ctrl+alt+u',hotKeysHandler,{enableOnTags:['INPUT','SELECT','TEXTAREA']});
    useHotkeys('ctrl+alt+g',hotKeysHandler,{enableOnTags:['INPUT','SELECT','TEXTAREA']});
    useHotkeys('ctrl+alt+h',hotKeysHandler,{enableOnTags:['INPUT','SELECT','TEXTAREA']});

    if (redirect) return <Redirect to={redirect}/>;
    return null;
}