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
                <ListData list={part}/>
            </section>
        </>
    );
}

function ListData({list}) {
    const {getRequestList} = useRequestQueries();
    const listdata = getRequestList(list);
    if (listdata.isError) return <p>Error Loading Data</p>;
    if (listdata.isLoading) return <p>Loading Data</p>;
    return (
        <Row>
            <Col>
                <ListTable data={listdata.data} list={list} />
            </Col>
        </Row>
    );
}

function ListTable({data,list}) {
    const [rows,setRows] = useState([]);
    const [redirect,setRedirect] = useState();

    const handleRowClick = row => {
        if (list=='drafts') {
            setRedirect('/request/'+row.REQUEST_ID.replaceAll('-','/'));
        } else {
            setRedirect('/request/'+row.REQUEST_ID);
        }
    }

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    {(list=='drafts')&&<Button variant="danger" className="no-label" size="sm" title="Delete Draft" onClick={()=>console.log('delete draft')}><Icon icon="mdi:delete"/></Button>}
                    {(list!='drafts')&&<Button variant="success" className="no-label" size="sm" title="Approve" onClick={()=>console.log('approve')}><Icon icon="mdi:check"/></Button>}
                </div>
            );
        },ignoreRowClick:true,maxWidth:'100px'},
        {name:'ID',selector:row=>row.REQUEST_ID,sortable:true,sortField:'REQID'},
        {name:'Created',selector:row=>row.createdDateFmt,sortable:true,sortField:'UNIX_TS'},
        {name:'Submitted By',selector:row=>row.SUNY_ID,sortable:true,omit:(list=='drafts'),format:row=>`${row.fullName} (${row.SUNY_ID})`},
        {name:'Position Type',selector:row=>row.POSTYPE.id,format:row=>`${row.POSTYPE.id} - ${row.POSTYPE.title}`,sortable:true},
        {name:'Request Type',selector:row=>row.REQTYPE.id,format:row=>`${row.REQTYPE.id} - ${row.REQTYPE.title}`,sortable:true},
        {name:'Candidate Name',selector:row=>row.CANDIDATENAME,sortable:true},
        {name:'Effective Date',selector:row=>row.EFFDATE,format:row=>format(new Date(row.EFFDATE),'P'),sortable:true}
    ],[data,list]);
    useEffect(()=>{
        setRedirect(undefined);
        setRows(data);
    },[data]);
    //useEffect(()=>setRedirect(undefined),[data]);
    if (redirect) return <Redirect to={redirect}/>
    return (
        <DataTable 
            columns={columns} 
            data={rows}
            pagination 
            striped 
            responsive
            pointerOnHover
            highlightOnHover
            onRowClicked={handleRowClick}
        />
    );
}