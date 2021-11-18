import React from "react";
import {useParams} from "react-router-dom"

export default function Page() {
    const {part} = useParams();
    return (
        <h2>List Page: {part}</h2>
    )
}