import React, { useState, useCallback, useMemo, useEffect, useRef, useReducer } from "react";
import { useQueryClient } from "react-query";
import useUserQueries from "../../queries/users";
import useGroupQueries from "../../queries/groups";
import { Loading, AppButton, errorToast } from "../../blocks/components";
import { Row, Col, Button, Form, Modal, Tabs, Tab, Container, Alert, InputGroup } from "react-bootstrap";
import { Icon } from "@iconify/react";
import { orderBy, sortBy, difference, differenceWith, isEqual, capitalize, startsWith } from "lodash";
import DataTable from 'react-data-table-component';
import { useForm, Controller, useWatch, FormProvider, useFormContext, useFieldArray } from "react-hook-form";
import DatePicker from "react-datepicker";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import { useHistory, useParams } from "react-router-dom";

export default function AdminGroups() {
    const [newGroup,setNewGroup] = useState(false);
    const {getGroups} = useGroupQueries();
    const groups = getGroups();
    return (
        <>
            <Row>
                <Col><h2>Admin: Groups <AppButton format="add-group" onClick={()=>setNewGroup(true)}>Add New</AppButton></h2></Col>
            </Row>
            <Row>
                <Col>
                    {groups.isLoading && <Loading type="alert">Loading Groups...</Loading>}
                    {groups.isError && <Loading type="alert" isError>Error Groups: <small>{groups.error?.name} {groups.error?.description}</small></Loading>}
                    {groups.isSuccess && <GroupsTable groups={groups.data} newGroup={newGroup} setNewGroup={setNewGroup}/>}
                </Col>
            </Row>
        </>
    );
}

function GroupsTable({groups,newGroup,setNewGroup}) {
    const {subpage} = useParams();
    const history = useHistory();
    const [filterText,setFilterText] = useState((!!subpage)?`id:${subpage}`:'');
    const [statusFilter,setStatusFilter] = useState('all');
    const [sortField,setsortField] = useState('GROUP_NAME');
    const [sortDir,setSortDir] = useState('asc');
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [rows,setRows] = useState([]);
    const [selectedRow,setSelectedRow] = useState({});
    const [toggleGroup,setToggleGroup] = useState({});
    const [deleteGroup,setDeleteGroup] = useState({});

    const searchRef = useRef();

    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus()
    });

    const handleRowClick = useCallback(row=>setSelectedRow(row));
    
    const handleSort = useCallback((...args) => {
        if (!args[0].sortable) return false;
        const sortKey = args[0].sortField; //columns[(args[0].id-1)].sortField;
        setsortField(sortKey);
        setSortDir(args[1]);
        if (sortKey == 'GROUP_ID') {
            if (args[1] == 'asc') {
                setRows([...groups].sort((a,b)=>a.GROUP_ID-b.GROUP_ID));
            } else {
                setRows([...groups].sort((a,b)=>b.GROUP_ID-a.GROUP_ID));
            }
        } else {
            setRows(orderBy(groups,[sortKey],[args[1]]));
        }
    },[]);

    const filterComponent = useMemo(() => {
        const statusChange = e => {
            setStatusFilter(e.target.value);
        }
        const handleFilterChange = e => {
            if (e.target.value) {
                setResetPaginationToggle(false);
                setFilterText(e.target.value);
                if (startsWith(e.target.value,'id:')) history.push('/admin/groups/'+e.target.value.split(':')[1]);
            } else {
                setResetPaginationToggle(true);
                setFilterText('');
                history.push('/admin/groups');
            }
        }
        return(
            <Form style={{flexDirection:'column'}} onSubmit={e=>e.preventDefault()}>
                <Form.Group as={Row} controlId="filter">
                    <Form.Label column sm="2">Search: </Form.Label>
                    <Col sm="10">
                        <Form.Control ref={searchRef} className="ml-2" type="search" placeholder="search..." value={filterText} onChange={handleFilterChange}/>
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
        if (startsWith(filterText,'id:')) {
            return row.GROUP_ID == filterText.split(':')[1];
        }
        const gName = row.GROUP_NAME.toLowerCase();
        if (startsWith(filterText,'name:')) {
            return gName.includes(filterText.split(':')[1].toLowerCase());
        }
        return Object.values(row).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase());
    });

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    {row.active && <AppButton format="deactivate-group" size="sm" title="Deactivate Group" onClick={()=>setToggleGroup(row)}/>}
                    {!row.active && <AppButton format="activate-group" size="sm" title="Restore Group" onClick={()=>setToggleGroup(row)}/>}
                    <AppButton format="delete" size="sm" title="Delete Group" onClick={()=>setDeleteGroup(row)}/>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Group ID',selector:row=>row.GROUP_ID,sortable:true,sortField:'GROUP_ID'},
        {name:'Group Name',selector:row=>row.GROUP_NAME,sortable:true,sortField:'GROUP_NAME'},
        {name:'Start Date',selector:row=>row.startDateUnix,format:row=>row.startDateFmt,sortable:true,sortField:'startDateUnix'},
        {name:'End Date',selector:row=>row.endDateUnix,format:row=>row.endDateFmt,sortable:true,sortField:'endDateUnix'}
    ],[groups]);
    
    const conditionalRowStyles = [
        {
            when: row => !row.active,
            style: {
                color: '#999'
            }
        }
    ];
    const paginationComponentOptions = {
        selectAllRowsItem: true
    };
    useEffect(()=>{
        setRows(orderBy(groups,[sortField],[sortDir]));
    },[groups]);
    useEffect(()=>searchRef.current.focus(),[]);
    return (
        <>
            <DataTable 
                keyField="GROUP_ID"
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
                defaultSortFieldId={3}
                onSort={handleSort}
                sortServer
                conditionalRowStyles={conditionalRowStyles}
            />
            {(selectedRow?.GROUP_ID||newGroup) && <AddEditGroupForm {...selectedRow} setSelectedRow={setSelectedRow} newGroup={newGroup} setNewGroup={setNewGroup}/>}
            {toggleGroup?.GROUP_ID && <ToggleGroup group={toggleGroup} setToggleGroup={setToggleGroup}/>}
            {deleteGroup?.GROUP_ID && <DeleteGroup group={deleteGroup} setDeleteGroup={setDeleteGroup}/>}
        </>
    );
}

function ToggleGroup({group,setToggleGroup}) {
    const {patchGroup} = useGroupQueries(group.GROUP_ID);
    const queryclient = useQueryClient();
    const update = patchGroup();
    useEffect(() => {
        const newEndDate = (group.END_DATE)?'':format(new Date(),'dd-MMM-yy');
        const words = (group.END_DATE)?['activate','activating','activated']:['deactivate','deactivating','deactivated'];
        toast.promise(new Promise((resolve,reject) => {
            update.mutateAsync({END_DATE:newEndDate}).then(()=>{
                queryclient.refetchQueries(['groups'],{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err));
            }).catch(err=>reject(err))
        }),{
            pending: `${capitalize(words[1])} group...`,
            success: `Group ${words[2]} successfully.`,
            error: errorToast(`Failed to ${words[0]} group.`)
        });
    },[group]);
    return null;
}

function DeleteGroup({group,setDeleteGroup}) {
    const [show,setShow] = useState(true);
    const queryclient = useQueryClient();
    const {deleteGroup} = useGroupQueries(group.GROUP_ID);
    const deletegroup = deleteGroup();
    const handleDelete = () => {
        setShow(false);
        toast.promise(new Promise((resolve,reject) => {
            deletegroup.mutateAsync().then(() => {
                queryclient.refetchQueries(['groups'],{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err));
            }).catch(err=>reject(err)).finally(()=>setDeleteGroup({}));
        }),{
            pending:'Deleting group...',
            success:'Group deleted successfully',
            error:errorToast('Failed to delete group')
        });
    }
    useEffect(()=>setShow(true),[group]);
    return (
        <Modal show={show} onHide={()=>setDeleteGroup({})} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title><Icon className="iconify-inline" icon="mdi:alert"/>Delete Group?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure?</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={()=>setDeleteGroup({})}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </Modal.Footer>
        </Modal>
    )
}

function AddEditGroupForm(props) {
    const defaultVals = {groupId:'',groupName:'',startDate:new Date(),endDate:'',assignedUsers:[],availableUsers:[],assignedDepts:[],availableDepts:[]};
    const tabs = [
        {id:'info',title:'Info'},
        {id:'users',title:'Users'},
        {id:'depts',title:'Departments'}
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

    const methods = useForm({
        mode:'onChange',
        reValidateMode:'onChange',
        defaultValues:Object.assign({},defaultVals,{
            groupId: props.GROUP_ID||'',
            groupName: props.GROUP_NAME||'',
            startDate: props.startDate||new Date(),
            endDate: props.endDate||''
        })
    });
    const groupName = methods.watch('groupName');

    const queryclient = useQueryClient();    
    const {getGroupUsers,postGroup,putGroup,getAvailableGroupDepts,getGroupDepts} = useGroupQueries(props.GROUP_ID);
    const {getUsers} = useUserQueries();
    const users = getUsers({enabled:false,select:data=>sortBy(data.filter(u=>(u.active&&!!u.SUNY_ID)),['sortName'])});
    const depts = getAvailableGroupDepts({enabled:false});
    const groupusers = getGroupUsers({enabled:false,select:data=>sortBy(data,['sortName'])});
    const groupdepts = getGroupDepts({enabled:false});
    const updateGroup = putGroup();
    const createGroup = postGroup();

    const navigate = tab => {
        setActiveTab(tab);
    }
    const closeModal = () => {
        if (status.state == 'saving') return false;
        props.setSelectedRow({});
        props.setNewGroup(false);
    }

    const handleSave = data => {
        if (!Object.keys(methods.formState.dirtyFields).length) {
            toast.info('No changes to group');
            closeModal();
            return true;
        }
        const origIds = (groupusers.data)?groupusers.data.map(u=>u.SUNY_ID):[];
        const newIds = data.assignedUsers.map(u=>u.SUNY_ID);
        const addUsers = difference(newIds,origIds);
        const delUsers = difference(origIds,newIds);
        const origDepts = groupdepts.data||[];
        const addDepts = differenceWith(data.assignedDepts,origDepts,isEqual);
        const delDepts = differenceWith(origDepts,data.assignedDepts,isEqual);
        const reqData = {
            GROUP_NAME:data.groupName,
            START_DATE:format(data.startDate,'dd-MMM-yyyy'),
            END_DATE:(data.endDate)?format(data.endDate,'dd-MMM-yyyy'):'',
            ADD_USERS:addUsers,
            DEL_USERS:delUsers,
            ADD_DEPTS:addDepts,
            DEL_DEPTS:delDepts
        }
        setStatus({state:'saving'});
        if (!props.newGroup) {
            //Could be separate mutations encapped in Promise.all?
            updateGroup.mutateAsync(reqData).then(()=>{
                Promise.all([
                    queryclient.refetchQueries('groups',{exact:true,throwOnError:true}),
                    queryclient.refetchQueries(['groupusers',props.GROUP_ID],{exact:true,throwOnError:true})
                ]).then(() => {
                    setStatus({state:'clear'});
                    toast.success('Group updated successfully');
                    closeModal();
                });
            }).catch(e => {
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            createGroup.mutateAsync(reqData).then(d=>{
                queryclient.refetchQueries('groups',{exact:true,throwOnError:true}).then(() => {
                    setStatus({state:'clear'});
                    toast.success('Group created successfully');
                    closeModal();
                });
            }).catch(e => {
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        }
    }
    const handleError = error => {
        console.error(error);
    }

    useEffect(() => {
        Promise.all([
            users.refetch(),
            depts.refetch()
        ]).then(([{data:usersData},{data:deptData}]) => {
            //const [{data:usersData},{data:deptData}] = r;
            if (props.newGroup) {
                methods.reset(Object.assign({},defaultVals,{
                    availableUsers:usersData,
                    availableDepts:deptData
                }));
            } else {
                Promise.all([
                    groupusers.refetch(),
                    groupdepts.refetch()
                ]).then(([{data:groupuserData},{data:groupdeptData}]) => {
                    const assignedIds = groupuserData.map(u=>u.SUNY_ID);
                    const filtered = usersData.filter(u=>!assignedIds.includes(u.SUNY_ID));
                    methods.reset({
                        groupId: props.GROUP_ID,
                        groupName: props.GROUP_NAME,
                        startDate: props.startDate,
                        endDate: props.endDate,
                        assignedUsers:groupuserData,
                        availableUsers:filtered,
                        assignedDepts:groupdeptData,
                        availableDepts:deptData
                    });    
                });
            }
        });
    },[props.GROUP_ID,props.newGroup]);
    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSave,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{props.newGroup && `New `}Group: {groupName}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                        {(props.newGroup && (users.isIdle || users.isLoading))||
                        (!props.newGroup && (groupusers.isIdle || groupusers.isLoading))&&
                            <Loading type="alert" variant="info">Loading Group Data</Loading>
                        }
                        {users.isError && <Loading type="alert" isError>Failed to load users <small>{users.error?.description}</small></Loading>}
                        {groupusers.isError && <Loading type="alert" isError>Failed to load group users <small>{groupusers.error?.description}</small></Loading> }
                        {(groupusers.data||props.newGroup) &&
                            <Tabs activeKey={activeTab} onSelect={navigate} id="admin-groups-tabs">
                                {tabs.map(t=>(
                                    <Tab key={t.id} eventKey={t.id} title={t.title}>
                                        <Container className="mt-3" fluid>
                                            <TabRouter tab={t.id}/>
                                        </Container>
                                    </Tab>
                                ))}
                            </Tabs>
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        {status.state != 'error' && <p>{status.message}</p>}
                        <Button variant="secondary" onClick={closeModal}  disabled={!status.cancel}>Cancel</Button>
                        <Button variant="danger" type="submit" disabled={!(status.save&&methods.formState.isValid)}>{status.icon && <Icon icon={status.icon} className={status.spin?'spin':''}/>}Save</Button>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

function TabRouter({tab}) {
    switch(tab) {
        case "info": return <GroupInfo/>;
        case "users": return <GroupUsers/>;
        case "depts": return <GroupDepts/>;
        default: return <GroupTabNotFound/>;
    }
}

function GroupTabNotFound() {
    return (
        <Row>
            <Col>
                <Alert variant="danger">Tab Data Not Found</Alert>
            </Col>
        </Row>
    );
}

function GroupInfo() {
    const groupNameRef = useRef();
    const { control, getValues, formState: { errors } } = useFormContext();
    const queryclient = useQueryClient();
    const groupsData = queryclient.getQueryData('groups');
    const groupId = getValues('groupId');
    useEffect(()=>groupNameRef.current.focus(),[]);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="groupId">
                    <Form.Label>Group ID</Form.Label>
                    <Controller
                        name="groupId"
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="groupName">
                    <Form.Label>Group Name:</Form.Label>
                    <Controller
                        name="groupName"
                        rules={{validate:{
                            required:v=>!!v || 'Group Name is required',
                            unique:v => {
                                const gid = groupsData.find(g=>g.GROUP_NAME==v)?.GROUP_ID 
                                if (gid && gid != groupId) return `Group Name must be unique. [${v}] is already in use.`;
                            }
                        }}}
                        control={control}
                        render={({field}) => <Form.Control {...field} ref={groupNameRef} type="text" placeholder="Enter Group Name" isInvalid={errors.groupName}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.groupName?.message}</Form.Control.Feedback>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="start_date">
                    <Form.Label>Start Date</Form.Label>
                    <InputGroup>
                        <Controller
                            name="startDate"
                            control={control}
                            rules={{required:{value:true,message:'Start Date is required'}}}
                            render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} isInvalid={errors.startDate}/>}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group as={Col} controlId="end_date">
                    <Form.Label>End Date</Form.Label>
                    <InputGroup>
                        <Controller
                            name="endDate"
                            control={control}
                            render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} autoComplete="off"/>}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </Form.Row>
        </>
    );
}

function GroupUsers() {
    return (
        <div className="drag-col-2">
            <div className="dlh1">Unassigned Users</div>
            <div className="dlh2">Assigned Users</div>
            <GroupUsersList/>
        </div>
    );
}

function GroupUsersList() {
    const { control } = useFormContext();
    const { insert:insertAssignedUsers, remove:removeAssignedUsers } = useFieldArray({control:control,name:'assignedUsers'});
    const { insert:insertAvailableUsers, remove:removeAvailableUsers } = useFieldArray({control:control,name:'availableUsers'});
    const assignedusers = useWatch({name:'assignedUsers',control:control});
    const availableusers = useWatch({name:'availableUsers',control:control});

    const onDragEnd = ({source,destination}) => {
        if (source.droppableId == destination.droppableId) return false; //no reordering
        if (source.droppableId == 'available') {
            insertAssignedUsers(destination.index,availableusers[source.index]);
            removeAvailableUsers(source.index);
        }
        if (source.droppableId == 'assigned') {
            insertAvailableUsers(destination.index,assignedusers[source.index]);
            removeAssignedUsers(source.index);
        }
    }
    const handleDblClick = useCallback(e => {
        const {list,idx} = e.target.dataset;
        onDragEnd({
            source:{droppableId:list,index:parseInt(idx,10)},
            destination:{droppableId:(list=='available'?'assigned':'available'),index:0}
        });
    },[availableusers,assignedusers]);
    return(
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl1 ${snapshot.isDraggingOver?'over':''}`}>
                        {availableusers.map((u,i) => (
                            <Draggable key={u.SUNY_ID} draggableId={u.SUNY_ID} index={i}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-list="available" data-idx={i}
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
            <Droppable droppableId="assigned">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl2 ${snapshot.isDraggingOver?'over':''}`}>
                        {assignedusers.map((u,i) => (
                            <Draggable key={u.SUNY_ID} draggableId={u.SUNY_ID} index={i}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-list="assigned" data-idx={i}
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

function GroupDepts() {
    return (
        <div className="drag-col-2">
            <div className="dlh1">Unassigned Depts</div>
            <div className="dlh2">Assigned Depts</div>
            <GroupDeptsList/>
        </div>
    );
}

function GroupDeptsList() {
    const { control } = useFormContext();
    const { insert:insertAssignedDepts, remove:removeAssignedDepts } = useFieldArray({control:control,name:'assignedDepts'});
    const { insert:insertAvailableDepts, remove:removeAvailableDepts } = useFieldArray({control:control,name:'availableDepts'});
    const assigneddepts = useWatch({name:'assignedDepts',control:control});
    const availabledepts = useWatch({name:'availableDepts',control:control});

    const onDragEnd = ({source,destination}) => {
        if (source.droppableId == destination.droppableId) return false; //no reordering
        if (source.droppableId == 'available') {
            insertAssignedDepts(destination.index,availabledepts[source.index]);
            removeAvailableDepts(source.index);
        }
        if (source.droppableId == 'assigned') {
            insertAvailableDepts(destination.index,assigneddepts[source.index]);
            removeAssignedDepts(source.index);
        }
    }
    const handleDblClick = useCallback(e => {
        const {list,idx} = e.target.dataset;
        onDragEnd({
            source:{droppableId:list,index:parseInt(idx,10)},
            destination:{droppableId:(list=='available'?'assigned':'available'),index:0}
        });
    },[availabledepts,assigneddepts]);
    return(
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl1 ${snapshot.isDraggingOver?'over':''}`}>
                        {availabledepts.map((d,i) => (
                            <Draggable key={d.DEPARTMENT_CODE} draggableId={d.DEPARTMENT_CODE} index={i}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-list="available" data-idx={i}
                                    >
                                        {d.DEPARTMENT_DESC}
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
                        {assigneddepts.map((d,i) => (
                            <Draggable key={d.DEPARTMENT_CODE} draggableId={d.DEPARTMENT_CODE} index={i}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-list="assigned" data-idx={i}
                                    >
                                        {d.DEPARTMENT_DESC}
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
