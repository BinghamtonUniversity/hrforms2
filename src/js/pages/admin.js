import React, { lazy } from "react";
import {useParams} from "react-router-dom";
import { NotFound, useAuthContext, lazyRetry } from "../app";

const AdminNews = lazy(()=>lazyRetry(()=>import("./admin/news")));
const AdminUsers = lazy(()=>lazyRetry(()=>import("./admin/users")));
const AdminGroups = lazy(()=>lazyRetry(()=>import("./admin/groups")));
const AdminDepartments = lazy(()=>lazyRetry(()=>import("./admin/departments")));
const AdminLists = lazy(()=>lazyRetry(()=>import("./admin/lists")));
const AdminSettings = lazy(()=>lazyRetry(()=>import("./admin/settings")));
const AdminRequestHierarchy = lazy(()=>lazyRetry(()=>import("./admin/hierarchy/request")));
const AdminFormTransactions = lazy(()=>lazyRetry(()=>import("./admin/transactions")));
const AdminFormHierarchy = lazy(()=>lazyRetry(()=>import("./admin/hierarchy/form")));
const AdminTemplates = lazy(()=>lazyRetry(()=>import("./admin/templates")));
const AdminTextStrings = lazy(()=>lazyRetry(()=>import("./admin/strings")));

export default function AdminPages() {
    const { page, subpage } = useParams();
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
        case "strings": return <AdminTextStrings/>;
        case "hierarchy":
            switch(subpage) {
                case "request": return <AdminRequestHierarchy/>;
                case "form": return <AdminFormHierarchy/>;
                default: return <NotFound/>;
            }
        case "transactions": return <AdminFormTransactions/>;
        default: return <NotFound/>;
    }
}
