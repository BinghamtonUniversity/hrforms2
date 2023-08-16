import React,{ lazy } from "react";
import {useParams} from "react-router-dom";
import { NotFound, useAuthContext} from "../app";

const TestError = lazy(()=>import("./test/error"));

export default function TestPages() {
    const { page } = useParams();
    const { isAdmin } = useAuthContext();
    if (!isAdmin) return <NotFound/>;
    switch(page) {
        case "error": return <TestError/>;
        default: return <NotFound/>;
    }
}