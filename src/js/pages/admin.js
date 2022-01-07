import React,{lazy} from "react";
import {useParams} from "react-router-dom";
import {getAuthInfo,NotFound} from "../app";

const AdminNews = lazy(()=>import("./admin/news"));
const AdminUsers = lazy(()=>import("./admin/users"));
const AdminGroups = lazy(()=>import("./admin/groups"));
const AdminDepartments = lazy(()=>import("./admin/departments"));
const AdminLists = lazy(()=>import("./admin/lists"));
const AdminSettings = lazy(()=>import("./admin/settings"));

export default function AdminPages() {
    const {page} = useParams();
    const {isAdmin} = getAuthInfo();
    if (!isAdmin) return <NotFound/>;
    switch(page) {
        case "news": return <AdminNews/>;
        case "users": return <AdminUsers/>;
        case "journal": return <p>Journal</p>;
        case "groups": return <AdminGroups/>;
        case "departments": return <AdminDepartments/>;
        case "lists": return <AdminLists/>;
        case "settings": return <AdminSettings/>;
        default:
            return <NotFound/>;
    }
}
