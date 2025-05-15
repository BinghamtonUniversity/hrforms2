import React, { useState, useMemo, useEffect, useRef } from "react";
import {useParams} from "react-router-dom";
import { useQueryClient } from "react-query";
import useRequestQueries from "../../queries/requests";
import useGroupQueries from "../../queries/groups";
import { useForm, Controller } from "react-hook-form";
import { capitalize, find, pick, get } from "lodash";
import { Redirect } from "react-router-dom";
import { Row, Col, Modal, Form, Alert } from "react-bootstrap";
import { format } from "date-fns";
import DataTable from 'react-data-table-component';
import { AppButton, Loading, ModalConfirm, WorkflowExpandedComponent } from "../../blocks/components";
import { useUserContext, SettingsContext, NotFound, useSettingsContext, useAuthContext } from "../../app";
import { useHotkeys } from "react-hotkeys-hook";
import { flattenObject } from "../../utility";
import { Helmet } from "react-helmet";
import useUserQueries from "../../queries/users";
import { Icon } from "@iconify/react/dist/iconify.js";
import { hide } from "@popperjs/core";

export default function RequestList() {
    const {part} = useParams();
    const [redirect,setRedirect] = useState();
    const [countAge,setCountAge] = useState();
    const { getCounts } = useUserQueries();
    const counts = getCounts();

    useEffect(() => {
        if (!counts.data) return;
        setCountAge(get(counts.data,`requests.${part}.age`),undefined);
    },[counts.data]);

    if (redirect) return <Redirect to={redirect}/>;
    return (
        <SettingsContext.Consumer>
            {({requests}) => {
                if (!((requests.menu[part]?.enabled == undefined)?true:requests.menu[part]?.enabled)) return <NotFound/>;
                if (!Object.keys(requests.menu).includes(part)) return <NotFound/>;
                return (
                <>
                    <header>
                        <Helmet>
                            <title>Requests List: {requests.menu[part]?.title}</title>
                        </Helmet>
                        <Row>
                            <Col>
                                <h2>Requests List: {requests.menu[part]?.title} <AppButton format="add" onClick={()=>setRedirect('/request')}>New Request</AppButton></h2>
                            </Col>
                        </Row>
                    </header>
                    <section>
                        <ListAgeWarning enabled={requests.agewarn.enabled} maxage={requests.agewarn.age} countAge={countAge}/>
                        <ListData list={(part)?part:'all'}/>
                    </section>
                </>
            )}}
        </SettingsContext.Consumer>
    );
}

function ListAgeWarning({enabled,maxage,countAge}) {
    if (!enabled||!countAge) return null;
    if (countAge < maxage) return null;
    return (                
        <Alert variant="danger">
            <Icon icon="mdi:alert" className="iconify-inline"/> There are Requests older than <strong>{maxage} days</strong> in your list
        </Alert>
    );
}

function ListData({list}) {
    const queryclient = useQueryClient();
    const {getGroups} = useGroupQueries();
    const {getRequestList} = useRequestQueries();
    const groups = getGroups();
    const listdata = getRequestList(list,{enabled:!!groups.data,select:d=>{
        return d.map(l => {
            if (list != 'archived') {
                l.GROUPS_ARRAY = (!l.GROUPS)?[]:l.GROUPS.split(',').map(g=>pick(find(groups.data,{GROUP_ID:g}),['GROUP_ID','GROUP_NAME','GROUP_DESCRIPTION']));
            }
            return l;
        });
    }});

    // Remove the requestlist query cache when leaving the page.
    useEffect(() => ()=>queryclient.removeQueries('requestlist'),[]);

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
    const [expandAll,setExpandAll] = useState(false);
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [redirect,setRedirect] = useState();
    const [action,setAction] = useState();
    const [selectedRow,setSelectedRow] = useState();
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);

    const searchRef = useRef();

    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
        e.preventDefault();
        searchRef.current.focus()
    });
    useHotkeys('ctrl+alt+e',()=>{
        setExpandAll(!expandAll);
    },{enableOnTags:['INPUT']},[expandAll]);
    useHotkeys('ctrl+alt+n',()=>setRedirect('/request'),{enableOnTags:['INPUT']});

    const {SUNY_ID} = useUserContext();
    const {isAdmin} = useAuthContext();
    const {general} = useSettingsContext();
    const queryclient = useQueryClient();
    const {postRequest,deleteRequest} = useRequestQueries(selectedRow?.REQUEST_ID);
    const req = postRequest();
    const delReq = deleteRequest();

    const handleRowClick = row => {
        switch (list) {
            case 'drafts':
                setRedirect('/request/'+row.REQUEST_ID.replaceAll('-','/'));
                break;
            case 'archived':
                setRedirect('/request/archive/'+row.REQUEST_ID);
                break;
            default:
                setRedirect('/request/'+row.REQUEST_ID);
        }
    };

    const handleAction = (a,r) => {
        if (a == 'journal') {
            setRedirect('/request/journal/'+r.REQUEST_ID);
        } else {
            setAction((a=='approve'&&list=='final')?'final':a);
            setSelectedRow(r);
        }
    };
    const modalCallback = (e,comment) => {
        if (!e || e?.target.id == 'cancel') {
            setAction(undefined);
            setSelectedRow(undefined);
            return true;
        }
        req.mutateAsync({action:action,reqId:selectedRow.REQUEST_ID,comment:comment,...selectedRow}).then(d=>{
            //refetch: counts and requestlist
            queryclient.refetchQueries(SUNY_ID).then(() => {
                setAction(undefined);
                setSelectedRow(undefined);    
            });
        });
    };

    const confirmDeleteButtons = {
        close:{title:'Cancel',callback:()=>setAction(undefined)},
        confirm:{
            title:'Delete',
            variant:'danger',
            format:'delete',
            callback:()=>{
                delReq.mutateAsync().then(()=>{
                    queryclient.refetchQueries(SUNY_ID).then(() => {
                        setAction(undefined);
                        setSelectedRow(undefined);    
                    });    
                });
        }}
    };

    const expandRow = useMemo(()=>{
        if ((isAdmin && general.showReqWF == 'A')||general.showReqWF == 'Y') {
            if (list !== 'drafts') return true;
        }
        return false;
    },[list,general,isAdmin]);
    
    const noData = useMemo(() => {
        return (
            <SettingsContext.Consumer>
                {({requests}) => <p className="m-3">No Current {requests.menu[list]?.title}</p>}
            </SettingsContext.Consumer>
        );
    },[list]);

    const filterComponent = useMemo(() => {
        const handleKeyDown = e => {
            if(e.key=="Escape"&&!filterText) searchRef.current.blur();
        }
        const handleFilterChange = e => {
            if (e.target.value) {
                setResetPaginationToggle(false);
                setFilterText(e.target.value);
            } else {
                setResetPaginationToggle(true);
                setFilterText('');
            }
        }
        const expandText = ((expandAll)?'Collapse':'Expand') + ' All';
        return(
            <>
                {expandRow &&
                    <Col className="pl-0">
                        <Form.Check type="switch" id="toggle-expand" label={expandText} onChange={()=>setExpandAll(!expandAll)} checked={expandAll}/>
                    </Col>
                }
                <Col sm={6} md={5} lg={4} xl={3}>
                    <Form onSubmit={e=>e.preventDefault()}>
                        <Form.Group as={Row} controlId="filter">
                            <Form.Label column sm="2">Search: </Form.Label>
                            <Col sm="10">
                                <Form.Control ref={searchRef} className="ml-2" type="search" placeholder="search..." onChange={handleFilterChange} onKeyDown={handleKeyDown}/>
                            </Col>
                        </Form.Group>
                    </Form>
                </Col>
            </>
        );
    },[filterText,expandAll,expandRow,list]);

    const filteredRows = useMemo(()=>rows.filter(row=>Object.values(flattenObject(row)).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase())),[rows,filterText]);
    
    const columns = useMemo(() => {
        const cols = [
            {name:'Actions',id:'actions',cell:row=>{
                return (
                    <div className="button-group">
                        {(list=='drafts')&&<AppButton format="delete" size="sm" title="Delete Draft" onClick={()=>handleAction('delete',row)}></AppButton>}
                        {(list!='drafts')&&<AppButton format="info" size="sm" title="Show Journal" onClick={()=>handleAction('journal',row)}></AppButton>}
                        {/*TODO: more work needed to allow for quick approve/reject
                        !(['drafts','pending','rejections','archived'].includes(list))&&
                            <>
                                <AppButton format="approve" size="sm" title="Approve" onClick={()=>handleAction('approve',row)}></AppButton>
                                <AppButton format="reject" size="sm" title="Reject" onClick={()=>handleAction('reject',row)}></AppButton>
                            </>
                        */}
                    </div>
                );
            },ignoreRowClick:true,maxWidth:'100px'},
            {name:'ID',selector:row=>row.REQUEST_ID,sortable:true},
            //{name:'Status',selector:row=>row.STATUS,format:row=>(row.STATUS == 'draft')?"Draft":get(general.status,`${row.STATUS}.list`,row.STATUS),sortable:true,sortField:'STATUS'},
            {name:'Position Type',selector:row=>row.POSTYPE.id,format:row=>`${row.POSTYPE.id} - ${row.POSTYPE.title}`,sortable:true},
            {name:'Request Type',selector:row=>row.REQTYPE.id,format:row=>`${row.REQTYPE.id} - ${row.REQTYPE.title}`,sortable:true},
            {name:'Effective Date',selector:row=>row.EFFDATE,format:row=>format(new Date(row.EFFDATE),'P'),sortable:true},
            {name:'Candidate Name',selector:row=>row.CANDIDATENAME,sortable:true,wrap:true},
            {name:'Line #',selector:row=>row.LINENUMBER,sortable:true},
            {name:'Title',selector:row=>row.REQBUDGETTITLE,sortable:true,wrap:true},
            {name:(list=='archived')?'Archive Date':'Last Updated',selector:row=>row.MAX_JOURNAL_DATE,format:row=>format(new Date(row.MAX_JOURNAL_DATE),'Pp'),sortable:true,grow:2,omit:(list=='drafts')},
            {name:'Submitted By',selector:row=>row.SUNY_ID,sortable:true,omit:(list=='drafts'||list=='pending'),format:row=>`${row.fullName} (${row.CREATED_BY_SUNY_ID})`,wrap:true},
            {name:'Created',selector:row=>row.createdDateFmt,sortable:true,sortField:'UNIX_TS',grow:2},
        ];
        return cols;
    },[data,list]);
    useEffect(()=>{
        setRedirect(undefined);
        setRows(data);
    },[data]);
    useEffect(()=>searchRef.current.focus(),[]);
    if (redirect) return <Redirect to={{pathname:redirect,state:{from:`/request/list/${list}`}}}/>;
    return (
        <>
            <DataTable 
                keyField="REQUEST_ID"
                className="compact"
                columns={columns} 
                data={filteredRows}
                pagination 
                striped 
                responsive
                persistTableHead
                subHeader
                subHeaderComponent={filterComponent}
                paginationResetDefaultPage={resetPaginationToggle}
                pointerOnHover
                highlightOnHover
                onRowClicked={handleRowClick}
                expandableRows={expandRow}
                expandableRowsComponent={WorkflowExpandedComponent}
                expandableRowExpanded={()=>expandAll}
                noDataComponent={noData}
            />
            <ModalConfirm 
                id={selectedRow?.REQUEST_ID}
                show={action=='delete'} 
                title="Delete?" 
                buttons={confirmDeleteButtons}
            >
                Are you sure you want to DELETE draft: {selectedRow?.REQUEST_ID}?
            </ModalConfirm>
            {(action&&action!='delete') && <ActionModal action={action} modalCallback={modalCallback}/>}
        </>
    );
}

function ActionModal({action,modalCallback}) {
    const [isSaving,setIsSaving] = useState(false);
    const {handleSubmit,control,setFocus,formState:{errors}} = useForm();
    const onSubmit = (data,e) => {
        setIsSaving(true);
        modalCallback(e,data.comment);
    }
    const onHide = () => {
        if(isSaving) return 0;
        modalCallback(undefined);
    }
    const onError = error => {
        console.error(error);
    }
    useEffect(()=>setFocus('comment'),[setFocus]);
    return (
        <Modal show={true} onHide={e=>onHide(e)} backdrop="static">
            <Form onSubmit={handleSubmit(onSubmit,onError)}>
                <Modal.Header closeButton>
                    <Modal.Title>{capitalize(action)}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                        <Controller
                            name="comment"
                            defaultValue=""
                            rules={{required:{value:true,message:'Comment is required'}}}
                            control={control}
                            render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief comment" rows={5} isInvalid={errors.comment}/>}
                        />
                        <Form.Control.Feedback type="invalid">{errors.comment?.message}</Form.Control.Feedback>
                </Modal.Body>
                <Modal.Footer>
                    <AppButton id="cancel" format="cancel" onClick={onHide} disabled={isSaving}>Cancel</AppButton>
                    <AppButton type="submit" format="approve" disabled={isSaving}>{capitalize(action)}</AppButton>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
