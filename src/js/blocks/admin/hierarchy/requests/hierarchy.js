import React, { useState, useMemo, useEffect, useRef, useCallback, useContext, useReducer } from "react";
import { WorkflowContext, HierarchyChain } from "../../../../pages/admin/hierarchy/request";
import { useHierarchyQueries } from "../../../../queries/hierarchy";
import { find, truncate, orderBy } from 'lodash';
import { Row, Col, Modal, Form, Alert, ListGroup } from "react-bootstrap";
import { AppButton, Loading, errorToast } from "../../../../blocks/components";
import DataTable from 'react-data-table-component';
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, FormProvider, useFormContext, Controller } from "react-hook-form";
import { useQueryClient } from "react-query";
import { flattenObject } from "../../../../utility";
import { t } from "../../../../config/text";
import useListsQueries from "../../../../queries/lists";

const HierarchyContext = React.createContext();
HierarchyContext.displayName = 'HierarchyContext';

export default function HierarchyTab() {
    const { getListData } = useListsQueries();
    const {getHierarchy} = useHierarchyQueries('request');
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
        {name:'Group Name',selector:row=>row.GROUP_NAME,sortable:true,sortField:'GROUP_NAME'},
        {name:'Workflow ID',selector:row=>row.WORKFLOW_ID,sortable:true,sortField:'WORKFLOW_ID',center:true},
        {name:'Workflow Routing',selector:row=>row.GROUPS,grow:5,style:{flexWrap:'wrap'},cell:row=><HierarchyChain list={row.GROUPS_ARRAY} conditions={row.CONDITIONS}/>},
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
    const {postHierarchy,patchHierarchy} = useHierarchyQueries('request',props.HIERARCHY_ID);
    const create = postHierarchy();
    const update = patchHierarchy();

    const methods = useForm({defaultValues:{
        hierarchyId: props.HIERARCHY_ID,
        posType: props.POSITION_TYPE,
        groupId: props.GROUP_ID,
        groupName: props.GROUP_NAME,
        workflowId: props.WORKFLOW_ID||'',
        workflowSearch:''
    }});

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
                queryclient.refetchQueries(['hierarchy','request']).then(() => {
                    setStatus({state:'clear'});
                    toast.success('Hierarchy created successfully');
                    closeModal();
                });
            }).catch(e => {
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            if (data.workflowId != props.WORKFLOW_ID) {
                setStatus({state:'saving'});
                update.mutateAsync({WORKFLOW_ID:data.workflowId}).then(d=>{
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
                        <AppButton format="close" onClick={closeModal} disabled={!status.cancel}>Cancel</AppButton>
                        <AppButton format="save" type="submit" disabled={!status.save} icon={status.icon} spin={status.spin}>Save</AppButton>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

function HierarchyForm() {
    const [searchText,setSearchText] = useState('');
    const { control, formState:{ errors } } = useFormContext();
    const { groups, workflows, isNew} = useContext(WorkflowContext);
    const { position } = useContext(HierarchyContext);

    const searchWorkFlows = (e,field) => {
        field.onChange(e.target.value);
        setSearchText(e.target.value);
    };

    const filteredWorkflows = useMemo(() => {
        return workflows.filter(w => w.GROUPS_ARRAY.map(g=>g.GROUP_NAME.toLowerCase()).join(' ').includes(searchText.toLocaleLowerCase()));
    },[searchText,workflows]);

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
                <Form.Group as={Col} controlId="groupId">
                    <Form.Label>Group Name:</Form.Label>
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
                    <Form.Label>Current Workflow:</Form.Label>
                    <Controller
                        name="workflowId"
                        control={control}
                        render={({field}) => (
                            <div>
                                <HierarchyChain list={workflows.filter(w=>w.WORKFLOW_ID==field.value)[0].GROUPS_ARRAY} conditions={workflows.filter(w=>w.WORKFLOW_ID==field.value)[0].CONDITIONS}/>
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
                            <Form.Control {...field} type="search" placeholder="search available workflows..." onChange={e=>searchWorkFlows(e,field)}/>
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
                        <ListGroup className="border" style={{height:'30vh',overflow:'scroll'}}>
                            {filteredWorkflows.map(w =>( 
                                <ListGroup.Item key={w.WORKFLOW_ID} action active={field.value==w.WORKFLOW_ID} onClick={e=>listItemClick(e,field)} value={w.WORKFLOW_ID}>{w.WORKFLOW_ID}:{' '}
                                    {truncate(w.GROUPS_ARRAY.map(g=>g.GROUP_NAME).join(' > '),{length:65,separator:' > '})}
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
