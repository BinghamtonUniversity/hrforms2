import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useHistory, Link, Redirect } from "react-router-dom";
import useFormQueries from "../../queries/forms";
import { Row, Col, Form, Button, Popover, OverlayTrigger, Tooltip } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { get, sortBy } from "lodash";
import useGroupQueries from "../../queries/groups";
import { useAuthContext, useSettingsContext } from "../../app";
import { useHotkeys } from "react-hotkeys-hook";
import { AppButton, Loading } from "../../blocks/components";
import { t } from "../../config/text";

export default function FormJournal() {
    const {id} = useParams();
    const history = useHistory();

    const [formId,setFormId] = useState((!!id)?id:'');
    const [showResults,setShowResults] = useState(!!id);
    const [expandAll,setExpandAll] = useState(false);
    const [showReturn,setShowReturn] = useState(false);
    const [redirect,setRedirect] = useState('');

    const searchRef = useRef();
    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
    });
    useHotkeys('ctrl+alt+e',()=>setExpandAll(!expandAll),{
        enableOnTags:['INPUT']
    },[expandAll]);

    const handleChange = e => {
        setShowResults(false);
        setFormId(e.target.value);
    }
    const handleClear = () => {
        setShowResults(false);
        setShowReturn(false);
        setFormId('');
        history.push('/form/journal/');
    }
    const handleKeyDown = e => e.key == 'Escape' && handleClear();
    const handleSubmit = e => {
        e.preventDefault();
        history.push('/form/journal/'+formId);
        setShowResults(true);
    }
    const handleReturnToList = () => setRedirect(get(history.location,'state.from',''));
    useEffect(()=>setShowReturn(get(history.location,'state.from','').startsWith('/form/list')),[history]);
    useEffect(()=>searchRef.current.focus(),[]);
    if (redirect) return <Redirect to={redirect}/>;
    return (
        <>
            <Row>
                <Col>
                    {showReturn && <AppButton size="sm" format="previous" onClick={handleReturnToList}>{t('form.journal.return')}</AppButton>}
                    <h2>{t('form.journal.title')}</h2>
                </Col>
            </Row>
            <Form inline onSubmit={handleSubmit}>
                <Form.Label className="my-1 mr-2" htmlFor="journalFormIdSearch" >Form ID:</Form.Label>
                <Form.Control ref={searchRef} className="mb-2 mr-sm-2" id="journalFormIdSearch" value={formId} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Enter a Form ID" autoFocus/>
                <AppButton format="search" type="submit" className="mb-2 mr-2">Search</AppButton>
                <AppButton format="clear" onClick={handleClear} className="mb-2">Clear</AppButton>
            </Form>
            {(showResults && formId) && <JournalSearchResults formId={formId} expandAll={expandAll} setExpandAll={setExpandAll} setRedirect={setRedirect}/>}
        </>
    );
}

function JournalSearchResults({formId,expandAll,setExpandAll,setRedirect}) {
    const { general } = useSettingsContext();
    const { getForm, getJournal } = useFormQueries(formId);
    const journal = getJournal();
    const formData = getForm();

    const expandToggleComponent = useMemo(() => {
        const expandText = ((expandAll)?'Collapse':'Expand') + ' All';
        let r = '';
        if (formData.data?.lastJournal?.STATUS == 'Z') {
            r = `/form/archive/${formId}`;
        } else {
            r = `/form/${formId}`;
        }
        return(
            <>
                <Col className="pl-0">
                    <Form.Check type="switch" id="toggle-expand" label={expandText} onChange={()=>setExpandAll(!expandAll)} checked={expandAll}/>
                </Col>
                {r && 
                    <Col className="d-flex justify-content-end pr-0">
                        <AppButton format="view" onClick={()=>setRedirect(r)}>View Form</AppButton>
                    </Col>
                }
            </>
        );
    },[expandAll,formData,formId]);

    const columns = useMemo(() => [
        {name:'Sequence',selector:row=>row.SEQUENCE,sortable:true,width:'120px'},
        {name:'Date',selector:row=>row.journalDateFmt,sortable:true,width:'250px'},
        {name:'Status',selector:row=>(
            <OverlayTrigger placement="auto" overlay={
                <Tooltip id={`tooltip-status-${row.SEQUENCE}`}>{get(general.status,`${row.STATUS}.list`,'Unknown')}</Tooltip>
            }><span>{row.STATUS}</span></OverlayTrigger>
        ),width:'100px'},
        {name:'Comment',selector:row=>row.shortComment,sortable:false,wrap:true}
    ],[general]);

    if (journal.isError) return <Loading type="alert" isError>{journal.error.description}</Loading>
    return (
        <DataTable 
            keyField="SEQUENCE"
            title={`Journal Report for Form ID: ${formId}`}
            subHeader
            subHeaderComponent={expandToggleComponent}
            columns={columns} 
            data={journal.data}
            progressPending={journal.isLoading}
            striped 
            responsive
            pointerOnHover
            highlightOnHover
            expandableRows 
            expandOnRowClicked
            expandableRowsComponent={ExpandedComponent}
            expandableRowExpanded={()=>expandAll}
            noDataComponent={<p className="m-3">No Form Journal Found Matching Your Criteria</p>}
        />
    );
}

function ExpandedComponent({data}) {
    //TODO: Consolidate with list flow?
    const {isAdmin} = useAuthContext();
    const {general} = useSettingsContext();
    const clickHander = e => !isAdmin && e.preventDefault();
    return (
        <div className="p-3" style={{backgroundColor:'#ddd'}}>
            <dl className="journal-list" style={{'display':'grid','gridTemplateColumns':'120px auto'}}>
                <dt>Form ID:</dt>
                <dd>{data.FORM_ID}</dd>
                <dt>Sequence:</dt>
                <dd>{data.SEQUENCE}</dd>
                <dt>Date:</dt>
                <dd>{data.journalDateFmt}</dd>
                <dt>Status:</dt>
                <dd>{get(general.status,`${data.STATUS}.list`,'Unknown')}</dd>
                {(data.GROUP_FROM && data.STATUS!='S') &&
                    <>
                        <dt>Group From:</dt>
                        <dd>
                            {(data.GROUP_FROM == '-99')?
                                <>{data.GROUP_FROM_NAME} ({data.GROUP_FROM})</>:
                                <OverlayTrigger placement="right" delay={{show:500,hide:500}} overlay={<GroupPopover sequence={data.SEQUENCE} groupId={data.GROUP_FROM} groupName={data.GROUP_FROM_NAME}/>}>
                                    <Link onClick={clickHander} to={`/admin/groups/${data.GROUP_FROM}`}>{data.GROUP_FROM_NAME} ({data.GROUP_FROM})</Link>
                                </OverlayTrigger>
                            }
                        </dd>
                    </>
                }
                {(data.GROUP_TO && data.STATUS!='S') && 
                    <>
                        <dt>Group To:</dt>
                        <dd>
                                <OverlayTrigger placement="right" delay={{show:500,hide:500}} overlay={<GroupPopover sequence={data.SEQUENCE} groupId={data.GROUP_TO} groupName={data.GROUP_TO_NAME}/>}>
                                    <Link onClick={clickHander} to={`/admin/groups/${data.GROUP_TO}`}>{data.GROUP_TO_NAME} ({data.GROUP_TO})</Link>
                                </OverlayTrigger>
                        </dd>
                    </>
                }
                <dt>{(data.STATUS=='S')?'Submitted':'Updated'} By:</dt>
                <dd>{data.fullName}</dd>
                <dt>Comment:</dt>
                <dd><pre>{data.COMMENTS}</pre></dd>
            </dl>
        </div>
    );
}

const GroupPopover = React.forwardRef(({sequence,groupId,groupName,popper,children,show:_,...props},ref) => {
    const {getGroupUsers} = useGroupQueries(groupId);
    const groupusers = getGroupUsers({select:d=>{
        return(sortBy(d,['sortName']));
    }});
    return (
        <Popover ref={ref} {...props}>
            <Popover.Title>Members of {groupName} ({groupId})</Popover.Title>
            <Popover.Content>
                {groupusers.isLoading && <p>Loading Users...</p>}
                {groupusers.data && groupusers.data.map(u=><p key={u.SUNY_ID} className="mb-1 pl-1">{u.sortName}</p>)}
            </Popover.Content>
        </Popover>
    );
});