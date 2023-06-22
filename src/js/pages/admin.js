import React,{lazy} from "react";
import {useParams} from "react-router-dom";
import { NotFound, useAuthContext} from "../app";

const AdminNews = lazy(()=>import("./admin/news"));
const AdminUsers = lazy(()=>import("./admin/users"));
const AdminGroups = lazy(()=>import("./admin/groups"));
const AdminDepartments = lazy(()=>import("./admin/departments"));
const AdminLists = lazy(()=>import("./admin/lists"));
const AdminSettings = lazy(()=>import("./admin/settings"));
const AdminRequestHierarchy = lazy(()=>import("./admin/hierarchy/request"));
const AdminFormTransactions = lazy(()=>import("./admin/transactions"));
const AdminFormHierarchy = lazy(()=>import("./admin/hierarchy/form"));
const AdminTemplates = lazy(()=>import("./admin/templates"));

export default function AdminPages() {
    const {page,subpage} = useParams();
    const { isAdmin } = useAuthContext();
    if (!isAdmin) return <NotFound/>;
    switch(page) {
        case "news": return <AdminNews/>;
        case "users": return <AdminUsers/>;
        case "groups": return <AdminGroups/>;
        case "departments": return <AdminDepartments/>;
        case "lists": return <AdminLists/>;
        case "settings": return <AdminSettings/>;
        case "templates": return <AdminTemplates/>;
        case "journal":
            switch(subpage) {
                case "request": return <p>Request Journal Page</p>;
                default: return <NotFound/>;
            }
        case "hierarchy":
            switch(subpage) {
                case "request": return <AdminRequestHierarchy/>;
                case "form": return <AdminFormHierarchy/>;
                default: return <NotFound/>;
            }
        case "transactions": return <AdminFormTransactions/>;
        default: return <p>{page},{subpage}</p>;
            //return <NotFound/>;
    }
}
