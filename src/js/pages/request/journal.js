import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useHistory, Link, Redirect } from "react-router-dom";
import useRequestQueries from "../../queries/requests";
import { Row, Col, Form, Button, Popover, OverlayTrigger, Tooltip } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { get, sortBy } from "lodash";
import useGroupQueries from "../../queries/groups";
import { useAuthContext, useSettingsContext } from "../../app";
import { useHotkeys } from "react-hotkeys-hook";
import { AppButton, Loading } from "../../blocks/components";

export default function RequestJournal() {
    const {id} = useParams();
    const history = useHistory();

    const [reqId,setReqId] = useState((!!id)?id:'');
    const [showResults,setShowResults] = useState(!!id);
    const [expandAll,setExpandAll] = useState(false);
    const [showReturn,setShowReturn] = useState(false);
    const [redirect,setRedirect] = useState('');

    const searchRef = useRef();
    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
    });
    useHotkeys('ctrl+alt+e',()=>{
        setExpandAll(!expandAll);
    },{enableOnTags:['INPUT']},[expandAll]);

    const handleChange = e => {
        setShowResults(false);
        setReqId(e.target.value);
    }
    const handleClear = () => {
        setShowResults(false);
        setShowReturn(false);
        setReqId('');
        history.push('/request/journal/');
    }
    const handleKeyDown = e => e.key == 'Escape' && handleClear();
    const handleSubmit = e => {
        e.preventDefault();
        history.push('/request/journal/'+reqId);
        setShowResults(true);
    }
    const handleReturnToList = () => setRedirect(get(history.location,'state.from',''));
    useEffect(()=>setShowReturn(get(history.location,'state.from','').startsWith('/request/list')),[history]);
    useEffect(()=>searchRef.current.focus(),[]);
    if (redirect) return <Redirect to={redirect}/>;
    return (
        <>
            <Row>
                <Col><h2>Request Journal {showReturn && <AppButton format="previous" onClick={handleReturnToList}>Return to List</AppButton>}</h2></Col>
            </Row>
            <Form inline onSubmit={handleSubmit}>
                <Form.Label className="my-1 mr-2" htmlFor="journalReqIdSearch" >Request ID:</Form.Label>
                <Form.Control ref={searchRef} className="mb-2 mr-sm-2" id="journalReqIdSearch" value={reqId} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Enter a Request ID" autoFocus/>
                <AppButton format="search" type="submit" className="mb-2 mr-2">Search</AppButton>
                <AppButton format="clear" onClick={handleClear} className="mb-2">Clear</AppButton>
            </Form>
            {(showResults && reqId) && <JournalSearchResults reqId={reqId} expandAll={expandAll} setExpandAll={setExpandAll} setRedirect={setRedirect}/>}
        </>
    );
}

function JournalSearchResults({reqId,expandAll,setExpandAll,setRedirect}) {
    const { general } = useSettingsContext();
    const { getRequest, getJournal } = useRequestQueries(reqId);
    const reqData = getRequest();
    const journal = getJournal();

    const expandToggleComponent = useMemo(() => {
        const expandText = ((expandAll)?'Collapse':'Expand') + ' All';
        let r = '';
        if (reqData.data?.lastJournal?.STATUS == 'Z') {
            r = `/request/archive/${reqId}`;
        } else {
            r = `/request/${reqId}`;
        }
        return(
            <>
                <Col className="pl-0">
                    <Form.Check type="switch" id="toggle-expand" label={expandText} onChange={()=>setExpandAll(!expandAll)} checked={expandAll}/>
                </Col>
                {r && 
                    <Col className="d-flex justify-content-end pr-0">
                        <AppButton format="view" onClick={()=>setRedirect(r)}>View Request</AppButton>
                    </Col>
                }
            </>
        );
    },[expandAll,reqData,reqId]);

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
            title={`Journal Report for Request ID: ${reqId}`}
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
            noDataComponent={<p className="m-3">No Request Journal Found Matching Your Criteria</p>}
        />
    );
}

function ExpandedComponent({data}) {
    //TODO: Consolidate with list flow?
    const { isAdmin } = useAuthContext();
    const { general } = useSettingsContext();
    const clickHander = e => !isAdmin && e.preventDefault();
    return (
        <div className="p-3" style={{backgroundColor:'#ddd'}}>
            <dl className="journal-list" style={{'display':'grid','gridTemplateColumns':'120px auto'}}>
                <dt>Request ID:</dt>
                <dd>{data.REQUEST_ID}</dd>
                <dt>Sequence:</dt>
                <dd>{data.SEQUENCE}</dd>
                <dt>Date:</dt>
                <dd>{data.journalDateFmt}</dd>
                <dt>Status:</dt>
                <dd>{get(general.status,`${data.STATUS}.list`,'Unknown')} ({data.STATUS})</dd>
                {data.GROUP_FROM &&
                    <>
                        <dt>Group From:</dt>
                        <dd>
                            <OverlayTrigger placement="right" delay={{show:500,hide:500}} overlay={<GroupPopover sequence={data.SEQUENCE} groupId={data.GROUP_FROM} groupName={data.GROUP_FROM_NAME}/>}>
                                <Link onClick={clickHander} to={`/admin/groups/${data.GROUP_FROM}`}>
                                    {data.GROUP_FROM_NAME} ({data.GROUP_FROM})
                                </Link>
                            </OverlayTrigger>
                        </dd>
                    </>
                }
                {data.GROUP_TO && 
                    <>
                        <dt>Group To:</dt>
                        <dd>
                                <OverlayTrigger placement="right" delay={{show:500,hide:500}} overlay={<GroupPopover sequence={data.SEQUENCE} groupId={data.GROUP_TO} groupName={data.GROUP_TO_NAME}/>}>
                                    <Link onClick={clickHander} to={`/admin/groups/${data.GROUP_TO}`}>{data.GROUP_TO_NAME} ({data.GROUP_TO})</Link>
                                </OverlayTrigger>
                        </dd>
                    </>
                }
                <dt>Updated By:</dt>
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