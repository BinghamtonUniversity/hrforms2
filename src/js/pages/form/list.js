import React, { useState, useMemo, useEffect, useRef } from "react";
import {useParams} from "react-router-dom";
import { useQueryClient } from "react-query";
import useFormQueries from "../../queries/forms";
import useGroupQueries from "../../queries/groups";
import { useForm, Controller } from "react-hook-form";
import { capitalize, find } from "lodash";
import { Redirect } from "react-router-dom";
import { Row, Col, Button, Badge, Modal, Form } from "react-bootstrap";
import { format } from "date-fns";
import DataTable from 'react-data-table-component';
import { Icon } from "@iconify/react";
import { DateFormat, DescriptionPopover, Loading, ModalConfirm } from "../../blocks/components";
import { getSettings, currentUser, getAuthInfo, SettingsContext, NotFound } from "../../app";
import { useHotkeys } from "react-hotkeys-hook";

export default function FormList() {
    const {part} = useParams();
    return (
        <SettingsContext.Consumer>
            {({forms}) => {
                if (!((forms.menu[part]?.enabled == undefined)?true:forms.menu[part]?.enabled)) return <NotFound/>;
                if (!Object.keys(forms.menu).includes(part)) return <NotFound/>;
                return (
                <>
                    <header>
                        <Row>
                            <Col><h2>Forms List: {forms.menu[part]?.title}</h2></Col>
                        </Row>
                    </header>
                    <section>
                        <ListData list={(part)?part:'all'}/>
                    </section>
                </>
            )}}
        </SettingsContext.Consumer>
    );
}

function ListData({list}) {
    const {getGroups} = useGroupQueries();
    const {getFormList} = useFormQueries();
    const groups = getGroups();
    const listdata = getFormList(list,{enabled:!!groups.data,select:d=>{
        return d.map(l => {
            l.STATUS_ARRAY = l.JOURNAL_STATUS.split(',');
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
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [redirect,setRedirect] = useState();
    const [action,setAction] = useState();
    const [selectedRow,setSelectedRow] = useState();
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);

    const searchRef = useRef();

    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus()
    });


    const {SUNY_ID} = currentUser();
    const {isAdmin} = getAuthInfo();
    const {general} = getSettings();
    const queryclient = useQueryClient();
    const {postForm,deleteForm} = useFormQueries(selectedRow?.FORM_ID);
    const frm = postForm();
    const delFrm = deleteForm();

    const handleRowClick = row => {
        if (list=='drafts') {
            setRedirect('/form/'+row.FORM_ID.replaceAll('-','/'));
        } else {
            setRedirect('/form/'+row.FORM_ID);
        }
    };

    const handleAction = (a,r) => {
        setAction(a);
        setSelectedRow(r);
    };
    const modalCallback = (e,comment) => {
        if (!e || e?.target.id == 'cancel') {
            setAction(undefined);
            setSelectedRow(undefined);
            return true;
        }
        console.log(action,comment);
        frm.mutateAsync({action:action,reqId:selectedRow.FORM_ID,comment:comment,...selectedRow}).then(d=>{
            console.log(d);
            //refetch: counts and requestlist
            queryclient.refetchQueries(SUNY_ID).then(() => {
                setAction(undefined);
                setSelectedRow(undefined);    
            });
        });
    };

    const confirmDeleteButtons = {
        close:{title:'Cancel',callback:()=>setAction(undefined)},
        confirm:{title:'Delete',variant:'danger',callback:()=>{
            delFrm.mutateAsync().then(()=>{
                queryclient.refetchQueries(SUNY_ID).then(() => {
                    setAction(undefined);
                    setSelectedRow(undefined);    
                });    
            });
        }}
    };

    const expandRow = useMemo(()=>{
        if ((isAdmin && general.showFormWF == 'a')||general.showFormWF == 'y') {
            if (list !== 'drafts') return true;
        }
        return false;
    },[list,general,isAdmin]);

    const filterComponent = useMemo(() => {
        const handleFilterChange = e => {
            if (e.target.value) {
                setResetPaginationToggle(false);
                setFilterText(e.target.value);
            } else {
                setResetPaginationToggle(true);
                setFilterText('');
            }
        }
        return(
            <Form onSubmit={e=>e.preventDefault()}>
                <Form.Group as={Row} controlId="filter">
                    <Form.Label column sm="2">Search: </Form.Label>
                    <Col sm="10">
                        <Form.Control ref={searchRef} className="ml-2" type="search" placeholder="search..." onChange={handleFilterChange}/>
                    </Col>
                </Form.Group>
            </Form>
        );
    },[filterText]);

    const filteredRows = rows.filter(row=>Object.values(row).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase()));
    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    {(list=='drafts')&&<Button variant="danger" className="no-label" size="sm" title="Delete Draft" onClick={()=>handleAction('delete',row)}><Icon icon="mdi:delete"/></Button>}
                    {!(['drafts','pending','rejections'].includes(list))&&
                        <>
                            <Button variant="success" className="no-label" size="sm" title="Approve" onClick={()=>handleAction('approve',row)}><Icon icon="mdi:check"/></Button>
                            <Button variant="danger" className="no-label" size="sm" title="Reject" onClick={()=>handleAction('reject',row)}><Icon icon="mdi:close-circle"/></Button>
                        </>
                    }
                </div>
            );
        },ignoreRowClick:true,maxWidth:'100px'},
        {name:'Form ID',selector:row=>row.FORM_ID,sortable:true,sortField:'FORM_ID'},
        {name:'Effective Date',selector:row=>row.effDateFmt},
        {name:'Name',selector:row=>row.sortName},
        {name:'Form',selector:row=>(
                <DescriptionPopover
                    id={`${row.FORM_ID}_code_description`}
                    content={[row.FORM_CODE_TITLE,row.ACTION_CODE_TITLE,row.TRANSACTION_CODE_TITLE].join(' | ')}
                >
                    <p className="mb-0">{
                        [row.FORM_CODE,row.ACTION_CODE,row.TRANSACTION_CODE].join('-')
                    }</p>
                </DescriptionPopover>
        ),sortable:true},
        {name:'Payroll',selector:row=>(
                <DescriptionPopover 
                    id={`${row.PAYROLL_CODE}_description`}
                    content={row.PAYROLL_DESCRIPTION}
                >
                    <p className="mb-0">{row.PAYROLL_TITLE}</p>
                </DescriptionPopover>
        ),sortable:true},
        {name:'Position',selector:row=>(
            <p className="mb-0">{row.TITLE} ({row.LINE_NUMBER})</p>
        ),sortable:true,wrap:true},
        {name:'Created',selector:row=>row.createdDateFmt,sortable:true,sortField:'UNIX_TS'},
        {name:'Submitted By',selector:row=>row.SUNY_ID,sortable:true,omit:(list=='drafts'||list=='pending'),format:row=>`${row.fullName} (${row.SUNY_ID})`},
    ],[data,list]);
    useEffect(()=>{
        setRedirect(undefined);
        setRows(data);
    },[data]);
    useEffect(()=>searchRef.current.focus(),[]);
    if (redirect) return <Redirect to={redirect}/>
    return (
        <>
            <DataTable 
                keyField="FORM_ID"
                className="compact"
                columns={columns} 
                data={filteredRows}
                pagination 
                striped 
                responsive
                subHeader
                subHeaderComponent={filterComponent}
                paginationResetDefaultPage={resetPaginationToggle}
                pointerOnHover
                highlightOnHover
                onRowClicked={handleRowClick}
                expandableRows={expandRow}
                expandableRowsComponent={ExpandedComponent}
            />
            <ModalConfirm show={action=='delete'} title="Delete?" buttons={confirmDeleteButtons}>Are you sure you want to DELETE draft: {selectedRow?.FORM_ID}?</ModalConfirm>
            {(action&&action!='delete') && <ActionModal action={action} modalCallback={modalCallback}/>}
        </>
    );
}

function ExpandedComponent({data}) {
    //TODO: need to create usersettings/permissions and control this per user
    //TODO: Consolidate title for component use.
    const [showSkipped,setShowSkipped] = useState(false);
    const {general} = getSettings();
    const {isAdmin} = getAuthInfo();
    useEffect(() => {
        if (isAdmin && general.showSkipped == 'a' || general.showSkipped == 'y') {
            setShowSkipped(true);
        } else {
            setShowSkipped(false);
        }
    },[general]);
    return (
        <div className="p-3" style={{backgroundColor:'#ddd'}}>
            <span className="my-1">
                <Badge variant="secondary" className="p-2 badge-outline border-dark">Submitter</Badge> 
                <span><Icon className="iconify-inline m-0 mt-1" icon="mdi:arrow-right"/></span>
            </span>
            {data.GROUPS_ARRAY.map((g,i)=>{
                if (data.STATUS_ARRAY[i] == 'X' && !showSkipped) return null;
                let variant = 'white';
                let classname = 'p-2 m-0 d-inline-flex flex-column badge-outline border';
                let title = 'Awaiting';
                if (i < data.SEQUENCE) { 
                    if (data.STATUS_ARRAY[i] == 'X') {
                        classname += '-dark badge-white-striped'; title = 'Skipped';
                    } else {
                        variant = 'success-light'; classname += '-success'; title = 'Approved'; 
                    }
                }
                if (i == data.SEQUENCE && data.STATUS != 'R') { variant = 'info-light'; classname += '-info'; title = 'Pending'; }
                if (data.STATUS_ARRAY[i] == 'F') {title = 'Pending Final';}
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

function ActionModal({action,modalCallback}) {
    const {handleSubmit,control,setFocus,formState:{errors}} = useForm();
    const onSubmit = (data,e) => modalCallback(e,data.comment);
    const onError = error => {
        console.error(error);
    }
    useEffect(()=>setFocus('comment'),[setFocus]);
    return (
        <Modal show={true} onHide={modalCallback} backdrop="static">
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
                    <Button id="cancel" variant="secondary" onClick={modalCallback}>Cancel</Button>
                    <Button type="submit" id={action} variant={(action=='approve'?'success':'danger')}>{capitalize(action)}</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
