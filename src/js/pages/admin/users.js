import React, { useEffect, useCallback, useMemo, useReducer, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { useAdminQueries, useUserQueries } from "../../queries";
import { differenceWith, find, isEqual, pick, sortBy, orderBy } from "lodash";
import { Alert, Button, Col, Container, Form, InputGroup, Modal, Row, Tab, Tabs } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DatePicker from "react-datepicker";
import { addDays, subDays, differenceInDays, format } from "date-fns";
import { Loading } from "../../blocks/components";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useHotkeys } from "react-hotkeys-hook";
import { useToasts } from "react-toast-notifications";

export default function AdminUsers() {
    const [newUser,setNewUser] = useState(false);
    const [selectedUser,setSelectedUser] = useState('');

    const {getUsers,getGroups} = useAdminQueries();
    const users = getUsers({enabled:(!selectedUser&&!newUser)});
    const groups = getGroups({select:data=>sortBy(data.filter(g=>g.active),['GROUP_NAME'])});

    useHotkeys('alt+n',e=>{
        e.preventDefault();
        setNewUser(true);
    });

    const closeModal = () => {
        setNewUser(false);
        setSelectedUser('');
    }

    return (
        <>
            <Row>
                <Col><h2>Admin: Users <Button variant="success" onClick={()=>setNewUser(true)}>Add New</Button></h2></Col>
            </Row>
            <Row>
                <Col>
                    {users.isLoading && <Loading type="alert">Loading Users...</Loading>}
                    {users.isError && <Loading type="alert" isError>Error Users: <small>{users.error?.name} {users.error?.messsage}</small></Loading>}
                    {users.isSuccess && <UsersTable users={users.data} setSelectedUser={setSelectedUser}/>}
                    {(selectedUser || newUser) && groups.isSuccess && <AddEditUser SUNY_ID={selectedUser} newUser={newUser} closeModal={closeModal} groups={groups.data}/>}
                </Col>
            </Row>
        </>
    );
}

const UsersTable = React.memo(({users,setSelectedUser}) => {
    const [sortField,setsortField] = useState('sortName');
    const [sortDir,setSortDir] = useState('asc');
    const [filterText,setFilterText] = useState('');
    const [statusFilter,setStatusFilter] = useState('all');
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [rows,setRows] = useState([]);
    const [toggleUser,setToggleUser] = useState(undefined);
    const searchRef = useRef();

    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
    });

    const handleRowClick = useCallback(row=>{
        setSelectedUser(row.SUNY_ID);
    },[]);

    const handleSort = useCallback((...args) => {
        if (!args[0].sortable) return false;
        const sortKey = columns[(args[0].id-1)].sortField;
        setsortField(sortKey);
        setSortDir(args[1]);
        setRows(orderBy(users,[sortKey],[args[1]]));
    },[]);

    const filteredRows = rows.filter(row => {
        if (row.active && statusFilter == 'inactive') return false;
        if (!row.active && statusFilter == 'active') return false;
        const fName = row.LEGAL_FIRST_NAME && row.LEGAL_FIRST_NAME.toLowerCase();
        const lName = row.LEGAL_LAST_NAME && row.LEGAL_LAST_NAME.toLowerCase();
        const filterFields = `${row.USER_SUNY_ID} ${fName} ${lName} ${row.email} ${row.startDateFmt} ${row.endDateFmt}`
        return filterFields.includes(filterText.toLowerCase());    
    });

    const toggle = useMemo(() => {
        if (!toggleUser) return null;
        toggleUser.END_DATE = (!toggleUser.END_DATE)?format(new Date(),'dd-MMM-yy'):'';
        return <ToggleUser user={toggleUser} setToggleUser={setToggleUser}/>;
    },[toggleUser]);

    const doImpersonate = SUNY_ID => {
        console.log('do impersonate...',SUNY_ID);
    }

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
                    {row.SUNY_ID && <Button variant="primary" size="sm" title="Impersonate User" onClick={()=>doImpersonate(row.USER_SUNY_ID)} disabled={!row.active}><FontAwesomeIcon icon="people-arrows" title="Impersonate"/></Button>}
                    {(row.SUNY_ID && row.active) && <Button variant="danger" size="sm" title="Deactivate User" onClick={()=>setToggleUser(row)}><FontAwesomeIcon icon="user-slash"/></Button>}
                    {(row.SUNY_ID && !row.active) && <Button variant="success" size="sm" title="Restore User" onClick={()=>setToggleUser(row)}><FontAwesomeIcon icon="user"/></Button>}
                    {!row.SUNY_ID && <Button variant="danger" size="sm"><FontAwesomeIcon icon="trash" title="Delete User"/></Button>}
                </div>
            );
        },ignoreRowClick:true},
        {name:'SUNY ID',selector:row=>row.USER_SUNY_ID,sortable:true,sortField:'USER_SUNY_ID'},
        {name:'Name',selector:row=>row.sortName,sortable:true,sortField:'sortName'},
        {name:'Email',selector:row=>row.email,sortable:true,sortField:'email'},
        {name:'Start Date',selector:row=>row.startDateUnix,format:row=>row.startDateFmt,sortable:true,sortField:'startDateUnix'},
        {name:'End Date',selector:row=>row.endDateUnix,format:row=>row.endDateFmt,sortable:true,sortField:'endDateUnix'}
    ],[]);
    useEffect(()=>{
        setRows(orderBy(users,[sortField],[sortDir]));
    },[users]);
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
                defaultSortFieldId={3}
                onSort={handleSort}
                sortServer
            />
            {toggleUser && toggle}
        </>
    );
});

function ToggleUser({user,setToggleUser}) {
    const queryclient = useQueryClient();
    const {addToast,removeToast} = useToasts();
    const {putUser} = useAdminQueries();
    const updateUser = putUser(user.SUNY_ID);
    useEffect(() => {
        addToast(<><h5>Updating</h5><p>Updating user...</p></>,{appearance:'info',autoDismiss:false},id=>{
            updateUser.mutateAsync({
                SUNY_ID:user.SUNY_ID,
                START_DATE:user.START_DATE,
                END_DATE:user.END_DATE
            }).then(d => {
                setToggleUser(undefined);
                queryclient.refetchQueries(['users'],{exact:true,throwOnError:true}).then(() => {
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>User updated successfully.</p></>,{appearance:'success'});    
                });
            });
        });
    },[]);
    return null;
}

function ImpersonateUser({SUNY_ID}) {
    //do shit
    return null;
}

const userInfoReducer = (state,args)=>Object.assign({},state,args);

const groupListReducer = (state,args) => {
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
    const assignedGIDs = assigned.map(g=>g.GROUP_ID);
    const grps = available.filter(g=>!assignedGIDs.includes(g.GROUP_ID));
    state.available = grps.map((g,i)=>{g.idx=i;return g;});
    state.assigned = assigned.map((g,i)=>{g.idx=i;return g});
    return state;
}

function AddEditUser({SUNY_ID,newUser,closeModal,groups}) {
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:!newUser};

    const queryclient = useQueryClient();
    const {getUserGroups} = useUserQueries(SUNY_ID);
    const {putUser,postUser} = useAdminQueries();
    const { addToast } = useToasts();
    const updateUser = putUser(SUNY_ID);
    const createUser = postUser();
    const usergroups = getUserGroups({
        enabled: false,
        select:data=>sortBy(data.filter(g=>g.active),['GROUP_NAME']),
        onSuccess:d=>setGroupLists(['init',groups,d])
    });

    const user = find(queryclient.getQueryData('users'),['SUNY_ID',SUNY_ID])||{SUNY_ID:'',LEGAL_FIRST_NAME:'',LEGAL_LAST_NAME:'',email:'',startDate:new Date(),endDate:''};
    const [userInfo,setUserInfo] = useReducer(userInfoReducer,
        pick(user,['SUNY_ID','LEGAL_FIRST_NAME','LEGAL_LAST_NAME','email','startDate','endDate']));
    const [groupLists,setGroupLists] = useReducer(groupListReducer,{assigned:[],available:[]});
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

    const saveUser = () => {
        if (!userInfo.startDate) {
            // should never get here, but just in case
            setStatus({state:'error',message:'User must have a Start Date'});
            return false;
        }
        const startDateChg = differenceInDays(userInfo.startDate,user.startDate||new Date(0));
        let endDateChg = 0;
        if (userInfo.endDate!=null&&user.endDate!=null) {
            endDateChg = differenceInDays(userInfo.endDate,user.endDate);
        } else {
            endDateChg = (userInfo.endDate==null&&user.endDate==null)?0:1;
        }
        //check groups
        const addGroups = differenceWith(groupLists.assigned,groupLists.original,isEqual).map(g=>g.GROUP_ID);
        const delGroups = differenceWith(groupLists.original,groupLists.assigned,isEqual).map(g=>g.GROUP_ID);
        if (!startDateChg && !endDateChg && !addGroups.length && !delGroups.length) {
            closeModal();
            return;
        }
        // now convert the start and end dates to string
        const data = {
            SUNY_ID:userInfo.SUNY_ID,
            START_DATE:format(userInfo.startDate,'dd-MMM-yyyy'),
            END_DATE:(!userInfo.endDate)?'':format(userInfo.endDate,'dd-MMM-yyyy'),
            ADD_GROUPS:addGroups,
            DEL_GROUPS:delGroups
        }
        setStatus({state:'saving'});
        if (newUser) {
            createUser.mutateAsync(data).then(() => {
                addToast(<><h5>Success!</h5><p>User created successfully.</p></>,{appearance:'success'});
                queryclient.refetchQueries('users',{exact:true,throwOnError:true});
                setStatus({state:'clear'});
                closeModal();
            }).catch(e => {
                setStatus({
                    state:'error',
                    message:e.description || `${e.name}: ${e.message}`
                });    
            });
        } else {
            updateUser.mutateAsync(data).then(() => {
                addToast(<><h5>Success!</h5><p>User updated successfully.</p></>,{appearance:'success'});
                queryclient.refetchQueries(['usergroups',SUNY_ID],{exact:true,throwOnError:true});
                setStatus({state:'clear'});
                closeModal();
            }).catch(e => {
                setStatus({
                    state:'error',
                    message:e.description || `${e.name}: ${e.message}`
                });    
            });
        }
    }
    useEffect(()=>usergroups.refetch(),[SUNY_ID]);
    useEffect(()=>{
        newUser && setGroupLists(['init',groups,[]]);
    },[newUser]);
    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{newUser && `New `}User</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                {(usergroups.isLoading||usergroups.isIdle)&&<Loading type="alert">Loading User Information...</Loading>}
                {usergroups.isError&&<Loading type="alert" isError>Error loading user information: <small>{usergroups.error?.status} - {usergroups.error?.name}</small></Loading>}
                {usergroups.data && <AddEditUserTabs userInfo={userInfo} setUserInfo={setUserInfo} groupLists={groupLists} setGroupLists={setGroupLists} setStatus={setStatus} newUser={newUser}/>}
            </Modal.Body>
            <Modal.Footer>
                {status.state != 'error' && <p>{status.message}</p>}
                <Button variant="secondary" onClick={closeModal} disabled={!status.cancel}>Cancel</Button>
                <Button variant="danger" onClick={saveUser} disabled={!status.save}>{status.icon && <FontAwesomeIcon icon={status.icon} spin={status.spin}/>} Save</Button>
            </Modal.Footer>
        </Modal>
    );
}

function AddEditUserTabs({userInfo,setUserInfo,groupLists,setGroupLists,setStatus,newUser}) {
    const [tab,setTab] = useState('info');
    return (    
        <Form>
            <Tabs id="user-tabs" activeKey={tab} onSelect={t=>setTab(t)}>
                <Tab eventKey="info" title="Info">
                    <Container className="p-2">
                        <UserInfo userInfo={userInfo} setUserInfo={setUserInfo} newUser={newUser} setStatus={setStatus}/>
                    </Container>
                </Tab>
                <Tab eventKey="groups" title="Groups">
                    <Container className="p-2">
                        <UserGroups groupLists={groupLists} setGroupLists={setGroupLists} newUser={newUser}/>
                    </Container>
                </Tab>
            </Tabs>
        </Form>
    );
}


function UserInfo({userInfo,setUserInfo,newUser,setStatus}) {
    const ref = useRef();
    const [lookupId,setLookupId] = useState('');
    const [startDate,setStartDate] = useState(userInfo.startDate);
    const [endDate,setEndDate] = useState(userInfo.endDate);
    const lookupStateDefault = {
        state:'',
        icon:'search',
        variant:'secondary',
        spin:false,
        message:''
    };
    const [lookupState,setLookupState] = useReducer((state,action) => {
        switch(action) {
            case 'invalid':
                return {state:'invalid',icon:'exclamation-triangle',variant:'danger',spin:false,message:'Invalid SUNY ID'};
            case 'valid':
                return {state:'valid',icon:'check',variant:'success',spin:false,message:''};
            case 'search':
                return {state:'search',icon:'circle-notch',variant:'secondary',spin:true,message:''};
            case 'error':
                return {state:'invalid',icon:'exclamation-triangle',variant:'danger',spin:false,message:'Error'};
            default:
                return lookupStateDefault;
        }
    },lookupStateDefault);

    const queryclient = useQueryClient();
    const handleKeyDown = e => {
        if (e.which == 13) {
            e.preventDefault();
            handleLookup();
            return true;
        }
        if (e.which == 27) {
            if (lookupId == '') return true; //if the SUNY ID field is empty allow the ESC to propagate and close the modal
            e.preventDefault();
            e.stopPropagation();
            setLookupId('');
            setLookupState('reset');
            setStatus({state:'clear'});
            setUserInfo({
                SUNY_ID:'',
                LEGAL_FIRST_NAME:'',
                LEGAL_LAST_NAME:'',
                email:'',
                startDate: null,
                endDate: null
            });
        }
    }
    const handleLookup = () => {
        if (!lookupId) return;
        //is sunyid already in the users list?
        const userExists = queryclient.getQueryData(['users']).filter(u=>u.SUNY_ID==lookupId).length;
        if (userExists) {
            setLookupState('invalid');
            setStatus({state:'error',message:'SUNY ID already exists as user'});
            return;
        }
        setLookupState('search');
        fetch(`api/api.php/user/${lookupId}`).then(r=>{
            if (!r.ok) throw Error(`${r.status} - ${r.statusText}`);
            return r.json();
        }).then(d=>{
            if (!d.length) {
                setLookupState('invalid');
                setStatus({state:'error',message:'Invalid SUNY ID'});
            } else {
                const now = new Date();
                setLookupState('valid');
                setUserInfo({
                    SUNY_ID:d[0].SUNY_ID,
                    LEGAL_FIRST_NAME:d[0].LEGAL_FIRST_NAME,
                    LEGAL_LAST_NAME:d[0].LEGAL_LAST_NAME,
                    email:(d[0].EMAIL_ADDRESS_WORK && d[0].EMAIL_ADDRESS_WORK.toLowerCase())||'',
                    startDate:now,
                    endDate:null
                });
                setStartDate(now);
                setStatus({state:'clear',save:true});
            }
        }).catch(e => {
            console.error('Error fetching user by SUNY ID: ',e);
            setLookupState('error');
            setStatus({state:'error',message:e?.message});
        });
    }
    const handleDateChange = (...args) => {
        switch(args[0]) {
            case "start":
                setStartDate(args[1]);
                setUserInfo({startDate:args[1]});
                setStatus({save:!!args[1]});
                break;
            case "end":
                setEndDate(args[1]);
                setUserInfo({endDate:args[1]});
                break;
        }
    }
    useEffect(() => {
        newUser && ref.current.focus();
    },[]);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="suny_id">
                    <Form.Label>SUNY ID</Form.Label>
                    {newUser?
                        <InputGroup hasValidation className="mb-3">
                            <Form.Control ref={ref} placeholder="Search for SUNY ID" aria-label="Search for SUNY ID" aria-describedby="basic-addon" value={lookupId} onChange={e=>setLookupId(e.target.value)} onKeyDown={handleKeyDown}/>
                            <InputGroup.Append>
                                <Button variant={lookupState.variant} title="Search" onClick={handleLookup} disabled={!lookupId}><FontAwesomeIcon icon={lookupState.icon} spin={lookupState.spin}/></Button>
                            </InputGroup.Append>
                            <Form.Control.Feedback type="invalid">{lookupState.message}</Form.Control.Feedback>
                        </InputGroup>
                    :
                        <Form.Control type="text" placeholder="SUNY ID" value={userInfo.SUNY_ID} disabled/>
                    }
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="first_name">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control placeholder="First Name" value={userInfo.LEGAL_FIRST_NAME} disabled/>
                </Form.Group>
                <Form.Group as={Col} controlId="last_name">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control placeholder="Last Name" value={userInfo.LEGAL_LAST_NAME} disabled/>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={userInfo.email} disabled/>
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

function UserGroups({groupLists,setGroupLists,newUser}) {
    return (
        <div className="drag-col-2">
            <div className="dlh1">Unassigned Groups</div>
            <div className="dlh2">Assigned Groups</div>
            <UserGroupsList groupLists={groupLists} setGroupLists={setGroupLists}/>
        </div>
    );
}

function UserGroupsList({groupLists,setGroupLists}) {
    const [value,setValue] = useState(0);//used to force rerender on dblClick
    const onDragEnd = ({source,destination}) => {
        if (!source || !destination) return; //something happened - we need both
        if (source.droppableId == destination.droppableId) return;
        setGroupLists([(destination.droppableId == 'assigned')?'add':'del',source.index,destination.index]);
    }
    const handleDblClick = useCallback(e => {
        const {grouplist,idx} = e.target.dataset;
        onDragEnd({
            source:{droppableId:grouplist,index:idx},
            destination:{droppableId:(grouplist=='available'?'assigned':'available'),index:0}
        });
        setValue(value=>value+1);
    },[]);
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl1 ${snapshot.isDraggingOver?'over':''}`}>
                        {groupLists.available.map(g => {
                            return (
                                <Draggable key={g.GROUP_ID} draggableId={g.GROUP_ID} index={g.idx}>
                                    {(provided,snapshot) => (
                                        <div 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            {...provided.dragHandleProps}
                                            className={snapshot.isDragging?'dragging':''}
                                            onDoubleClick={handleDblClick}
                                            data-grouplist="available" data-idx={g.idx}
                                        >
                                            {g.GROUP_NAME}
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
                        {groupLists.assigned.map(g => (
                            <Draggable key={g.GROUP_ID} draggableId={g.GROUP_ID} index={g.idx}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-grouplist="assigned" data-idx={g.idx}
                                    >
                                        {g.GROUP_NAME}
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