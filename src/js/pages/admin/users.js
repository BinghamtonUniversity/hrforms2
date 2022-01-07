import React, { useState, useCallback, useMemo, useEffect, useRef, useReducer } from "react";
import { useQueryClient } from "react-query";
import useUserQueries from "../../queries/users";
import useGroupQueries from "../../queries/groups";
import { Loading, ModalConfirm } from "../../blocks/components";
import { Row, Col, Button, Form, Modal, Tabs, Tab, Container, Alert, InputGroup } from "react-bootstrap";
import { Icon } from "@iconify/react";
import { orderBy, startsWith, sortBy, difference, differenceWith, isEqual, capitalize } from "lodash";
import DataTable from 'react-data-table-component';
import { useForm, Controller, useWatch, FormProvider, useFormContext, useFieldArray } from "react-hook-form";
import DatePicker from "react-datepicker";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from "date-fns";
import { useToasts } from "react-toast-notifications";
import { useHotkeys } from "react-hotkeys-hook";

const defaultVals = {SUNYID:'',firstName:'',lastName:'',email:'',startDate:new Date(),endDate:'',assignedGroups:[],availableGroups:[]};

export default function AdminUsers() {
    const [newUser,setNewUser] = useState(false);
    const {getUsers} = useUserQueries();
    const users = getUsers();

    return (
        <>
            <Row>
                <Col><h2>Admin: Users <Button variant="success" onClick={()=>setNewUser(true)}><Icon icon="mdi:account-plus"/>Add New</Button></h2></Col>
            </Row>
            <Row>
                <Col>
                    {users.isLoading && <Loading type="alert">Loading Users...</Loading>}
                    {users.isError && <Loading type="alert" isError>Error Users: <small>{users.error?.name} {users.error?.description}</small></Loading>}
                    {users.isSuccess && <UsersTable users={users.data} newUser={newUser} setNewUser={setNewUser}/>}
                </Col>
            </Row>
        </>
    );
}

function UsersTable({users,newUser,setNewUser}) {
    const [filterText,setFilterText] = useState('');
    const [statusFilter,setStatusFilter] = useState('all');
    const [sortField,setsortField] = useState('sortName');
    const [sortDir,setSortDir] = useState('asc');
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [rows,setRows] = useState([]);
    const [selectedRow,setSelectedRow] = useState({});
    const [impersonateUser,setImpersonateUser] = useState({});
    const [toggleUser,setToggleUser] = useState({});
    const [deleteUser,setDeleteUser] = useState({});

    const searchRef = useRef();

    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus()
    });

    const handleRowClick = useCallback(row=>setSelectedRow(row));
    
    const handleSort = useCallback((...args) => {
        if (!args[0].sortable) return false;
        const sortKey = columns[(args[0].id-1)].sortField;
        setsortField(sortKey);
        setSortDir(args[1]);
        setRows(orderBy(users,[sortKey],[args[1]]));
    },[]);

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

    const filteredRows = rows.filter(row => {
        if (row.active && statusFilter == 'inactive') return false;
        if (!row.active && statusFilter == 'active') return false;
        const fName = row.LEGAL_FIRST_NAME && row.LEGAL_FIRST_NAME.toLowerCase();
        const lName = row.LEGAL_LAST_NAME && row.LEGAL_LAST_NAME.toLowerCase();
        const filterFields = `${row.USER_SUNY_ID} ${fName} ${lName} ${row.email} ${row.startDateFmt} ${row.endDateFmt}`
        return filterFields.includes(filterText.toLowerCase());    
    });

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    {row.SUNY_ID && <Button variant="primary" className="no-label" size="sm" title="Impersonate User" onClick={()=>setImpersonateUser(row)} disabled={!row.active}><Icon icon="mdi:account-switch"/></Button>}
                    {row.active && <Button variant="warning" className="no-label" size="sm" title="Deactivate User" onClick={()=>setToggleUser(row)}><Icon icon="mdi:account-remove"/></Button>}
                    {!row.active && <Button variant="success" className="no-label" size="sm" title="Restore User" onClick={()=>setToggleUser(row)}><Icon icon="mdi:account" /></Button>}
                    <Button variant="danger" className="no-label" size="sm" title="Delete User" onClick={()=>setDeleteUser(row)}><Icon icon="mdi:delete"/></Button>
                </div>
            );
        },ignoreRowClick:true},
        {name:'SUNY ID',selector:row=>row.USER_SUNY_ID,sortable:true,sortField:'USER_SUNY_ID'},
        {name:'Name',selector:row=>row.sortName,sortable:true,sortField:'sortName'},
        {name:'Email',selector:row=>row.email,sortable:true,sortField:'email'},
        {name:'Start Date',selector:row=>row.startDateUnix,format:row=>row.startDateFmt,sortable:true,sortField:'startDateUnix'},
        {name:'End Date',selector:row=>row.endDateUnix,format:row=>row.endDateFmt,sortable:true,sortField:'endDateUnix'}
    ],[users]);

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };

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
                paginationRowsPerPageOptions={[10,20,30,40,50,100]}
                paginationResetDefaultPage={resetPaginationToggle}
                paginationComponentOptions={paginationComponentOptions}
                pointerOnHover
                highlightOnHover
                onRowClicked={handleRowClick}
                defaultSortFieldId={2}
                onSort={handleSort}
                sortServer
            />
            {(selectedRow?.SUNY_ID||newUser) && <AddEditUserForm {...selectedRow} setSelectedRow={setSelectedRow} newUser={newUser} setNewUser={setNewUser}/>}
            {impersonateUser?.SUNY_ID && <ImpersonateUser user={impersonateUser} setImpersonateUser={setImpersonateUser}/>}
            {toggleUser?.SUNY_ID && <ToggleUser user={toggleUser} setToggleUser={setToggleUser}/>}
            {deleteUser?.SUNY_ID && <DeleteUser user={deleteUser} setDeleteUser={setDeleteUser}/>}
        </>
    );
}

function ImpersonateUser({user,setImpersonateUser}) {
    const [show,setShow] = useState(true);
    const {addToast,removeToast} = useToasts();

    const buttons = {
        close: {
            title: 'Cancel',
            callback: () => {
                setShow(false);
                setImpersonateUser({});
            }
        },
        confirm:{
            title: 'Impersonate',
            callback: () => {
                setShow(false);
                setImpersonateUser({});
            }
        }
    }

    return (
        <ModalConfirm show={show} icon="mdi:account-question" title="Impersonate User?" buttons={buttons}>
            <p>Are you sure you want to impersonate {user.fullName} ({user.SUNY_ID})?</p>
        </ModalConfirm>
    );
}

function ToggleUser({user,setToggleUser}) {
    const {addToast,removeToast} = useToasts();
    const {patchUser} = useUserQueries(user.SUNY_ID);
    const queryclient = useQueryClient();
    const update = patchUser();
    useEffect(() => {
        const newEndDate = (user.END_DATE)?'':format(new Date(),'dd-MMM-yy');
        const words = (user.END_DATE)?['activate','activating','activated']:['deactivate','deactivating','deactivated'];
        addToast(<><h5>{capitalize(words[1])}</h5><p>{capitalize(words[1])} user...</p></>,{appearance:'info',autoDismiss:false},id=>{
            update.mutateAsync({END_DATE:newEndDate}).then(() => {
                queryclient.refetchQueries(['users'],{exact:true,throwOnError:true}).then(() => {
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>User {words[2]} successfully.</p></>,{appearance:'success'});
                });
            }).catch(e => {
                removeToast(id);
                addToast(<><h5>Error!</h5><p>Failed to {words[0]} user. {e?.description}.</p></>,{appearance:'error',autoDismissTimeout:20000});
            }).finally(() => {
                setToggleUser({});
            });
        });
    },[user]);
    return null;
}

function DeleteUser({user,setDeleteUser}) {
    const [show,setShow] = useState(true);
    const {addToast,removeToast} = useToasts();
    const queryclient = useQueryClient();
    const {deleteUser} = useUserQueries(user.SUNY_ID);

    const buttons = {
        close: {
            title: 'Cancel',
            callback: () => {
                setShow(false);
                setDeleteUser({});
            }
        },
        confirm:{
            title: 'Delete',
            variant: 'danger',
            callback: () => {
                deleteUser.mutateAsync().then(() => {
                    setShow(false);
                    setDeleteUser({});    
                }).catch(e => {
                    
                    console.error(e);
                });
            }
        }
    }

    return (
        <ModalConfirm show={show} icon="mdi:account-alert" title="Delete User?" buttons={buttons}>
            <p>Are you sure you want to <strong>delete</strong> {user.fullName} ({user.SUNY_ID})?  This cannot be undone.</p>
        </ModalConfirm>
    );
}

function AddEditUserForm(props) {
    const tabs = [
        {id:'info',title:'Info'},
        {id:'groups',title:'Groups'},
    ];
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:true};

    const [activeTab,setActiveTab] = useState('info');
    const [status,setStatus] = useReducer((state,args) => {
        let presets = {};
        switch(args.state) {
            case "error": presets = {icon:'mdi:alert',spin:false,save:false,cancel:true}; break;
            case "saving": presets = {message:'Saving...',icon:'mdi:loading',spin:true,cancel:false,save:false}; break;
            case "loading": presets = {message:'Loading...',icon:null,spin:false,save:false}; break;
            case "clear": presets = defaultStatus; break;
        }
        return Object.assign({},state,presets,args);
    },defaultStatus);

    const {addToast} = useToasts();

    const methods = useForm({
        mode:'onChange',
        reValidateMode:'onChange',
        defaultValues:Object.assign({},defaultVals,{
            SUNYID: props.SUNY_ID||'',
            firstName:props.LEGAL_FIRST_NAME||'',
            lastName:props.LEGAL_LAST_NAME||'',
            email:props.email||'',
            startDate: props.startDate||new Date(),
            endDate: props.endDate||''
        })
    });
    const [firstName,lastName] = methods.watch(['firstName','lastName']);

    const queryclient = useQueryClient();
    const {getUserGroups,postUser,putUser} = useUserQueries(props.SUNY_ID);
    const {getGroups} = useGroupQueries();
    const groups = getGroups({enabled:false,select:data=>sortBy(data.filter(g=>g.active),['GROUP_NAME'])});
    const usergroups = getUserGroups({enabled:false,select:data=>sortBy(data.filter(g=>g.active),['GROUP_NAME'])});
    const updateuser = putUser();

    const navigate = tab => {
        setActiveTab(tab);
    }
    const closeModal = () => {
        if (status.state == 'saving') return false;
        props.setSelectedRow({});
        props.setNewUser(false);
    }
    
    const handleSave = data => {
        if (!Object.keys(methods.formState.dirtyFields).length) {
            addToast(<><h5>No Change</h5><p>No changes to user data.</p></>,{appearance:'info'});
            closeModal();
            return true;
        }
        const origIds = (usergroups.data)?usergroups.data.map(g=>g.GROUP_ID):[];
        const newIds = data.assignedGroups.map(g=>g.GROUP_ID);
        const addGroups = difference(newIds,origIds);
        const delGroups = difference(origIds,newIds);
        const reqData = {
            SUNY_ID:data.SUNYID,
            START_DATE:format(data.startDate,'dd-MMM-yyyy'),
            END_DATE:(data.endDate)?format(data.endDate,'dd-MMM-yyyy'):'',
            ADD_GROUPS:addGroups,
            DEL_GROUPS:delGroups
        }
        setStatus({state:'saving'});
        if (!props.newGroup) {
            updateuser.mutateAsync(reqData).then(()=>{
                Promise.all([
                    queryclient.refetchQueries('users',{exact:true,throwOnError:true}),
                    queryclient.refetchQueries(['usergroups',props.SUNY_ID],{exact:true,throwOnError:true})
                ]).then(() => {
                    setStatus({state:'clear'});
                    addToast(<><h5>Success!</h5><p>User saved successfully</p></>,{appearance:'success'});
                    closeModal();
                });
            }).catch(e => {
                console.error(e);
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            console.log('create');
        }
        console.log(data);
    }

    const handleError = error => {
        console.log(error);
    }

    useEffect(() => {
        groups.refetch().then(({data:groupsData}) => {
            if (props.newUser) {
                methods.reset(Object.assign({},defaultVals,{
                    availableGroups:groupsData
                }));
            } else {
                usergroups.refetch().then(({data:usergroupData}) => {
                    const assignedIds = usergroupData.map(g=>g.GROUP_ID);
                    const filtered = groupsData.filter(g=>!assignedIds.includes(g.GROUP_ID));
                    methods.reset({
                        SUNYID:props.SUNY_ID,
                        firstName:props.LEGAL_FIRST_NAME,
                        lastName:props.LEGAL_LAST_NAME,
                        email:props.email,
                        startDate: props.startDate,
                        endDate: props.endDate,
                        assignedGroups:usergroupData,
                        availableGroups:filtered
                    });    
                });
            }
        })
    },[props.SUNY_ID,props.newUser]);
    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSave,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{props.newUser && `New `}User: {firstName} {lastName}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                            <Tabs activeKey={activeTab} onSelect={navigate} id="admin-groups-tabs">
                                {tabs.map(t=>(
                                    <Tab key={t.id} eventKey={t.id} title={t.title}>
                                        <Container className="mt-3" fluid>
                                            <TabRouter tab={t.id} newUser={props.newUser}/>
                                        </Container>
                                    </Tab>
                                ))}
                            </Tabs>
                    </Modal.Body>
                    <Modal.Footer>
                        {status.state != 'error' && <p>{status.message}</p>}
                        <Button variant="secondary" onClick={closeModal}  disabled={!status.cancel}>Cancel</Button>
                        <Button variant="danger" type="submit"disabled={!status.save||!methods.formState.isValid}>{status.icon && <Icon icon={status.icon} className={status.spin?'spin':''}/>}Save</Button>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

function TabRouter({tab,newUser}) {
    switch(tab) {
        case "info": return <UserInfo newUser={newUser}/>;
        case "groups": return <UserGroups/>;
        default: return <p>{tab}</p>;
    }
}

function UserInfo({newUser}) {
    const lookupStateDefault = {
        state:'',
        icon:'mdi:account-search',
        variant:'secondary',
        spin:false
    };
    const { control, watch, reset, setError, formState: { errors } } = useFormContext();
    const sunyid = watch('SUNYID');

    const [lookupState,setLookupState] = useReducer((state,action) => {
        switch(action) {
            case 'error':
            case 'invalid': return {state:'invalid',icon:'mdi:account-alert',variant:'danger',spin:false};
            case 'valid': return {state:'valid',icon:'mdi:account-check',variant:'success',spin:false};
            case 'search': return {state:'search',icon:'mdi:loading',variant:'secondary',spin:true};
            default: return lookupStateDefault;
        }
    },lookupStateDefault);

    const queryclient = useQueryClient();
    const {lookupUser} = useUserQueries(sunyid);
    const lookupuser = lookupUser({enabled:false});
    
    const handleLookup = () => {
        console.log('do lookup:',sunyid);
        if (!sunyid) {
            setLookupState('invalid');
            setError("SUNYID",{type:'required',message:'You must enter a SUNY ID'});
            return;
        }
        const userExists = queryclient.getQueryData('users').find(u=>u.SUNY_ID==sunyid);
        if (userExists) {
            setLookupState('invalid');
            setError("SUNYID",{type:'manual',message:'User Already Exists'});
            return;
        }
        setLookupState('search');
        lookupuser.refetch().then(d => {
            if (d.isError) {
                console.error(d.error);
                setLookupState('error');
                setError("SUNYID",{type:'manual',message:d.error?.description});
                return false;    
            }
            const userData = d.data[0];
            if (!userData) {
                setLookupState('error');
                setError("SUNYID",{type:'manual',message:'Invalid SUNY ID'});
                return false;    
            }
            setLookupState('valid');
            reset(Object.assign({},defaultVals,{
                SUNYID:userData.SUNY_ID,
                firstName:userData.LEGAL_FIRST_NAME,
                lastName:userData.LEGAL_LAST_NAME,
                email:userData.EMAIL_ADDRESS_WORK,
            }));
        });
    }
    const handleKeyDown = e => {
        if (e.which == 13) {
            e.preventDefault();
            handleLookup();
            return true;
        }
        if (e.which == 27) {
            e.preventDefault();
            setLookupState('clear');
            reset(defaultVals);
            return true;
        }
    }

    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="suny_id">
                    <Form.Label>SUNY ID</Form.Label>
                    {newUser?
                        <InputGroup hasValidation className="mb-3">
                            <Controller
                                name="SUNYID"
                                control={control}
                                render={({field}) => <Form.Control {...field} type="text" placeholder="Search for SUNY ID" aria-label="Search for SUNY ID" aria-describedby="basic-addon" onKeyDown={handleKeyDown} isInvalid={errors.SUNYID}/>}
                            />
                            <InputGroup.Append>
                                <Button variant={lookupState.variant} className="no-label" title="Search" onClick={handleLookup}><Icon icon={lookupState.icon} className={lookupState.spin&&'spin'}/></Button>
                            </InputGroup.Append>
                            <Form.Control.Feedback type="invalid">{errors.SUNYID?.message}</Form.Control.Feedback>
                        </InputGroup>
                    :
                        <Controller
                            name="SUNYID"
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" disabled/>}
                        />
                    }
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="first_name">
                    <Form.Label>First Name</Form.Label>
                    <Controller
                        name="firstName"
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
                <Form.Group as={Col} controlId="last_name">
                    <Form.Label>Last Name</Form.Label>
                    <Controller
                        name="lastName"
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Controller
                        name="email"
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="start_date">
                    <Form.Label>Start Date</Form.Label>
                    <Controller
                        name="startDate"
                        control={control}
                        rules={{required:{value:true,message:'Start Date is required'}}}
                        render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} isInvalid={errors.startDate}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>                    
                </Form.Group>
                <Form.Group as={Col} controlId="end_date">
                    <Form.Label>End Date</Form.Label>
                    <Controller
                        name="endDate"
                        control={control}
                        render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value}/>}
                    />
                </Form.Group>
            </Form.Row>
        </>
    );
}

function UserGroups() {
    return (
        <div className="drag-col-2">
            <div className="dlh1">Unassigned Groups</div>
            <div className="dlh2">Assigned Groups</div>
            <UserGroupsList/>
        </div>
    );
}

function UserGroupsList() {
    const { control } = useFormContext();
    const { insert:insertAssignedGroups, remove:removeAssignedGroups } = useFieldArray({control:control,name:'assignedGroups'});
    const { insert:insertAvailableGroups, remove:removeAvailableGroups } = useFieldArray({control:control,name:'availableGroups'});
    const assignedgroups = useWatch({name:'assignedGroups',control:control});
    const availablegroups = useWatch({name:'availableGroups',control:control});

    const onDragEnd = ({source,destination}) => {
        if (source.droppableId == destination.droppableId) return false; //no reordering
        if (source.droppableId == 'available') {
            insertAssignedGroups(destination.index,availablegroups[source.index]);
            removeAvailableGroups(source.index);
        }
        if (source.droppableId == 'assigned') {
            insertAvailableGroups(destination.index,assignedgroups[source.index]);
            removeAssignedGroups(source.index);
        }
    }
    const handleDblClick = useCallback(e => {
        const {list,idx} = e.target.dataset;
        onDragEnd({
            source:{droppableId:list,index:parseInt(idx,10)},
            destination:{droppableId:(list=='available'?'assigned':'available'),index:0}
        });
    },[availablegroups,assignedgroups]);
    return(
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl1 ${snapshot.isDraggingOver?'over':''}`}>
                        {availablegroups.map((g,i) => (
                            <Draggable key={g.GROUP_ID} draggableId={g.GROUP_ID} index={i}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-list="available" data-idx={i}
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
            <Droppable droppableId="assigned">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl2 ${snapshot.isDraggingOver?'over':''}`}>
                        {assignedgroups.map((g,i) => (
                            <Draggable key={g.GROUP_ID} draggableId={g.GROUP_ID} index={i}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-list="assigned" data-idx={i}
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