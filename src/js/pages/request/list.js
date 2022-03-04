import React, { useState, useMemo, useEffect } from "react";
import {useParams} from "react-router-dom";
import useRequestQueries from "../../queries/requests";
import { Redirect } from "react-router-dom";
import { Row, Col, Button } from "react-bootstrap";
import { format } from "date-fns";
import DataTable from 'react-data-table-component';
import { Icon } from "@iconify/react";

export default function RequestList() {
    const {part} = useParams();
    return (
        <>
            <header>
                <Row>
                    <Col><h2>List: {part}</h2></Col>
                </Row>
            </header>
            <section>
                <ListRouter list={part}/>
            </section>
        </>
    );
}

function ListRouter({list}) {
    switch(list) {
        case "drafts": return <DraftList/>;
        default: return <p>{list}</p>;
    }
}

function DraftList() {
    const {getRequestList} = useRequestQueries();
    const listdata = getRequestList();
    if (listdata.isError) return <p>Error Loading Data</p>;
    if (listdata.isLoading) return <p>Loading Data</p>;
    return (
        <Row>
            <Col>
                <ListTable data={listdata.data} />
            </Col>
        </Row>
    );
}

function ListTable({data}) {
    const [redirect,setRedirect] = useState();

    const handleRowClick = row => {
        setRedirect('/request/'+row.REQID.replaceAll('-','/'));
    }

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    <Button variant="danger" className="no-label" size="sm" title="Delete Draft" onClick={()=>console.log('delete draft')}><Icon icon="mdi:delete"/></Button>
                </div>
            );
        },ignoreRowClick:true,maxWidth:'100px'},
        {name:'ID',selector:row=>row.REQID,sortable:true,sortField:'REQID'},
        {name:'Created',selector:row=>row.createdDateFmt,sortable:true,sortField:'UNIX_TS'},
        {name:'Position Type',selector:row=>row.POSTYPE.id,format:row=>`${row.POSTYPE.id} - ${row.POSTYPE.title}`,sortable:true},
        {name:'Request Type',selector:row=>row.REQTYPE.id,format:row=>`${row.REQTYPE.id} - ${row.REQTYPE.title}`,sortable:true},
        {name:'Candidate Name',selector:row=>row.CANDIDATENAME,sortable:true},
        {name:'Effective Date',selector:row=>row.EFFDATE,format:row=>format(new Date(row.EFFDATE),'P'),sortable:true}
    ],[data]);
    useEffect(()=>setRedirect(undefined),[data]);
    if (redirect) return <Redirect to={redirect}/>
    return (
        <DataTable 
            columns={columns} 
            data={data}
            pagination 
            striped 
            responsive
            pointerOnHover
            highlightOnHover
            onRowClicked={handleRowClick}
        />
    );
}