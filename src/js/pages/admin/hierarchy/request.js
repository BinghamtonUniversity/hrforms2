import React, { useState, useMemo, useEffect, useRef, useCallback, useContext, useReducer } from "react";
import {useWorkflowQueries,useHierarchyQueries} from "../../../queries/hierarchy";
import { useAppQueries } from "../../../queries";
import useGroupQueries from "../../../queries/groups";
import { find, startsWith, truncate, sortBy, orderBy } from 'lodash';
import { Container, Row, Col, Tabs, Tab, Modal, Badge, Button, Form, Alert } from "react-bootstrap";
import { Loading } from "../../../blocks/components";
import { Icon } from "@iconify/react";
import DataTable from 'react-data-table-component';
import { useToasts } from "react-toast-notifications";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, FormProvider, useFormContext, Controller, useFieldArray, useWatch } from "react-hook-form";
import { useQueryClient } from "react-query";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

//TODO: lazy load tabs
//TODO: getListData for position type

const WorkflowContext = React.createContext();
WorkflowContext.displayName = 'WorkflowContext';
const HierarchyContext = React.createContext();
HierarchyContext.displayName = 'HierarchyContext';

export default function AdminRequestHierarchy() {
    const tabs = [
        {id:'hierarchy',title:'Hierarchy'},
        {id:'workflow',title:'Workflow'}
    ];

    const [activeTab,setActiveTab] = useState('hierarchy');
    const [isNew,setIsNew] = useState('');

    const {getGroups} = useGroupQueries();
    const {getWorkflow} = useWorkflowQueries();
    const groups = getGroups({select:d=>sortBy(d,['GROUP_NAME'])});
    const workflows = getWorkflow({enabled:!!groups.data,select:d=>{
        return d.map(w => {
            w.GROUPS_ARRAY = w.GROUPS.split(',').map(g => {
                const name = find(groups.data,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
            });
            return w;
        });
    }});

    if (groups.isError||workflows.isError) return <Loading isError>Error Loading Data</Loading>;
    if (groups.isLoading||workflows.isIdle||workflows.isLoading) return <Loading type="alert">Loading Data</Loading>;
    return (
        <WorkflowContext.Provider value={{groups:groups.data,workflows:workflows.data,isNew:isNew,setIsNew:setIsNew}}>
            <section>
                <header>
                    <Row>
                        <Col><h2>Request Hierarchy</h2></Col>
                    </Row>
                </header>
                <Tabs activeKey={activeTab} onSelect={setActiveTab} id="position-request-tabs">
                    {tabs.map(t => (
                        <Tab key={t.id} eventKey={t.id} title={t.title}>
                            <Container as="article" className="mt-3" fluid>
                                <Row as="header">
                                    <Col as="h3">{t.title} <Button variant="success" onClick={()=>setIsNew(t.id)}><Icon icon="mdi:plus"/>New</Button></Col>
                                </Row>
                                <HierarchyRouter tab={t.id}/>
                            </Container>
                        </Tab>
                    ))}
                </Tabs>
            </section>
        </WorkflowContext.Provider>
    );
}

function HierarchyRouter({tab,...props}) {
    switch(tab) {
        case "hierarchy": return <HierarchyTab/>;
        case "workflow": return <WorkflowTab/>;
        default: return <p>{tab}</p>;
    }
}

function HierarchyTab() {    
    const {getListData} = useAppQueries();
    const {getHierarchy} = useHierarchyQueries();
    const {groups} = useContext(WorkflowContext);
    const position = getListData('posTypes');
    const hierarchy = getHierarchy({select:d=>{
        return d.map(w => {
            const grps = (w.GROUPS)?w.GROUPS.split(','):[];
            w.GROUPS_ARRAY = grps.map(g => {
                const name = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
            });
            return w;
        });
    }});

    if (hierarchy.isError||position.isError) return <Loading isError>Error Loading Data</Loading>;
    if (hierarchy.isLoading||position.isLoading) return <Loading type="alert">Loading Data</Loading>;
    return (
        <HierarchyContext.Provider value={{hierarchy:hierarchy.data,position:position.data}}>
            <HierarchyTable/>
        </HierarchyContext.Provider>
    );
}

function HierarchyTable() {
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});
    const [deleteHierarchy,setDeleteHierarchy] = useState({});

    const {isNew} = useContext(WorkflowContext);
    const {hierarchy,position} = useContext(HierarchyContext);
    const searchRef = useRef();

    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus()
    });

    const handleRowClick = useCallback(row=>setSelectedRow(row));

    const handleSort = useCallback((...args) => {
        if (!args[0].sortable) return false;
        if (args[0].sortField == 'WORKFLOW_ID') {
            if (args[1] == 'asc') {
                setRows([...hierarchy].sort((a,b)=>a.WORKFLOW_ID-b.WORKFLOW_ID));
            } else {
                setRows([...hierarchy].sort((a,b)=>b.WORKFLOW_ID-a.WORKFLOW_ID));
            }
        } else {
            setRows(orderBy(hierarchy,[args[0].sortField],[args[1]]));
        }
    },[]);

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

    const filteredRows = rows.filter(row => {
        const g = startsWith(row.GROUP_NAME.toLowerCase(),filterText.toLowerCase());
        const r = row.GROUPS_ARRAY.map(g=>g.GROUP_NAME).filter(g=>startsWith(g.toLowerCase(),filterText.toLowerCase()));
        return r.length||g;
    });

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    <Button variant="danger" className="no-label" size="sm" title="Delete Hierarchy" onClick={()=>setDeleteHierarchy(row)}><Icon icon="mdi:delete"/></Button>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Position Type',selector:row=>row.POSITION_TYPE,sortable:true,sortField:'POSITION_TYPE',cell:row=>{
            return `${row.POSITION_TYPE} - ${position[row.POSITION_TYPE].title}`;
        }},
        {name:'Group Name',selector:row=>row.GROUP_NAME,sortable:true,sortField:'GROUP_NAME'},
        {name:'Workflow ID',selector:row=>row.WORKFLOW_ID,sortable:true,sortField:'WORKFLOW_ID'},
        {name:'Workflow Routing',selector:row=>row.GROUPS,grow:5,style:{flexWrap:'wrap'},cell:row=><HierarchyChain list={row.GROUPS_ARRAY}/>},
    ],[hierarchy]);

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };
    useEffect(()=>{
        setRows(hierarchy);
    },[hierarchy]);

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
                defaultSortFieldId={3}
                onSort={handleSort}
                sortServer
                onRowClicked={handleRowClick}
            />
            {(selectedRow?.HIERARCHY_ID||isNew=='hierarchy') && <AddEditHierarchy {...selectedRow} setSelectedRow={setSelectedRow}/>}
            {deleteHierarchy?.HIERARCHY_ID && <DeleteHierarchy {...deleteHierarchy} setDeleteHierarchy={setDeleteHierarchy}/>}
        </>
    );
}

function DeleteHierarchy({HIERARCHY_ID,setDeleteHierarchy}) {
    const [show,setShow] = useState(true);
    const queryclient = useQueryClient();
    const {addToast,removeToast} = useToasts();
    const {deleteHierarchy} = useHierarchyQueries(HIERARCHY_ID);
    const del = deleteHierarchy();
    const handleDelete = () => {
        setShow(false);
        addToast(<><h5>Deleting</h5><p>Deleting hierarchy...</p></>,{appearance:'info',autoDismiss:false},id=>{
            del.mutateAsync().then(() => {
                queryclient.refetchQueries(['hierarchy'],{exact:true,throwOnError:true}).then(() => {
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>Hierarchy deleted successfully.</p></>,{appearance:'success'});
                });
            }).catch(e => {
                removeToast(id);
                addToast(<><h5>Error!</h5><p>Failed to delete hierarchy. {e?.description}.</p></>,{appearance:'error',autoDismissTimeout:20000});
            }).finally(() => {
                setDeleteHierarchy({});
            });
        });
    }
    useEffect(()=>setShow(true),[HIERARCHY_ID]);
    return(
        <Modal show={show} onHide={()=>setDeleteHierarchy({})} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Delete?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure?</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={()=>setDeleteHierarchy({})}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </Modal.Footer>
        </Modal>
    );
}

function AddEditHierarchy(props) {
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:true};
    const [status,setStatus] = useReducer((state,args) => {
        let presets = {};
        switch(args.state) {
            case "error": presets = {icon:'mdi:alert',spin:false,save:false,cancel:true}; break;
            case "saving": presets = {message:'Saving...',icon:'mdi:loading',spin:true,cancel:false,save:false}; break;
            case "clear": presets = defaultStatus; break;
        }
        return Object.assign({},state,presets,args);
    },defaultStatus);

    const {isNew,setIsNew} = useContext(WorkflowContext);
    const {hierarchy} = useContext(HierarchyContext);

    const queryclient = useQueryClient();
    const {postHierarchy,patchHierarchy} = useHierarchyQueries(props.HIERARCHY_ID);
    const create = postHierarchy();
    const update = patchHierarchy();

    const methods = useForm({defaultValues:{
        hierarchyId: props.HIERARCHY_ID,
        posType: props.POSITION_TYPE,
        groupId: props.GROUP_ID,
        groupName: props.GROUP_NAME,
        workflowId: props.WORKFLOW_ID||''
    }});

    const {addToast} = useToasts();

    const closeModal = () => {
        if (status.state == 'saving') return false;
        props.setSelectedRow({});
        setIsNew('');
    }

    const handleSubmit = data => {
        if (isNew) {
            //check to see if hierarchy already exists.
            const match = find(hierarchy,{POSITION_TYPE:data.posType,GROUP_ID:data.groupId});
            if (match) {
                setStatus({state:'error',message:'A hierarchy already exists for this Position Type and Group.'});
                return false;
            }
            setStatus({state:'saving'});
            create.mutateAsync({...data}).then(d=>{
                queryclient.refetchQueries('hierarchy').then(() => {
                    setStatus({state:'clear'});
                    addToast(<><h5>Success!</h5><p>Hierarchy created successfully</p></>,{appearance:'success'});
                    closeModal();
                });
            }).catch(e => {
                console.error(e);
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            if (data.workflowId != props.WORKFLOW_ID) {
                setStatus({state:'saving'});
                update.mutateAsync({WORKFLOW_ID:data.workflowId}).then(d=>{
                    queryclient.refetchQueries('hierarchy').then(() => {
                        setStatus({state:'clear'});
                        addToast(<><h5>Success!</h5><p>Hierarchy updated successfully</p></>,{appearance:'success'});
                        closeModal();
                    });
                }).catch(e => {
                    console.error(e);
                    setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
                });
            } else {
                //No change to workflow ID, just close Modal.
                closeModal();
            }
        }
    }
    const handleError = error => {
        console.error(error);
    }
    useEffect(() => {
        const watchFields = methods.watch((frmData,{name,type}) => {
            //clear error status when posType or groupId changed.
            if (type == 'change'&&(name=='posType'||name=='groupId')) setStatus({state:'clear'});
        });
        return () => watchFields.unsubscribe();
    },[methods.watch]);
    return(
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Hierarchy</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                        <HierarchyForm/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeModal} disabled={!status.cancel}>Cancel</Button>
                        <Button variant="danger" type="submit" disabled={!status.save}>{status.icon && <Icon icon={status.icon} className={status.spin?'spin':''}/>}Save</Button>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

function HierarchyForm() {
    const {control,formState:{errors}} = useFormContext();
    const {groups,workflows,isNew} = useContext(WorkflowContext);
    const {position} = useContext(HierarchyContext);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="posType">
                    <Form.Label>Position Type</Form.Label>
                    <Controller
                        name="posType"
                        control={control}
                        rules={{required:{value:true,message:'Position Type is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" disabled={!isNew} isInvalid={errors.posType}>
                                <option></option>
                                {Object.keys(position).map(p=><option key={p} value={p}>{p} - {position[p].title}</option>)}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.posType?.message}</Form.Control.Feedback>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="groupId">
                    <Form.Label>Group Name</Form.Label>
                    <Controller
                        name="groupId"
                        control={control}
                        rules={{required:{value:true,message:'Group Name is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" disabled={!isNew} isInvalid={errors.groupId}>
                                <option></option>
                                {groups.map(g=><option key={g.GROUP_ID} value={g.GROUP_ID}>{g.GROUP_NAME}</option>)}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.groupId?.message}</Form.Control.Feedback>
                </Form.Group>
            </Form.Row>            
            <Form.Row>
                <Form.Group as={Col} controlId="workflowId">
                    <Form.Label>Workflow</Form.Label>
                    <Controller
                        name="workflowId"
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option value=""></option>
                                {workflows.map(w => <option key={w.WORKFLOW_ID} value={w.WORKFLOW_ID}>{w.WORKFLOW_ID}:{' '}
                                    {truncate(w.GROUPS_ARRAY.map(g=>g.GROUP_NAME).join(' > '),{length:65,separator:' > '})}
                                </option>)}
                            </Form.Control>
                        )}
                    />
                </Form.Group>
            </Form.Row>            
        </>
    );
}

/**
 * WORKFLOW TAB FUNCTIONS
 */

function WorkflowTab() {
    const {workflows} = useContext(WorkflowContext);
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});
    const [deleteWorkflow,setDeleteWorkflow] = useState({});

    const searchRef = useRef();

    const {isNew} = useContext(WorkflowContext);
    
    const handleRowClick = useCallback(row=>setSelectedRow(row));

    const handleSort = useCallback((...args) => {
        if (!args[0].sortable) return false;
        if (args[1]=='asc') {
            setRows([...workflows].sort((a,b)=>a.WORKFLOW_ID-b.WORKFLOW_ID));
        } else {
            setRows([...workflows].sort((a,b)=>b.WORKFLOW_ID-a.WORKFLOW_ID));
        }        
    },[]);

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

    const filteredRows = rows.filter(row => {
        const r = row.GROUPS_ARRAY.map(g=>g.GROUP_NAME).filter(g=>startsWith(g.toLowerCase(),filterText.toLowerCase()));
        return r.length;
    });
    const columns = useMemo(() => [
        {name:'Actions',selector:row=>row.WORKFLOW_ID,cell:row=>{
            return (
                <div className="button-group">
                    <Button variant="danger" className="no-label" size="sm" title="Delete Workflow" onClick={()=>setDeleteWorkflow(row)}><Icon icon="mdi:delete"/></Button>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Workflow ID',selector:row=>row.WORKFLOW_ID,sortable:true,sortField:'WORKFLOW_ID'},
        {name:'Workflow Routing',selector:row=>row.GROUPS,grow:5,style:{flexWrap:'wrap'},cell:row=><HierarchyChain list={row.GROUPS_ARRAY}/>},
    ],[workflows]);

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };
    useEffect(()=>{
        setRows(workflows);
    },[workflows]);

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
                defaultSortFieldId={2}
                onSort={handleSort}
                sortServer
                onRowClicked={handleRowClick}
            />
            {(selectedRow?.WORKFLOW_ID||isNew=='workflow') && <AddEditWorkflow {...selectedRow} setSelectedRow={setSelectedRow}/>}
            {deleteWorkflow?.WORKFLOW_ID && <DeleteWorkflow {...deleteWorkflow} setDeleteWorkflow={setDeleteWorkflow}/>}
        </>
    );
}

function DeleteWorkflow({WORKFLOW_ID,setDeleteWorkflow}) {
    const [show,setShow] = useState(true);
    const queryclient = useQueryClient();
    const {addToast,removeToast} = useToasts();
    const {deleteWorkflow} = useWorkflowQueries(WORKFLOW_ID);
    const del = deleteWorkflow();
    const handleDelete = () => {
        setShow(false);
        addToast(<><h5>Deleting</h5><p>Deleting workflow...</p></>,{appearance:'info',autoDismiss:false},id=>{
            del.mutateAsync().then(() => {
                queryclient.refetchQueries(['workflow'],{exact:true,throwOnError:true}).then(() => {
                    removeToast(id);
                    addToast(<><h5>Success!</h5><p>Workflow deleted successfully.</p></>,{appearance:'success'});
                });
            }).catch(e => {
                removeToast(id);
                addToast(<><h5>Error!</h5><p>Failed to delete workflow. {e?.description}.</p></>,{appearance:'error',autoDismissTimeout:20000});
            }).finally(() => {
                setDeleteWorkflow({});
            });
        });
    }
    useEffect(()=>setShow(true),[WORKFLOW_ID]);
    return(
        <Modal show={show} onHide={()=>setDeleteWorkflow({})} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Delete?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure?</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={()=>setDeleteWorkflow({})}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </Modal.Footer>
        </Modal>
    );
}

function AddEditWorkflow(props) {
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:true};
    const [status,setStatus] = useReducer((state,args) => {
        let presets = {};
        switch(args.state) {
            case "error": presets = {icon:'mdi:alert',spin:false,save:false,cancel:true}; break;
            case "saving": presets = {message:'Saving...',icon:'mdi:loading',spin:true,cancel:false,save:false}; break;
            case "clear": presets = defaultStatus; break;
        }
        return Object.assign({},state,presets,args);
    },defaultStatus);

    const {isNew,setIsNew,workflows} = useContext(WorkflowContext);

    const {addToast} = useToasts();

    const queryclient = useQueryClient();
    const {patchWorkflow,postWorkflow} = useWorkflowQueries(props.WORKFLOW_ID);
    const create = postWorkflow();
    const update = patchWorkflow();

    const closeModal = () => {
        if (status.state == 'saving') return false;
        props.setSelectedRow({});
        setIsNew('');
    }

    const methods = useForm({defaultValues:{
        workflowId:props.WORKFLOW_ID,
        assignedGroups:props.GROUPS_ARRAY||[]
    }});

    const handleSubmit = data => {
        console.log(data);
        const newGroups = data.assignedGroups.map(g=>g.GROUP_ID).join(',');
        if (!newGroups) {
            setStatus({state:'error',message:'Workflows must have at least one group.'});
            return false;
        }
        if (isNew) {
            const match = find(workflows,{GROUPS:newGroups});
            if (match) {
                setStatus({state:'error',message:`Workflow ID ${match.WORKFLOW_ID} has the same structure.`});
                return false;
            }
            setStatus({state:'saving'});
            create.mutateAsync({GROUPS:newGroups}).then(d=>{
                queryclient.refetchQueries('workflow').then(() => {
                    setStatus({state:'clear'});
                    addToast(<><h5>Success!</h5><p>Workflow created successfully</p></>,{appearance:'success'});
                    closeModal();
                });
            }).catch(e => {
                console.error(e);
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            if (newGroups == props.GROUPS) {
                closeModal();
            } else {
                setStatus({state:'saving'});
                update.mutateAsync({GROUPS:newGroups}).then(() => {
                    queryclient.refetchQueries('workflow').then(() => {
                        setStatus({state:'clear'});
                        addToast(<><h5>Success!</h5><p>Workflow updated successfully</p></>,{appearance:'success'});
                        closeModal();
                    })
                }).catch(e => {
                    console.error(e);
                    setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
                });
            }
        }
    }
    const handleError = error => {
        console.error(error);
    }
    useEffect(() => {
        const watchFields = methods.watch(()=>setStatus({state:'clear'}));
        return () => watchFields.unsubscribe();
    },[methods.watch]);
    return(
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Workflow</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                        <WorkflowForm/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeModal} disabled={!status.cancel}>Cancel</Button>
                        <Button variant="danger" type="submit" disabled={!status.save}>{status.icon && <Icon icon={status.icon} className={status.spin?'spin':''}/>}Save</Button>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

// <Form.Control plaintext readOnly defaultValue="email@example.com" />
function WorkflowForm() {
    return (
        <div className="drag-col-2">
            <div className="dlh1">Unassigned Groups</div>
            <div className="dlh2">Assigned Groups</div>
            <WorkflowGroupList/>
        </div>
    );
}

function WorkflowGroupList() {
    const { groups } = useContext(WorkflowContext);
    const { control } = useFormContext();
    const { insert, remove, move } = useFieldArray({control:control,name:'assignedGroups'});
    const assignedgroups = useWatch({name:'assignedGroups',control:control});

    const onDragEnd = ({source,destination}) => {
        if (!source||!destination) return; //partial drag may result in null
        if (source.droppableId=='assigned'&&destination.droppableId=='assigned') move(source.index,destination.index);
        if (source.droppableId=='assigned'&&destination.droppableId=='available') remove(source.index);
        if (source.droppableId=='available'&&destination.droppableId=='assigned') 
            insert(destination.index,{GROUP_ID:groups[source.index].GROUP_ID,GROUP_NAME:groups[source.index].GROUP_NAME});
    }
    const handleDblClick = useCallback(e => {
        const {list,idx} = e.target.dataset;
        onDragEnd({
            source:{droppableId:list,index:parseInt(idx,10)},
            destination:{
                droppableId:(list=='available'?'assigned':'available'),
                index:(list=='available')?assignedgroups.length:0
            }
        });

    },[groups,assignedgroups]);
    return(
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl1 ${snapshot.isDraggingOver?'over':''}`}>
                        {groups.map((g,i) => (
                            <Draggable key={i} draggableId={g.GROUP_ID} index={i}>
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
                            <Draggable key={i} draggableId={`${i}-${g.GROUP_ID}`} index={i}>
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

/**
 * Component to display hierarchy chain on both tabs
 */
function HierarchyChain({list}) {
    return (
        <>
            {list.map((g,i) => (
                <span key={i} className="my-1">
                    <Badge variant="white" className="p-2 border">{g.GROUP_NAME}</Badge> 
                    {(i<list.length-1)&&<span><Icon className="iconify-inline m-0 mt-1" icon="mdi:arrow-right"/></span>}
                </span>
            ))}
        </>
    );
}
