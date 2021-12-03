import React from "react";
import {useParams} from "react-router-dom";
import { useRequestQueries } from "../../queries";
import { Link } from "react-router-dom";
import { Table } from "react-bootstrap";
import { format } from "date-fns";

export default function RequestList() {
    const {part} = useParams();
    return (
        <>
            <h2>List Page: {part}</h2>
            {(part=='drafts') && <DraftList/>}
        </>
    );
}

function DraftList() {
    const {getRequestList} = useRequestQueries();
    const listdata = getRequestList();
    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Position Type</th>
                    <th>Request Type</th>
                    <th>Effective Date</th>
                    <th>Candidate Name</th>
                </tr>
            </thead>
            <tbody>
                {listdata.data && listdata.data.map(l => {
                    const lnk = `/request/draft/${l.SUNY_ID}/${l.UNIX_TS}`;
                    return (
                        <tr key={l.UNIX_TS}>
                            <td><Link to={lnk}>{lnk}</Link></td>
                            <td>{JSON.parse(l.POSTYPE).id}</td>
                            <td>reqType</td>
                            <td>{format(new Date(l.EFFDATE),'M/d/yyyy')}</td>
                            <td>{l.CANDIDATENAME}</td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}