import React, { useState, useMemo, useEffect, useRef, useCallback, useContext, useReducer } from "react";
import { WorkflowContext, HierarchyChain } from "../../../../pages/admin/hierarchy/form";
import { useHierarchyQueries, useWorkflowQueries } from "../../../../queries/hierarchy";
import { find } from 'lodash';
import { Row, Col, Modal, Form, FormGroup, Alert, Tabs, Tab, Container, Table } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, FormProvider, useFormContext, useFieldArray, useWatch, Controller } from "react-hook-form";
import { useQueryClient } from "react-query";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { AppButton, errorToast } from "../../../components";
import { flattenObject } from "../../../../utility";
import { t } from "../../../../config/text";
import { Icon } from "@iconify/react";
import { NotFound } from "../../../../app";
import { datatablesConfig } from "../../../../config/app";
import { useLocation, useHistory } from "react-router-dom";

export default function WorkflowTab() {
    const location = useLocation();
    const history = useHistory();

    const {workflows,activeTab} = useContext(WorkflowContext);
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});
    const [deleteWorkflow,setDeleteWorkflow] = useState({});

    const searchRef = useRef();
    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
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
            history.replace({
                pathname: location.pathname,
                search: (e.target.value && `?search=${e.target.value}`)
            });
        }
        return(
            <Form onSubmit={e=>e.preventDefault()}>
                <Form.Group as={Row} controlId="filter">
                    <Form.Label column sm="2">Search: </Form.Label>
                    <Col sm="10">
                        <Form.Control ref={searchRef} className="ml-2" type="search" placeholder="search..." onChange={handleFilterChange} onKeyDown={handleKeyDown} value={filterText}/>
                    </Col>
                </Form.Group>
            </Form>
        );
    },[filterText,history,location]);

    const filteredRows = useMemo(() => {
        return rows.filter(row=>Object.values(flattenObject(row)).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase()));
    },[rows,filterText]);

    const columns = useMemo(() => [
        {name:'Actions',id:'actions',selector:row=>row.WORKFLOW_ID,cell:row=>{
            return (
                <div className="button-group">
                    <AppButton format="delete" size="sm" title="Delete Workflow" onClick={()=>setDeleteWorkflow(row)}></AppButton>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Workflow ID',selector:row=>row.WORKFLOW_ID,sortable:true,sortField:'WORKFLOW_ID'},
        {name:'Workflow Routing',selector:row=>row.GROUPS,grow:5,style:{flexWrap:'wrap'},cell:row=><HierarchyChain list={row.GROUPS_ARRAY} conditions={row.CONDITIONS} sendToGroup={row.SENDTOGROUP}/>},
    ],[workflows]);

    useEffect(()=>{
        setRows(workflows);
        searchRef.current.focus();
    },[workflows,activeTab]);

    useEffect(() => {
        const qs = new URLSearchParams(location.search);
        setFilterText(qs.get('search')||'');
        searchRef.current.focus();
    },[location]);

    return (
        <>
            <DataTable 
                {...datatablesConfig}
                keyField="WORKFLOW_ID"
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
                defaultSortFieldId={2}
                onSort={handleSort}
                sortServer
                onRowClicked={handleRowClick}
                noDataComponent={<p className="m-3">No Form Workflows Found Matching Your Criteria</p>}
            />
            {(selectedRow?.WORKFLOW_ID||isNew=='workflow') && <AddEditWorkflow {...selectedRow} setSelectedRow={setSelectedRow}/>}
            {deleteWorkflow?.WORKFLOW_ID && <DeleteWorkflow {...deleteWorkflow} setDeleteWorkflow={setDeleteWorkflow}/>}
        </>
    );
}

function DeleteWorkflow({WORKFLOW_ID,setDeleteWorkflow}) {
    const [inUse,setInUse] = useState(0);
    const [show,setShow] = useState(true);
    const queryclient = useQueryClient();
    const {getHierarchy} = useHierarchyQueries('form');
    const hierarchy = getHierarchy({onSuccess:d=>{
        setInUse(d.filter(h=>h.WORKFLOW_ID==WORKFLOW_ID).length);
    }});
    const {deleteWorkflow} = useWorkflowQueries('form',WORKFLOW_ID);
    const del = deleteWorkflow();
    const handleDelete = () => {
        //check for existing hierarchies
        setShow(false);
        toast.promise(new Promise((resolve,reject) => {
            del.mutateAsync().then(() => {
                queryclient.refetchQueries(['workflow','form'],{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err));
            }).catch(err=>reject(err)).finally(()=>{
                setDeleteWorkflow({});
            });
        }),{
            pending:t('admin.hierarchy.form.workflow.actions.delete.pending'),
            success:t('admin.hierarchy.form.workflow.actions.delete.success'),
            error:errorToast(t('admin.hierarchy.form.workflow.actions.delete.error'))
        });
    }
    useEffect(()=>setShow(true),[WORKFLOW_ID]);
    return(
        <Modal show={show} onHide={()=>setDeleteWorkflow({})} backdrop="static">
            {hierarchy.isLoading && <Loading>Checking....</Loading>}
            {hierarchy.isSuccess && 
                <>
                    <Modal.Header closeButton>
                        <Modal.Title><Icon className="iconify-inline" icon="mdi:alert"/> {t('dialog.form.workflow.delete.title')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {!!inUse&&<Alert variant="danger"><strong>Warning!</strong> The workflow you are about to delete is in use.  If you continue <em>all</em> hieararchies that use this workflow will also be <strong>deleted</strong>.</Alert>}
                        <p>{t('dialog.form.workflow.delete.title')}</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <AppButton format="close" onClick={()=>setDeleteWorkflow({})}>Cancel</AppButton>
                        <AppButton format="delete" onClick={handleDelete}>Delete</AppButton>
                    </Modal.Footer>
                </>
            }
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

    const queryclient = useQueryClient();
    const {putWorkflow,postWorkflow} = useWorkflowQueries('form',props.WORKFLOW_ID);
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
        conditions:props.CONDITIONS||[],
        sendToGroup:(isNew)?'Y':props.SENDTOGROUP
    }});

    const handleSubmit = data => {
        const newGroups = data.assignedGroups.map(g=>g.GROUP_ID).join(',');
        if (!newGroups) {
            setStatus({state:'error',message:'Workflows must have at least one group.'});
            return false;
        }
        const mutateData = {GROUPS:newGroups,CONDITIONS:data.conditions,SENDTOGROUP:data.sendToGroup};
        if (isNew) {
            const match = find(workflows,mutateData);
            if (match) {
                setStatus({state:'error',message:`Workflow ID ${match.WORKFLOW_ID} has the same structure.`});
                return false;
            }
            setStatus({state:'saving'});
            toast.promise(new Promise((resolve,reject) => {                
                create.mutateAsync(mutateData).then(()=>{
                    setStatus({state:'clear'});
                    closeModal();
                    resolve();
                }).catch(e => {
                    setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
                    reject(e);
                });
            }).then(() => {
                Promise.all([
                    queryclient.refetchQueries(['hierarchy','form']),
                    queryclient.refetchQueries(['workflow','form'])
                ]);
            }),{
                pending:t('admin.hierarchy.form.workflow.actions.create.pending'),
                success:t('admin.hierarchy.form.workflow.actions.create.success'),
                error:errorToast(t('admin.hierarchy.form.workflow.actions.create.error'))
            });
        } else {
            setStatus({state:'saving'});
            toast.promise(new Promise((resolve,reject) => {                
                update.mutateAsync(mutateData).then(() => {
                    setStatus({state:'clear'});
                    closeModal();
                    resolve();
                }).catch(e => {
                    setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
                    reject(e);
                });
            }).then(() => {
                Promise.all([
                    queryclient.refetchQueries(['hierarchy','form']),
                    queryclient.refetchQueries(['workflow','form'])
                ]);
            }),{
                pending:t('admin.hierarchy.form.workflow.actions.update.pending'),
                success:t('admin.hierarchy.form.workflow.actions.update.success'),
                error:errorToast(t('admin.hierarchy.form.workflow.actions.update.error'))
            });
        }
    }
    const handleError = error => {
        console.error(error);
        let msg = 'Workflow form has errors';
        if (Object.keys(error).includes('conditions')) msg = 'Error with Conditions';
        setStatus({state:'error',message:msg});
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
                        <Tabs activeKey={activeTab} onSelect={setActiveTab} id="admin-form-workflow-tabs">
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
                        <AppButton format="close" onClick={closeModal} disabled={!status.cancel}>Cancel</AppButton>
                        <AppButton format="save" type="submit" disabled={!status.save} icon={status.icon} spin={status.spin}>Save</AppButton>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

const TabRouter = React.memo(({tab})=>{
    switch(tab) {
        case "groups": return <WorkflowForm/>;
        case "conditions": return <WorkflowConditions/>;
        default: <NotFound/>;
    }
});

// <Form.Control plaintext readOnly defaultValue="email@example.com" />
function WorkflowForm() {
    const { groups } = useContext(WorkflowContext);
    const ref = useRef();
    const { control } = useFormContext();
    const [filterText,setFilterText] = useState('');
    const [filteredGroups,setFilteredGroups] = useState([]);
    const handleCheck = (e,field)=>field.onChange((e.target.checked)?"Y":"");
    const handleOnKeyDown = e => {
        if (e.key == 'Escape') {
            e.stopPropagation();
            setFilterText('');
        }
    }
    const handleOnChange = e => setFilterText(e.target.value);
    useEffect(() => {
        const filtered = groups.filter(row =>{
            return Object.values(flattenObject(row)).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase());
        }).map(f=>f.GROUP_ID);
        setFilteredGroups(filtered);
    },[filterText]);
    useEffect(()=>ref.current.focus(),[]);
    return (
        <section>
            <FormGroup as={Row} controlId="sendToGroup">
                <Form.Label column sm="auto">Send To Department Group:</Form.Label>
                <Col className="mt-1">
                    <Controller
                        name="sendToGroup"
                        control={control}
                        render={({field}) => <Form.Check {...field} type="checkbox" className="form-check-input-lg" value="Y" onChange={e=>handleCheck(e,field)} checked={field.value=="Y"} aria-label="Send to User's Department Group"/>}
                    />
                </Col>
            </FormGroup>
            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Filter Groups:</Form.Label>
                    <Form.Control ref={ref} type="search" placeholder="filter available groups..." value={filterText} onChange={handleOnChange} onKeyDown={handleOnKeyDown}/>
                </Form.Group>
            </Form.Row>
            <div className="drag-col-2">
                <div className="dlh1">Unassigned Groups</div>
                <div className="dlh2">Assigned Groups</div>
                <WorkflowGroupList filteredGroups={filteredGroups} filterText={filterText}/>
            </div>
        </section>
    );
}

function WorkflowGroupList({filteredGroups,filterText}) {
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
                        {groups.map((g,i) => {
                            if (filterText&&!filteredGroups.includes(g.GROUP_ID)) return null;
                            return (
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
                            );
                        })}
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
    const { control, setValue, formState:{ errors } } = useFormContext();
    const assignedgroups = useWatch({name:'assignedGroups',control:control});
    const { fields, append, remove, update } = useFieldArray({control:control,name:'conditions'});
    
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
        let group_id = null;
        if (e.target.value) group_id = e.target[parseInt(e.target.value)+1].dataset.group_id;
        setValue(`conditions.${index}.group_id`,group_id);
    }
    useEffect(()=>{
        fields.forEach((c,i) => {
            const newIdx = assignedgroups.findIndex(g=>g.GROUP_ID==c.group_id);
            if (newIdx == -1) {
                remove(i);
            } else {
                c.seq = newIdx;
                update(i,c);
                setValue(`conditions.${i}.seq`,newIdx);
            }
        });
    },[assignedgroups]);
    return (
        <>
            <Row className="mb-2">
                <Col>
                    <AppButton format="add" onClick={handleNewCondition}>New</AppButton>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table id="wfConditionsTable" striped bordered>
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
                                                rules={{required:{value:true,message:'Skip condition selection is required'}}}
                                                render={({field})=>(
                                                    <Form.Control {...field} as="select" size="sm" onChange={e=>handleGroupChange(field,index,e)} isInvalid={errors.conditions?.[index].seq}>
                                                        <option></option>
                                                        {assignedgroups.map((g,i)=>{
                                                            if (i >= assignedgroups.length-1) return null;
                                                            return <option key={i} value={i} data-group_id={g.GROUP_ID}>{i+1}: {g.GROUP_NAME}</option>;
                                                        })}
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
                                                rules={{required:{value:true,message:'When condition fields are required'}}}
                                                render={({field})=>(
                                                    <Form.Control {...field} as="select" size="sm" isInvalid={errors.conditions?.[index].field_name}>
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
                                                rules={{required:{value:true,message:'Group selection is required'}}}
                                                render={({field})=>(
                                                    <Form.Control {...field} as="select" size="sm" isInvalid={errors.conditions?.[index].field_operator}>
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
                                                rules={{required:{value:true,message:'Group selection is required'}}}
                                                render={({field})=><Form.Control {...field} type="text" size="sm" isInvalid={errors.conditions?.[index].field_value}/>}
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
