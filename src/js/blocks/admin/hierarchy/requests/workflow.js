import React, { useState, useMemo, useEffect, useRef, useCallback, useContext, useReducer } from "react";
import { WorkflowContext, HierarchyChain } from "../../../../pages/admin/hierarchy/request";
import { useWorkflowQueries } from "../../../../queries/hierarchy";
import { find, startsWith } from 'lodash';
import { Row, Col, Modal, Button, Form, Alert, Tabs, Tab, Container, Table } from "react-bootstrap";
import { Icon } from "@iconify/react";
import DataTable from 'react-data-table-component';
import { useToasts } from "react-toast-notifications";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, FormProvider, useFormContext, useFieldArray, useWatch, Controller } from "react-hook-form";
import { useQueryClient } from "react-query";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { AppButton } from "../../../components";


export default function WorkflowTab() {
    const {workflows} = useContext(WorkflowContext);
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});
    const [deleteWorkflow,setDeleteWorkflow] = useState({});

    const searchRef = useRef();
    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
    });


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
        {name:'Workflow Routing',selector:row=>row.GROUPS,grow:5,style:{flexWrap:'wrap'},cell:row=><HierarchyChain list={row.GROUPS_ARRAY} conditions={row.CONDITIONS}/>},
    ],[workflows]);

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };
    useEffect(()=>{
        setRows(workflows);
        searchRef.current.focus();
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
    const tabs = [
        {id:'groups',title:'Groups'},
        {id:'conditions',title:'Conditions'}
    ];
    const [activeTab,setActiveTab] = useState('groups');
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
    const {putWorkflow,postWorkflow} = useWorkflowQueries(props.WORKFLOW_ID);
    const create = postWorkflow();
    const update = putWorkflow();

    const closeModal = () => {
        if (status.state == 'saving') return false;
        props.setSelectedRow({});
        setIsNew('');
    }

    const methods = useForm({defaultValues:{
        workflowId:props.WORKFLOW_ID,
        assignedGroups:props.GROUPS_ARRAY||[],
        conditions:props.CONDITIONS||[]
    }});

    const handleSubmit = data => {
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
            setStatus({state:'saving'});
            update.mutateAsync({GROUPS:newGroups,CONDITIONS:data.conditions}).then(() => {
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
                        <Tabs activeKey={activeTab} onSelect={setActiveTab} id="admin-request-workflow-tabs">
                            {tabs.map(t=>(
                                <Tab key={t.id} eventKey={t.id} title={t.title}>
                                    <Container className="mt-3" fluid>
                                        <TabRouter tab={t.id}/>
                                    </Container>
                                </Tab>
                            ))}
                        </Tabs>
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

function TabRouter({tab}) {
    switch(tab) {
        case "groups": return <WorkflowForm/>;
        case "conditions": return <WorkflowConditions/>;
        default: return <p>{tab}</p>
    }
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

function WorkflowConditions() {
    const { control, setValue } = useFormContext();
    const assignedgroups = useWatch({name:'assignedGroups',control:control});
    const { fields, append, remove } = useFieldArray({control:control,name:'conditions'});
    
    const handleNewCondition = () =>{
        append({
            seq:'',
            group_id:'',
            field_name:'',
            field_operator:'',
            field_value:''
        });
    }
    const handleGroupChange = (field,index,e) => {
        field.onChange(e);
        const group_id = e.target[parseInt(e.target.value)+1].dataset.group_id;
        setValue(`conditions.${index}.group_id`,group_id);
    }
    return (
        <>
            <Row className="mb-2">
                <Col>
                    <AppButton format="add" onClick={handleNewCondition}>New</AppButton>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table striped bordered>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Rule</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.map((field,index) => (
                            <tr key={index}>
                                <td>
                                    <div className="d-flex justify-content-center align-self-center">
                                        <AppButton size="sm" format="delete" onClick={()=>remove(index)}/>
                                    </div>
                                </td>
                                <td>
                                    <Form.Group as={Row} controlId="skip_group_id" className="mb-0">
                                        <Form.Label column sm={2}>Skip:</Form.Label>
                                        <Col xs="auto">
                                            <Controller
                                                name={`conditions.${index}.seq`}
                                                defaultValue=""
                                                control={control}
                                                render={({field})=>(
                                                    <Form.Control {...field} as="select" size="sm" onChange={e=>handleGroupChange(field,index,e)}>
                                                        <option></option>
                                                        {assignedgroups.map((g,i)=><option key={i} value={i} data-group_id={g.GROUP_ID}>{i}: {g.GROUP_NAME}</option>)}
                                                    </Form.Control>
                                                )}
                                            />
                                        </Col>
                                    </Form.Group>
                                    <Form.Group as={Row} className="mb-0">
                                        <Form.Label column sm={2}>When:</Form.Label>
                                        <Col xs="auto">
                                        <Controller
                                                name={`conditions.${index}.field_name`}
                                                defaultValue=""
                                                control={control}
                                                render={({field})=>(
                                                    <Form.Control {...field} as="select" size="sm">
                                                        <option></option>
                                                        <option value="suny_account">SUNY Account</option>
                                                    </Form.Control>
                                                )}
                                            />
                                        </Col>
                                        <Col xs="auto">
                                            <Controller
                                                name={`conditions.${index}.field_operator`}
                                                defaultValue=""
                                                control={control}
                                                render={({field})=>(
                                                    <Form.Control {...field} as="select" size="sm">
                                                        <option></option>
                                                        <option value="eq">==</option>
                                                        <option value="ne">!=</option>
                                                        <option value="sw">startsWith</option>
                                                        <option value="ns">not startsWith</option>
                                                    </Form.Control>
                                                )}
                                            />
                                        </Col>
                                        <Col xs="auto">
                                            <Controller
                                                name={`conditions.${index}.field_value`}
                                                defaultValue=""
                                                control={control}
                                                render={({field})=><Form.Control {...field} type="text" size="sm" />}
                                            />
                                        </Col>
                                    </Form.Group>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </>
    );
}
