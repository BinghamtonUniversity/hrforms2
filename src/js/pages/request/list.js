import React, { useState, useMemo, useEffect, useCallback } from "react";
import {useParams} from "react-router-dom";
import { useQueryClient } from "react-query";
import useRequestQueries from "../../queries/requests";
import useGroupQueries from "../../queries/groups";
import find from "lodash/find";
import { Redirect } from "react-router-dom";
import { Row, Col, Button, Badge, Modal, Form } from "react-bootstrap";
import { format } from "date-fns";
import DataTable from 'react-data-table-component';
import { Icon } from "@iconify/react";
import { Loading } from "../../blocks/components";

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
                <ListData list={(part)?part:'all'}/>
            </section>
        </>
    );
}

function ListData({list}) {
    const {getGroups} = useGroupQueries();
    const {getRequestList} = useRequestQueries();
    const groups = getGroups();
    const listdata = getRequestList(list,{enabled:!!groups.data,select:d=>{
        return d.map(l => {
            l.GROUPS_ARRAY = l.GROUPS.split(',').map(g => {
                const name = find(groups.data,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
            });
            return l;
        });
    }});
    if (listdata.isError) return <Loading type="alert" isError>Error Loading List Data</Loading>;
    if (listdata.isIdle||listdata.isLoading) return <Loading type="alert">Loading List Data</Loading>;
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
    const [action,setAction] = useState();
    const [selectedRow,setSelectedRow] = useState();
    const [showApprove,setShowApprove] = useState(undefined);
    const [comment,setComment] = useState('');

    const queryclient = useQueryClient();
    const {postRequest} = useRequestQueries();
    const req = postRequest();

    const handleRowClick = row => {
        if (list=='drafts') {
            setRedirect('/request/'+row.REQUEST_ID.replaceAll('-','/'));
        } else {
            setRedirect('/request/'+row.REQUEST_ID);
        }
    }

    const handleAction = (a,r) => {
        setAction(a);
        setSelectedRow(r);
    }
    const modalCallback = e => {
        if (!e || e?.target.id == 'cancel') {
            console.log('close');
            setAction(undefined);
            setSelectedRow(undefined);
            return true;
        }
        console.log(action,selectedRow);
        req.mutateAsync({action:action,comment:comment,...selectedRow}).then(d=>{
            console.log(d);
            //refetch: counts and requestlist
            Promise.all([
                queryclient.refetchQueries('requestlist'),
                queryclient.refetchQueries('counts'),
            ]).then(() => {
                setAction(undefined);
                setSelectedRow(undefined);    
            });
        });
    }

    const handleApprove = useCallback(e=>{
        if (!e || e?.target.id == 'cancel') {
            console.log('close');
            setShowApprove(undefined);
            setComment('');
            return true;
        } 
        console.log(showApprove,comment);
        console.log('do approve stuff...');
        req.mutateAsync({action:'approve',comment:comment,...showApprove}).then(d=>{
            console.log(d);
        });
        setShowApprove(undefined);
    },[showApprove,comment]);

    const handleDelete = useCallback(row => {
        console.log(row);
        //pop modal for confirm to delete.
    });

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    {(list=='drafts')&&<Button variant="danger" className="no-label" size="sm" title="Delete Draft" onClick={()=>handleDelete(row)}><Icon icon="mdi:delete"/></Button>}
                    {!(['drafts','pending','rejections'].includes(list))&&
                        <>
                            <Button variant="success" className="no-label" size="sm" title="Approve" onClick={()=>handleAction('approve',row)}><Icon icon="mdi:check"/></Button>
                            <Button variant="danger" className="no-label" size="sm" title="Reject" onClick={()=>handleAction('reject',row)}><Icon icon="mdi:close-circle"/></Button>
                        </>
                    }
                </div>
            );
        },ignoreRowClick:true,maxWidth:'100px'},
        {name:'ID',selector:row=>row.REQUEST_ID,sortable:true,sortField:'REQID'},
        {name:'Status',selector:row=>row.STATUS,format:row=>{
            switch(row.STATUS) {
                case "S":
                case "A": return "Pending Review"; break;
                case "R": return "Rejected"; break;
                case "Z": return "Archived"; break;
                case "draft": return "Draft"; break;
                default: return row.STATUS;
            }
        },sortable:true,sortField:'STATUS'},
        {name:'Created',selector:row=>row.createdDateFmt,sortable:true,sortField:'UNIX_TS'},
        {name:'Submitted By',selector:row=>row.SUNY_ID,sortable:true,omit:(list=='drafts'||list=='pending'),format:row=>`${row.fullName} (${row.SUNY_ID})`},
        {name:'Position Type',selector:row=>row.POSTYPE.id,format:row=>`${row.POSTYPE.id} - ${row.POSTYPE.title}`,sortable:true},
        {name:'Request Type',selector:row=>row.REQTYPE.id,format:row=>`${row.REQTYPE.id} - ${row.REQTYPE.title}`,sortable:true},
        {name:'Candidate Name',selector:row=>row.CANDIDATENAME,sortable:true},
        {name:'Effective Date',selector:row=>row.EFFDATE,format:row=>format(new Date(row.EFFDATE),'P'),sortable:true}
    ],[data,list]);
    useEffect(()=>{
        setRedirect(undefined);
        setRows(data);
    },[data]);
    if (redirect) return <Redirect to={redirect}/>
    return (
        <>
            <DataTable 
                columns={columns} 
                data={rows}
                pagination 
                striped 
                responsive
                pointerOnHover
                highlightOnHover
                onRowClicked={handleRowClick}
                expandableRows={(list!='drafts')}
                expandableRowsComponent={ExpandedComponent}
            />
            {showApprove && <ApproveRequestModal {...showApprove} handleApprove={handleApprove} setComment={setComment}/>}
            {action && <ActionModal action={action} modalCallback={modalCallback} setComment={setComment} />}
        </>
    );
}

function ExpandedComponent({data}) {
    return (
        <div className="p-3" style={{backgroundColor:'#ddd'}}>
            <span className="my-1">
                <Badge variant="secondary" className="p-2 badge-outline border-dark">Submitter</Badge> 
                <span><Icon className="iconify-inline m-0 mt-1" icon="mdi:arrow-right"/></span>
            </span>
            {data.GROUPS_ARRAY.map((g,i)=>{
                let variant = 'white';
                let classname = 'p-2 m-0 d-inline-flex flex-column badge-outline border';
                let title = 'Awaiting';
                if (i < data.SEQUENCE) { variant = 'success-light'; classname += '-success'; title = 'Approved'; }
                if (i == data.SEQUENCE && data.STATUS != 'R') { variant = 'info-light'; classname += '-info'; title = 'Pending'; }
                if (i == data.SEQUENCE && data.STATUS == 'R') { variant = 'danger-light'; classname += '-danger'; title = 'Rejected'; }
                return (
                    <span key={i} className="my-1">
                        <Badge as="p" title={title} variant={variant} className={classname}>
                            <span>{g.GROUP_NAME}</span>
                            <span className="pt-1 font-italic">{title}</span>
                        </Badge>
                        {(i<data.GROUPS_ARRAY.length-1)&&<span><Icon className="iconify-inline m-0 mt-1" icon="mdi:arrow-right"/></span>}
                    </span>
                );
            })}
        </div>
    );
}

function ActionModal({action,modalCallback,setComment}) {
    return (
        <Modal show={true} onHide={modalCallback} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{action}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="comment">
                        <Form.Label>Comment</Form.Label>
                        <Form.Control as="textarea" rows={3} onChange={e=>setComment(e.target.value)}/>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button id="cancel" variant="secondary" onClick={modalCallback}>Cancel</Button>
                <Button id={action} variant="danger" onClick={modalCallback}>{action}</Button>
            </Modal.Footer>
        </Modal>
    );
}

function ApproveRequestModal({REQUEST_ID,handleApprove,setComment}) {
    //use a callback to do the update/patch and setselectedrow and showapprove?
    return (
        <Modal show={true} onHide={handleApprove} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Approve?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="exampleForm.ControlTextarea1">
                        <Form.Label>Example textarea</Form.Label>
                        <Form.Control as="textarea" rows={3} onChange={e=>setComment(e.target.value)}/>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button id="cancel" variant="secondary" onClick={handleApprove}>Cancel</Button>
                <Button id="approve" variant="danger" onClick={handleApprove}>Approve</Button>
            </Modal.Footer>
        </Modal>
    );
}