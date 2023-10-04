import React, { useState, useMemo, useEffect, useRef, useCallback, useContext, useReducer } from "react";
import { WorkflowContext, HierarchyChain } from "../../../../pages/admin/hierarchy/request";
import { useHierarchyQueries } from "../../../../queries/hierarchy";
import { find, truncate, orderBy, difference, intersection } from 'lodash';
import { Row, Col, Modal, Form, Alert, Tabs, Tab, Container, Badge, Button, ListGroup } from "react-bootstrap";
import { Icon } from "@iconify/react";
import { AppButton, DescriptionPopover, Loading, errorToast } from "../../../../blocks/components";
import DataTable from 'react-data-table-component';
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, FormProvider, useFormContext, Controller, useWatch, useFieldArray } from "react-hook-form";
import { useQueryClient } from "react-query";
import { flattenObject } from "../../../../utility";
import { t } from "../../../../config/text";
import useListsQueries from "../../../../queries/lists";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const HierarchyContext = React.createContext();
HierarchyContext.displayName = 'HierarchyContext';

export default function HierarchyTab() {
    const { getListData } = useListsQueries();
    const { getHierarchy } = useHierarchyQueries('request');
    const { groups } = useContext(WorkflowContext);
    const position = getListData('posTypes');
    const hierarchy = getHierarchy({select:d=>{
        return d.map(w => {
            const hryGroups = (w.HIERARCHY_GROUPS)?w.HIERARCHY_GROUPS.split(','):[];
            w.HIERARCHY_GROUPS_ARRAY = hryGroups.map(g => {
                const grp = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:grp?.GROUP_NAME,GROUP_DESCRIPTION:grp?.GROUP_DESCRIPTION}
            });
           //w.AVAILABLE_HIERARCHY_GROUPS = groups.filter(g=>!hryGroups.includes(g.GROUP_ID));
            const wfGroups = (w.WORKFLOW_GROUPS)?w.WORKFLOW_GROUPS.split(','):[];
            w.WORKFLOW_GROUPS_ARRAY = wfGroups.map(g => {
                const grp = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:grp?.GROUP_NAME,GROUP_DESCRIPTION:grp?.GROUP_DESCRIPTION}
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

    const {isNew,activeTab} = useContext(WorkflowContext);
    const {hierarchy,position} = useContext(HierarchyContext);
    const searchRef = useRef();

    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
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
        return(
            <Form onSubmit={e=>e.preventDefault()}>
                <Form.Group as={Row} controlId="filter">
                    <Form.Label column sm="2">Search: </Form.Label>
                    <Col sm="10">
                        <Form.Control ref={searchRef} className="ml-2" type="search" placeholder="search..." onChange={handleFilterChange} onKeyDown={handleKeyDown}/>
                    </Col>
                </Form.Group>
            </Form>
        );
    },[filterText]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => Object.values(flattenObject(row)).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase()));
    },[rows,filterText]);

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    <AppButton format="delete" size="sm" title="Delete Hierarchy" onClick={()=>setDeleteHierarchy(row)}></AppButton>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Position Type',selector:row=>row.POSITION_TYPE,sortable:true,sortField:'POSITION_TYPE',cell:row=>{
            return `${row.POSITION_TYPE} - ${position[row.POSITION_TYPE].title}`;
        },grow:2},
        {name:'Groups',selector:row=>(
            <p className="mb-0">{row.HIERARCHY_GROUPS_ARRAY.length}{' '}
                <DescriptionPopover
                    id={`${row.HIERARCHY_ID}_groups_information`}
                    title="Assigned Groups"
                    content={row.HIERARCHY_GROUPS_ARRAY.map(g=>g.GROUP_NAME).sort().join(', ')}
                >
                    <Badge variant="info" style={{fontSize:"14px",verticalAlign:"bottom",padding:"1px"}}><Icon icon="mdi:information-variant"/></Badge>
                </DescriptionPopover>
            </p>
        ),sortable:true,sortField:'GROUP_NAME',wrap:true},
        {name:'Workflow ID',selector:row=>row.WORKFLOW_ID,sortable:true,sortField:'WORKFLOW_ID',center:true},
        {name:'Workflow Routing',selector:row=><HierarchyChain list={row.WORKFLOW_GROUPS_ARRAY} conditions={row.CONDITIONS}/>,grow:5,style:{flexWrap:'wrap'}},
    ],[hierarchy]);

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };
    useEffect(()=>{
        setRows(hierarchy);
        searchRef.current.focus();
    },[hierarchy,activeTab]);

    return (
        <>
            <DataTable 
                keyField="HIERARCHY_ID"
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
                noDataComponent={<p className="m-3">No Request Hierarchies Found Matching Your Criteria</p>}
            />
            {(selectedRow?.HIERARCHY_ID||isNew=='hierarchy') && <AddEditHierarchy {...selectedRow} setSelectedRow={setSelectedRow}/>}
            {deleteHierarchy?.HIERARCHY_ID && <DeleteHierarchy {...deleteHierarchy} setDeleteHierarchy={setDeleteHierarchy}/>}
        </>
    );
}

function DeleteHierarchy({HIERARCHY_ID,setDeleteHierarchy}) {
    const [show,setShow] = useState(true);
    const queryclient = useQueryClient();
    const {deleteHierarchy} = useHierarchyQueries('request',HIERARCHY_ID);
    const del = deleteHierarchy();
    const handleDelete = () => {
        setShow(false);
        toast.promise(new Promise((resolve,reject) => {
            del.mutateAsync().then(() => {
                queryclient.refetchQueries(['hierarchy','request'],{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err));
            }).catch(err=>reject(err)).finally(()=>{
                setDeleteHierarchy({});
            });
        }),{
            pending:'Deleting hierarchy...',
            success:'Hierarchy deleted successfully',
            error:errorToast('Failed to delete hierarchy')
        });
    }
    useEffect(()=>setShow(true),[HIERARCHY_ID]);
    return(
        <Modal show={show} onHide={()=>setDeleteHierarchy({})} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{t('dialog.request.hierarchy.delete.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {t('dialog.request.hierarchy.delete.message')}
            </Modal.Body>
            <Modal.Footer>
                <AppButton format="close"  onClick={()=>setDeleteHierarchy({})}>Cancel</AppButton>
                <AppButton format="delete" onClick={handleDelete}>Delete</AppButton>
            </Modal.Footer>
        </Modal>
    );
}

function AddEditHierarchy(props) {
    const [activeTab,setActiveTab] = useState('hierarchy-info');
    const [disableGroupsTab,setDisableGroupsTab] = useState(!!props.isNew);
    const tabs = [
        {id:'hierarchy-info',title:'Information'},
        {id:'hierarchy-groups',title:'Groups'}
    ];
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:true};
    const [status,setStatus] = useReducer((state,args) => {
        let presets = {};
        switch(args.state) {
            case "error": presets = {icon:'mdi:alert',spin:false,save:false,cancel:true}; break;
            case "groups": presets = {icon:'mdi:alert',spin:false,save:false,cancel:true}; break;
            case "saving": presets = {message:'Saving...',icon:'mdi:loading',spin:true,cancel:false,save:false}; break;
            case "clear": presets = defaultStatus; break;
        }
        return Object.assign({},state,presets,args);
    },defaultStatus);

    const {isNew,setIsNew} = useContext(WorkflowContext);
    const {hierarchy} = useContext(HierarchyContext);
    const {groups} = useContext(WorkflowContext);

    const queryclient = useQueryClient();
    const {postHierarchy,patchHierarchy} = useHierarchyQueries('request',props.HIERARCHY_ID);
    const create = postHierarchy();
    const update = patchHierarchy();

    const methods = useForm({defaultValues:{
        hierarchyId: props.HIERARCHY_ID,
        posType: props.POSITION_TYPE,
        workflowId: props.WORKFLOW_ID||'',
        workflowSearch:'',
        assignedGroups:props.HIERARCHY_GROUPS_ARRAY||[],
        availableGroups:[]
    }});

    const navigate = tab => setActiveTab(tab);

    const findGroupsIntersection = useCallback(data =>{
        const assignedGroupsArray = data.assignedGroups.map(g=>g.GROUP_ID);
        const existingGroupsArray = hierarchy.filter(h=>h.POSITION_TYPE==data.posType&&h.HIERARCHY_ID!=data.hierarchyId).map(h=>h.WORKFLOW_GROUPS_ARRAY.map(g=>g.GROUP_ID)).flat();
        const inter = intersection(assignedGroupsArray,existingGroupsArray);
        return groups.filter(g=>inter.includes(g.GROUP_ID));
    },[groups,hierarchy,methods]);

    const closeModal = () => {
        if (status.state == 'saving') return false;
        props.setSelectedRow({});
        setIsNew('');
    }

    const handleSubmit = data => {
        console.debug('Hierarchy Data: ',data);
        if (isNew) {
            //check to see if hierarchy already exists; should not get here, but just in case
            if (find(hierarchy,{POSITION_TYPE:data.posType,WORKFLOW_ID:data.workflowId})) {
                setStatus({state:'error',message:'A hierarchy already exists for this Position Type and Group.'});
                return false;
            }
            const inuse = findGroupsIntersection(data);
            if (inuse.length) {
                setStatus({state:'groups',message:'The following group(s) are already assigned to another hierarchy that uses the same Payroll and Form: ',groups:inuse});
                return false;
            }
            if (!data.assignedGroups.length) {
                setStatus({state:'error',message:'At least one group must be assigned to the hierarchy.'});
                return false;
            }
            setStatus({state:'saving'});
            create.mutateAsync({
                posType:data.posType,
                workflowId:data.workflowId,
                groups:data.assignedGroups.map(g=>g.GROUP_ID).join(',')
            }).then(()=>{
                queryclient.refetchQueries(['hierarchy','request']).then(() => {
                    setStatus({state:'clear'});
                    toast.success('Hierarchy created successfully');
                    closeModal();
                });
            }).catch(e => {
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            let hasChanges = false;
            if (props.WORKFLOW_ID!=data.workflowId) hasChanges = true;
            // did groups change?
            const origIds = (props.HIERARCHY_GROUPS_ARRAY)?props.HIERARCHY_GROUPS_ARRAY.map(g=>g.GROUP_ID):[];
            const newIds = data.assignedGroups.map(g=>g.GROUP_ID);
            const addGroups = difference(newIds,origIds);
            const delGroups = difference(origIds,newIds);
            if (addGroups.length) hasChanges = true;
            if (delGroups.length) hasChanges = true;
            if (hasChanges) {
                if (!data.assignedGroups.length) {
                    setStatus({state:'error',message:'At least one group must be assigned to the hierarchy.'});
                    return false;
                }
                const inuse = findGroupsIntersection(data);
                if (inuse.length) {
                    setStatus({state:'groups',message:'The following group(s) are already assigned to another hierarchy that uses the same Payroll and Form: ',groups:inuse});
                    return false;
                }    
                setStatus({state:'saving'});
                update.mutateAsync({
                    workflowId:data.workflowId,
                    groups:data.assignedGroups.map(g=>g.GROUP_ID).join(',')    
                }).then(()=>{
                    queryclient.refetchQueries(['hierarchy','request']).then(() => {
                        setStatus({state:'clear'});
                        toast.success('Hierarchy updated successfully');
                        closeModal();
                    });
                }).catch(e => {
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
    useEffect(() => {
        if (!disableGroupsTab) {
            // Update available groups removing groups assigned under the same POSITION_TYPE regardless of hierarchy.
            const assgn = hierarchy.filter(h=>h.POSITION_TYPE==methods.getValues('posType')).map(h=>h.HIERARCHY_GROUPS_ARRAY).flat().map(g=>g.GROUP_ID);
            const avail = groups.filter(g=>!assgn.includes(g.GROUP_ID));
            methods.setValue('availableGroups',avail);
        }
    },[disableGroupsTab]);
    return(
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Hierarchy</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col>
                                {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                                {status.state == 'groups' && <Alert variant="danger">
                                    {status.message}
                                    <ul>
                                        {status.groups.map(g=><li key={g.GROUP_ID}>{g.GROUP_NAME}</li>)}
                                    </ul>
                                </Alert>}
                            </Col>
                        </Row>
                        <Tabs activeKey={activeTab} onSelect={navigate} id="form-hierarchy-tabs">
                                {tabs.map(t=>(
                                    <Tab key={t.id} eventKey={t.id} title={t.title} disabled={t.id=='hierarchy-groups'&&disableGroupsTab}>
                                        <Container className="mt-3" fluid>
                                            <TabRouter tab={activeTab}/>
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

const TabRouter = React.memo(({tab}) => {
    switch(tab) {
        case "hierarchy-info": return <HierarchyForm/>;
        case "hierarchy-groups": return <HierarchyGroups/>;
        default: return <NotFound/>;
    }
});

function HierarchyForm() {
    const [searchText,setSearchText] = useState('');
    const { control, setValue, formState:{ errors } } = useFormContext();
    const { workflows, isNew} = useContext(WorkflowContext);
    const { position } = useContext(HierarchyContext);

    const searchWorkFlows = (e,field) => {
        field.onChange(e.target.value);
        setSearchText(e.target.value);
    };

    const filteredWorkflows = useMemo(() => {
        return workflows.filter(w => w.GROUPS_ARRAY.map(g=>g.GROUP_NAME.toLowerCase()).join(' ').includes(searchText.toLocaleLowerCase()));
    },[searchText,workflows]);

    const selectedWorkflow = useCallback((workflowId) => workflows.filter(w=>w.WORKFLOW_ID==workflowId)[0],[workflows]);
    const clearWorkflow = useCallback(() => {
        setValue('workflowId','');
    },[setValue]);

    const listItemClick = (e,field) => {
        e.preventDefault();
        field.onChange(e.target.value);
    };

    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="posType">
                    <Form.Label>Position Type:</Form.Label>
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
                <Form.Group as={Col} controlId="workflowId">
                    <Form.Label>Current Workflow: <Button title="Clear" variant="danger" style={{padding:'0.1rem 0.25rem',fontSize:'0.8rem'}} onClick={clearWorkflow}>X</Button></Form.Label>
                    <Controller
                        name="workflowId"
                        control={control}
                        render={({field}) => (
                            <div className="border rounded p-3 bg-secondary-light">
                                <HierarchyChain list={selectedWorkflow(field.value)?.GROUPS_ARRAY} conditions={selectedWorkflow(field.value)?.CONDITIONS}/>
                            </div>
                        )}
                    />
                </Form.Group>
            </Form.Row>            
            <Form.Row>
                <Form.Group as={Col} controlId="workflowSearch">
                    <Form.Label>Workflow Search:</Form.Label>
                    <Controller
                        name="workflowSearch"
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} type="search" placeholder="search workflows..." onChange={e=>searchWorkFlows(e,field)}/>
                        )}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="workflowListGroup">
                <Controller
                    name="workflowId"
                    control={control}
                    render={({field}) => (
                        <ListGroup className="border list-group-condensed list-group-scrollable-25">
                            {filteredWorkflows.map(w =>( 
                                <ListGroup.Item key={w.WORKFLOW_ID} action active={field.value==w.WORKFLOW_ID} onClick={e=>listItemClick(e,field)} value={w.WORKFLOW_ID}>{w.WORKFLOW_ID}:{' '}
                                    {truncate(w.GROUPS_ARRAY.map(g=>g.GROUP_NAME).join(' > '),{length:70,separator:' > '})}
                                </ListGroup.Item>))
                            }
                        </ListGroup>
                    )}
                />
                </Form.Group>
            </Form.Row>
        </>
    );
}

function HierarchyGroups() {
    const ref = useRef();
    const [filterText,setFilterText] = useState('');
    const [filteredGroups,setFilteredGroups] = useState([]);
    const { getValues} = useFormContext();
    const handleOnKeyDown = e => {
        if (e.key == 'Escape') {
            e.stopPropagation();
            setFilterText('');
        }
    }
    const handleOnChange = e => setFilterText(e.target.value);
    useEffect(() => {
        const filtered = getValues('availableGroups').filter(row =>{
            return Object.values(flattenObject(row)).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase());
        }).map(f=>f.GROUP_ID);
        setFilteredGroups(filtered);
    },[filterText]);
    useEffect(()=>ref.current.focus(),[]);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Filter Groups:</Form.Label>
                    <Form.Control ref={ref} type="search" placeholder="filter available groups..." value={filterText} onChange={handleOnChange} onKeyDown={handleOnKeyDown}/>
                </Form.Group>
            </Form.Row>
            <div className="drag-col-2">
                <div className="dlh1">Unassigned Groups</div>
                <div className="dlh2">Assigned Groups</div>
                <HierarchyGroupsList filteredGroups={filteredGroups} filterText={filterText}/>
            </div>
        </>
    );
}

function HierarchyGroupsList({filteredGroups,filterText}) {
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
                        {availablegroups.map((g,i) => {
                            if (filterText&&!filteredGroups.includes(g.GROUP_ID)) return null;
                            return (
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