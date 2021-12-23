import React, { useEffect, useCallback, useMemo, useReducer, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { useAdminQueries, useAppQueries } from "../../queries";
import { differenceWith, find, isEqual, pick, sortBy, orderBy, startsWith } from "lodash";
import { Alert, Button, Col, Container, Form, Modal, Row, Tab, Tabs } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DatePicker from "react-datepicker";
import { addDays, subDays, differenceInDays, format } from "date-fns";
import { Loading } from "../../blocks/components";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useHotkeys } from "react-hotkeys-hook";
import { useToasts } from "react-toast-notifications";
import { Icon } from "@iconify/react";

export default function AdminGroups2() {
    const [newGroup,setNewGroup] = useState(false);
    const [selectedGroup,setSelectedGroup] = useState('');

    const {getGroups,getUsers} = useAdminQueries();
    const groups = getGroups({enabled: (!selectedGroup&&!newGroup)});
    const users = getUsers({select:data=>sortBy(data.filter(u=>(u.active&&!!u.SUNY_ID)),['sortName'])});

    useHotkeys('alt+n',e=>{
        e.preventDefault();
        setNewGroup(true);
    });

    const closeModal = () => {
        setNewGroup(false);
        setSelectedGroup('');
    }

    return (
        <>
            <Row>
                <Col><h2>Admin: Groups <Button variant="success" onClick={()=>setNewGroup(true)}><Icon icon="mdi:account-multiple-plus"/>Add New</Button></h2></Col>
            </Row>
            <Row>
                <Col>
                    {groups.isLoading && <Loading type="alert">Loading Groups...</Loading>}
                    {groups.isError && <Loading type="alert" isError>Error Groups: <small>{groups.error?.name} {groups.error?.messsage}</small></Loading>}
                    {groups.isSuccess && <GroupsTable groups={groups.data} setSelectedGroup={setSelectedGroup}/>}
                    {(selectedGroup || newGroup) && groups.isSuccess && <AddEditGroup GROUP_ID={selectedGroup} newGroup={newGroup} closeModal={closeModal} users={users.data}/>}
                </Col>
            </Row>
        </>
    );
}

const GroupsTable = React.memo(({groups,setSelectedGroup}) => {
    const [sortField,setsortField] = useState('GROUP_NAME');
    const [sortDir,setSortDir] = useState('asc');
    const [filterText,setFilterText] = useState('');
    const [statusFilter,setStatusFilter] = useState('all');
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [rows,setRows] = useState([]);
    const [toggleGroup,setToggleGroup] = useState(undefined);
    const searchRef = useRef();

    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
    });

    const handleRowClick = useCallback(row=>{
        setSelectedGroup(row.GROUP_ID);
    },[]);

    const handleSort = useCallback((...args) => {
        if (!args[0].sortable) return false;
        const sortKey = columns[(args[0].id-1)].sortField;
        setsortField(sortKey);
        setSortDir(args[1]);
        setRows(orderBy(groups,[sortKey],[args[1]]));
    },[]);

    const filteredRows = rows.filter(row => {
        if (row.active && statusFilter == 'inactive') return false;
        if (!row.active && statusFilter == 'active') return false;
        return startsWith(row.GROUP_NAME.toLowerCase(),filterText.toLowerCase());
    });

    const toggle = useMemo(() => {
        if (!toggleGroup) return null;
        toggleGroup.END_DATE = (!toggleGroup.END_DATE)?format(new Date(),'dd-MMM-yy'):'';
        return <ToggleGroup group={toggleGroup} setToggleGroup={setToggleGroup}/>;
    },[toggleGroup]);

    const filterComponent = useMemo(() => {
        const statusChange = e => {
            setStatusFilter(e.target.value);
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
        return(
            <Form style={{flexDirection:'column'}} onSubmit={e=>e.preventDefault()}>
                <Form.Group as={Row} controlId="filter">
                    <Form.Label column sm="2">Search: </Form.Label>
                    <Col sm="10">
                        <Form.Control ref={searchRef} className="ml-2" type="search" placeholder="search..." onChange={handleFilterChange}/>
                    </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="status">
                    <Form.Label column sm="2" className="pt-0">Status:</Form.Label>
                    <Col sm="10">
                        <Form.Check className="ml-2" inline label="All" name="status" type="radio" id="status_all" value="all" checked={statusFilter=='all'} onChange={statusChange} />
                        <Form.Check inline label="Active" name="status" type="radio" id="status_active" value="active" checked={statusFilter=='active'} onChange={statusChange} />
                        <Form.Check inline label="Inactive" name="status" type="radio" id="status_inactive" value="inactive" checked={statusFilter=='inactive'} onChange={statusChange} />
                    </Col>
                </Form.Group>
            </Form>
        );
    },[filterText,statusFilter]);

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    {row.active && <Button variant="danger" className="no-label" size="sm" title="Deactivate Group" onClick={()=>setToggleGroup(row)}><Icon icon="mdi:account-multiple-remove"/></Button>}
                    {!row.active && <Button variant="success" className="no-label" size="sm" title="Restore Group" onClick={()=>setToggleGroup(row)}><Icon icon="mdi:account-multiple" /></Button>}
                </div>
            );
        },ignoreRowClick:true},
        {name:'Group Name',selector:row=>row.GROUP_NAME,sortable:true,sortField:'GROUP_NAME'},
        {name:'Start Date',selector:row=>row.startDateUnix,format:row=>row.startDateFmt,sortable:true,sortField:'startDateUnix'},
        {name:'End Date',selector:row=>row.endDateUnix,format:row=>row.endDateFmt,sortable:true,sortField:'endDateUnix'}
    ],[]);
    useEffect(()=>{
        setRows(orderBy(groups,[sortField],[sortDir]));
    },[groups]);
    return (
        <>
            <DataTable 
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
                defaultSortFieldId={2}
                onSort={handleSort}
                sortServer
            />
            {toggleGroup && toggle}
        </>
    );
});

function ToggleGroup({group,setToggleGroup}) {
    const queryclient = useQueryClient();
    const {addToast,removeToast} = useToasts();
    const {putGroup} = useAdminQueries();
    const updateGroup = putGroup(group.GROUP_ID);
    useEffect(() => {
        addToast(<><h5>Updating</h5><p>Updating group...</p></>,{appearance:'info',autoDismiss:false},id=>{
            updateGroup.mutateAsync({
                GROUP_ID:group.GROUP_ID,
                GROUP_NAME:group.GROUP_NAME,
                START_DATE:group.START_DATE,
                END_DATE:group.END_DATE
            }).then(() => {
                setToggleGroup('');
                queryclient.refetchQueries(['groups'],{exact:true,throwOnError:true}).then(() => {
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>Group updated successfully.</p></>,{appearance:'success'});    
                });
            });
        });
    },[]);
    return null;
};

const groupInfoReducer = (state,args)=>Object.assign({},state,args);

const userListReducer = (state,args) => {
    let available = [...state.available];
    let assigned = [...state.assigned];
    switch(args[0]) {
        case "init":
            available = args[1];
            assigned = args[2];
            state.original = args[2];
            break;
        case "add":
            assigned.splice(args[2],0,available[args[1]]);
            break;
        case "del":
            const grp = assigned.splice(args[1],1)[0];
            available.splice(args[2],0,grp);
            break;
        default:
            return state;
        
    }        
    const assignedUIDs = assigned.map(u=>u.SUNY_ID);
    const usrs = available.filter(u=>!assignedUIDs.includes(u.SUNY_ID));
    state.available = usrs.map((u,i)=>{u.idx=i;return u;});
    state.assigned = assigned.map((u,i)=>{u.idx=i;return u});
    return state;
}

function AddEditGroup({GROUP_ID,newGroup,closeModal,users}) {
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:!newGroup};

    const queryclient = useQueryClient();
    const { getGroupUsers,putGroup,postGroup } = useAdminQueries();
    const { addToast } = useToasts();
    const updateGroup = putGroup(GROUP_ID);
    const createGroup = postGroup();
    const groupusers = getGroupUsers(GROUP_ID,{
        enabled: false,
        select:data=>sortBy(data.filter(u=>u.active),['sortName']),
        onSuccess:d=>setUserLists(['init',users,d])
    });

    const group = find(queryclient.getQueryData('groups'),['GROUP_ID',GROUP_ID])||{GROUP_ID:'',GROUP_NAME:'',startDate:new Date(),endDate:'',origGroupName:''};
    const [groupInfo,setGroupInfo] = useReducer(groupInfoReducer,
        pick(group,['GROUP_ID','GROUP_NAME','startDate','endDate']));
    const [userLists,setUserLists] = useReducer(userListReducer,{assigned:[],available:[]});

    const [status,setStatus] = useReducer((state,args) => {
        let presets = {};
        switch(args.state) {
            case "error": presets = {icon:'exclamation-triangle',spin:false,save:false,cancel:true}; break;
            case "saving": presets = {message:'Saving...',icon:'circle-notch',spin:true,cancel:false,save:false}; break;
            case "loading": presets = {message:'Loading...',icon:null,spin:false,save:false}; break;
            case "clear": presets = defaultStatus; break;
        }
        return Object.assign({},state,presets,args);
    },defaultStatus);

    const saveGroup = () => {
        if (!groupInfo.startDate) {
            // should never get here, but just in case
            setStatus({state:'error',message:'Group must have a Start Date'});
            return false;
        }
        if (!groupInfo.GROUP_NAME) {
            // should never get here, but just in case
            setStatus({state:'error',message:'Group must have a Name'});
            return false;
        }
        const startDateChg = differenceInDays(groupInfo.startDate,group.startDate||new Date(0));
        let endDateChg = 0;
        if (groupInfo.endDate!=null&&group.endDate!=null) {
            endDateChg = differenceInDays(groupInfo.endDate,group.endDate);
        } else {
            endDateChg = (groupInfo.endDate==null&&group.endDate==null)?0:1;
        }
        //check users
        const addUsers = differenceWith(userLists.assigned,userLists.original,isEqual).map(u=>u.SUNY_ID);
        const delUsers = differenceWith(userLists.original,userLists.assigned,isEqual).map(u=>u.SUNY_ID);
        if (!startDateChg && !endDateChg && !addUsers.length && !delUsers.length && groupInfo.origGroupName == groupInfo.GROUP_NAME) {
            closeModal();
            return;
        }
        // now convert the start and end dates to string
        const data = {
            GROUP_ID:groupInfo.GROUP_ID,
            GROUP_NAME:groupInfo.GROUP_NAME,
            START_DATE:format(groupInfo.startDate,'dd-MMM-yyyy'),
            END_DATE:(!groupInfo.endDate)?'':format(groupInfo.endDate,'dd-MMM-yyyy'),
            ADD_USERS:addUsers,
            DEL_USERS:delUsers
        }
        setStatus({state:'saving'});
        if (newGroup) {
            createGroup.mutateAsync(data).then(() => {
                addToast(<><h5>Success!</h5><p>Group created successfully.</p></>,{appearance:'success'});
                //.then?
                queryclient.refetchQueries('groups',{exact:true,throwOnError:true});
                setStatus({state:'clear'});
                closeModal();
            }).catch(e => {
                setStatus({
                    state:'error',
                    message:e.description || `${e.name}: ${e.message}`
                });    
            });
        } else {
            updateGroup.mutateAsync(data).then(() => {
                addToast(<><h5>Success!</h5><p>Group updated successfully.</p></>,{appearance:'success'});
                Promise.all([
                    queryclient.refetchQueries('groups',{exact:true,throwOnError:true}),
                    queryclient.refetchQueries(['groupusers',GROUP_ID],{exact:true,throwOnError:true})
                ]).then(()=> {
                    setStatus({state:'clear'});
                    closeModal();    
                });
            }).catch(e => {
                setStatus({
                    state:'error',
                    message:e.description || `${e.name}: ${e.message}`
                });    
            });
        }
    }
    useEffect(() => {
        setGroupInfo({origGroupName:groupInfo.GROUP_NAME});
        groupusers.refetch();
    },[GROUP_ID]);
    useEffect(()=>{
        newGroup && setUserLists(['init',users,[]]);
    },[newGroup]);

    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{newGroup && `New `}Group</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                <AddEditGroupTabs groupInfo={groupInfo} setGroupInfo={setGroupInfo} userLists={userLists} setUserLists={setUserLists} setStatus={setStatus} newGroup={newGroup}/>
            </Modal.Body>
            <Modal.Footer>
                {status.state != 'error' && <p>{status.message}</p>}
                <Button variant="secondary" onClick={closeModal} disabled={!status.cancel}>Cancel</Button>
                <Button variant="danger" onClick={saveGroup} disabled={!status.save}>{status.icon && <FontAwesomeIcon icon={status.icon} spin={status.spin}/>} Save</Button>
            </Modal.Footer>
        </Modal>
    );
}

function AddEditGroupTabs({groupInfo,setGroupInfo,setStatus,newGroup,userLists,setUserLists}) {
    const [tab,setTab] = useState('info');
    return (    
        <Form>
            <Tabs id="group-tabs" activeKey={tab} onSelect={t=>setTab(t)}>
                <Tab eventKey="info" title="Info">
                    <Container className="p-2">
                        <GroupInfo groupInfo={groupInfo} setGroupInfo={setGroupInfo} newGroup={newGroup} setStatus={setStatus}/>
                    </Container>
                </Tab>
                <Tab eventKey="users" title="Users">
                    <Container className="p-2">
                        <GroupUsers userLists={userLists} setUserLists={setUserLists}/>
                    </Container>
                </Tab>
                <Tab eventKey="depts" title="Departments">
                    <Container className="p-2">
                        <Row>
                            <Col>Departments associated with group for submit routing</Col>
                        </Row>
                        <Row>
                            <GroupDepartments/>
                        </Row>
                    </Container>
                </Tab>
            </Tabs>
        </Form>
    );
}

function GroupInfo({groupInfo,setGroupInfo,newGroup,setStatus}) {
    const [groupName,setGroupName] = useState(groupInfo.GROUP_NAME);
    const [startDate,setStartDate] = useState(groupInfo.startDate);
    const [endDate,setEndDate] = useState(groupInfo.endDate);
    const ref = useRef();
    const queryclient = useQueryClient();
    const formValidation = (...args) => {
        const gName = (args[0]=='groupName')?args[1]:groupName;
        const sDate = (args[0]=='startDate')?args[1]:startDate;
        if (!gName) {
            setStatus({state:'error',message:'Group name cannot be empty',save:false});
            return false;
        }
        if (!sDate) {
            setStatus({state:'error',message:'Start Date cannot be empty',save:false});
            return false;
        }
        setStatus({state:'clear',save:true});
        return true;
    }
    const handleNameChange = e => {
        const val = e.target.value;
        setGroupName(val);
        formValidation('groupName',val);
    }
    const handleNameBlur = () => {
        if (!formValidation()) return false;
        if (groupName != groupInfo.origGroupName) {
            if(find(queryclient.getQueryData('groups'),{GROUP_NAME:groupName})) {
                setStatus({state:'error',save:false,message:'Group Name already exists.'});
                return false;
            }
        }
        setGroupInfo({GROUP_NAME:groupName});
    }
    const handleDateChange = (...args) => {
        switch(args[0]) {
            case "start":
                setStartDate(args[1]);
                setGroupInfo({startDate:args[1]});
                formValidation('startDate',args[1]);
                break;
            case "end":
                setEndDate(args[1]);
                setGroupInfo({endDate:args[1]});
                break;
        }
    }
    useEffect(()=>ref.current.focus(),[]);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="group_id">
                    <Form.Label>Group ID</Form.Label>
                    <Form.Control type="text" value={groupInfo.GROUP_ID} disabled/>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="group_name">
                    <Form.Label>Group Name</Form.Label>
                    <Form.Control ref={ref} placeholder="Group Name" value={groupName} onChange={handleNameChange} onBlur={handleNameBlur}/>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="start_date">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control as={DatePicker} selected={startDate} maxDate={endDate && subDays(endDate,1)} onChange={d=>handleDateChange('start',d)} placeholderText="mm/dd/yyyy"/>
                </Form.Group>
                <Form.Group as={Col} controlId="end_date">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control as={DatePicker} selected={endDate} minDate={startDate && addDays(startDate,1)} onChange={d=>handleDateChange('end',d)} placeholderText="mm/dd/yyyy" disabled={!startDate}/>
                </Form.Group>
            </Form.Row>
        </>
    );
}

function GroupUsers({userLists,setUserLists}) {
    return (
        <div className="drag-col-2">
            <div className="dlh1">Unassigned Users</div>
            <div className="dlh2">Assigned Users</div>
            <GroupUsersList userLists={userLists} setUserLists={setUserLists}/>
        </div>
    );
}

function GroupUsersList({userLists,setUserLists}) {
    const [value,setValue] = useState(0);//used to force rerender on dblClick
    const onDragEnd = ({source,destination}) => {
        if (!source || !destination) return; //something happened - we need both
        if (source.droppableId == destination.droppableId) return;
        setUserLists([(destination.droppableId == 'assigned')?'add':'del',source.index,destination.index]);
    }
    const handleDblClick = useCallback(e => {
        const {userlist,idx} = e.target.dataset;
        onDragEnd({
            source:{droppableId:userlist,index:idx},
            destination:{droppableId:(userlist=='available'?'assigned':'available'),index:0}
        });
        setValue(value=>value+1);
    },[]);
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl1 ${snapshot.isDraggingOver?'over':''}`}>
                        {userLists.available.map(u => {
                            return (
                                <Draggable key={u.SUNY_ID} draggableId={u.SUNY_ID} index={u.idx}>
                                    {(provided,snapshot) => (
                                        <div 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            {...provided.dragHandleProps}
                                            className={snapshot.isDragging?'dragging':''}
                                            onDoubleClick={handleDblClick}
                                            data-userlist="available" data-idx={u.idx}
                                        >
                                            {u.sortName}
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            <Droppable droppableId="assigned">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl2 ${snapshot.isDraggingOver?'over':''}`}>
                        {userLists.assigned.map(u => (
                            <Draggable key={u.SUNY_ID} draggableId={u.SUNY_ID} index={u.idx}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-userlist="assigned" data-idx={u.idx}
                                    >
                                        {u.sortName}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}

function GroupDepartments() {
    return (
        <div className="drag-col-2">
            <div className="dlh1">Unassigned Departments</div>
            <div className="dlh2">Assigned Departments</div>
        </div>
    );
}
