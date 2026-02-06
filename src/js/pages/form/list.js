import React, { useState, useMemo, useEffect, useRef, lazy } from "react";
import {useParams} from "react-router-dom";
import { useQueryClient } from "react-query";
import useFormQueries from "../../queries/forms";
import useGroupQueries from "../../queries/groups";
import { useForm, Controller } from "react-hook-form";
import { capitalize, find, pick, get } from "lodash";
import { Redirect } from "react-router-dom";
import { Row, Col, Modal, Form, Alert } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { AppButton, DescriptionPopover, Loading, ModalConfirm, WorkflowExpandedComponent } from "../../blocks/components";
import { SettingsContext, NotFound, useSettingsContext, useAuthContext, useUserContext } from "../../app";
import { useHotkeys } from "react-hotkeys-hook";
import { displayFormCode } from "../form";
import { Helmet } from "react-helmet";
import useUserQueries from "../../queries/users";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function FormList() {
    const {part} = useParams();
    const { isViewer } = useUserContext();
    const [redirect,setRedirect] = useState();
    const [countAge,setCountAge] = useState();
    const { getCounts } = useUserQueries();
    const counts = getCounts();

    useEffect(() => {
        if (!counts.data) return;
        setCountAge(get(counts.data,`forms.${part}.age`),undefined);
    },[counts.data]);

    if (redirect) return <Redirect to={redirect}/>;
    return (
        <SettingsContext.Consumer>
            {({forms}) => {
                if (!((forms.menu[part]?.enabled == undefined)?true:forms.menu[part]?.enabled)) return <NotFound/>;
                if (!Object.keys(forms.menu).includes(part)) return <NotFound/>;
                return (
                <>
                    <header>
                        <Helmet>
                            <title>Forms List: {forms.menu[part]?.title}</title>
                        </Helmet>
                        {!isViewer && 
                            <Row>
                                <Col>
                                    <h2>Forms List: {forms.menu[part]?.title} <AppButton format="add" onClick={()=>setRedirect('/form')}>New Form</AppButton></h2>
                                </Col>
                            </Row>
                        }
                    </header>
                    <section>
                        {part=='pending' &&
                            <Alert variant="info">
                                <Icon icon="mdi:information" className="iconify-inline"/> This list includes Forms that you have submitted as well as Forms that are currently in an approval group you belong to.  You may not have any action required on some of these Forms.
                            </Alert>
                        }
                        <ListAgeWarning enabled={forms.agewarn.enabled} maxage={forms.agewarn.age} countAge={countAge}/>
                        <ListData list={(part)?part:''}/>
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
            <Icon icon="mdi:alert" className="iconify-inline"/> There are Forms older than <strong>{maxage} days</strong> in your list
        </Alert>
    );
}

function ListData({list}) {
    const queryclient = useQueryClient();
    const {getGroups} = useGroupQueries();
    const {getFormList} = useFormQueries();
    const groups = getGroups();
    const listdata = getFormList(list,{enabled:!!groups.data,select:d=>{
        return d.map(l => {            
            l.GROUPS_ARRAY = (!l.GROUPS)?[]:l.GROUPS.split(',').map(g=>pick(find(groups.data,{GROUP_ID:g}),['GROUP_ID','GROUP_NAME','GROUP_DESCRIPTION']));
            return l;
        });
    }});

    // Remove the formlist query cache when leaving the page.
    useEffect(() => ()=>queryclient.removeQueries('formlist'),[]);

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
    useHotkeys('ctrl+alt+n',()=>{
        setRedirect('/form/');
    },{enableOnTags:['INPUT']},[expandAll]);

    const {SUNY_ID} = useUserContext();
    const {isAdmin} = useAuthContext();
    const {general} = useSettingsContext();
    const queryclient = useQueryClient();
    const {postForm,deleteForm} = useFormQueries(selectedRow?.FORM_ID);
    const frm = postForm();
    const delFrm = deleteForm();

    const handleRowClick = row => {
        if (list == 'drafts') {
            setRedirect('/form/'+row.FORM_ID.replaceAll('-','/'));
        } else {
            setRedirect('/form/'+row.FORM_ID);
        }
    };

    const handleAction = (a,r) => {
        if (a == 'journal') {
            setRedirect('/form/journal/'+r.FORM_ID);
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
        frm.mutateAsync({action:action,formId:selectedRow.FORM_ID,comment:comment,...selectedRow}).then(()=>{
            //refetch: counts and formlist
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
        if ((isAdmin && general.showFormWF == 'A')||general.showFormWF == 'Y') {
            if (list !== 'drafts') return true;
        }
        return false;
    },[list,general,isAdmin]);
    
    const noData = useMemo(() => {
        return (
            <SettingsContext.Consumer>
                {({forms}) => <p className="m-3">No Current {forms.menu[list]?.title}</p>}
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

    const filteredRows = useMemo(()=>rows.filter(row=>Object.values(row).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase())),[rows,filterText]);

    const columns = useMemo(() => [
        {name:'Actions',id:'action',cell:row=>{
            return (
                <div className="button-group">
                    {(list=='drafts')&&<AppButton format="delete" size="sm" title="Delete Draft" onClick={()=>handleAction('delete',row)}></AppButton>}
                    {(list!='drafts')&&<AppButton format="info" size="sm" title="Show Journal" onClick={()=>handleAction('journal',row)}></AppButton>}
                    {/*TODO: more work needed to allow for quick approve/reject
                    !(['drafts','pending','rejections'].includes(list))&&
                        <>
                            <AppButton format="approve" size="sm" title="Approve" onClick={()=>handleAction('approve',row)}></AppButton>
                            <AppButton format="reject" size="sm" title="Reject" onClick={()=>handleAction('reject',row)}></AppButton>
                        </>
                    */}
                </div>
            );
        },ignoreRowClick:true,maxWidth:'100px'},
        {name:'Form ID',selector:row=>row.FORM_ID,sortable:true,sortField:'FORM_ID'},
        {name:'Effective Date',selector:row=>row.effDateFmt,sortable:true},
        {name:'Name',selector:row=>row.sortName,sortable:true},
        {name:'Form',selector:row=>(
                <DescriptionPopover
                    id={`${row.FORM_ID}_code_description`}
                    content={displayFormCode({variant:"title",separator:" | ",titles:[row.FORM_TITLE,row.ACTION_TITLE,row.TRANSACTION_TITLE]})}
                >
                    <p className="mb-0">{displayFormCode({codes:[row.FORM_CODE,row.ACTION_CODE,row.TRANSACTION_CODE]})}</p>
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
        {name:'Submitted By',selector:row=>row.SUNY_ID,sortable:true,omit:(list=='drafts'||list=='pending'),format:row=>`${row.createdByName} (${row.CREATED_BY_SUNY_ID})`},
    ],[data,list]);
    useEffect(()=>{
        setRedirect(undefined);
        setRows(data);
    },[data]);
    useEffect(()=>searchRef.current.focus(),[]);
    if (redirect) return <Redirect to={{pathname:redirect,state:{from:`/form/list/${list}`}}}/>;
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
                defaultSortFieldId={2}
            />
            <ModalConfirm 
                id={selectedRow?.FORM_ID}
                show={action=='delete'} 
                title="Delete?"
                buttons={confirmDeleteButtons}
            >
                    Are you sure you want to DELETE draft: {selectedRow?.FORM_ID}?
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
                    {isSaving && <Loading>Saving...</Loading>}
                    <AppButton format="close" onClick={onHide} disabled={isSaving}>Cancel</AppButton>
                    <AppButton format="save" type="submit" id={action} variant={(action=='approve'?'success':'danger')} disabled={isSaving}>{capitalize(action)}</AppButton>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
