import React, { useState, useMemo, useEffect, useRef, useCallback, useContext, useReducer, lazy } from "react";
import { WorkflowContext, HierarchyChain } from "../../../../pages/admin/hierarchy/form";
import { useHierarchyQueries } from "../../../../queries/hierarchy";
import useCodesQueries from "../../../../queries/codes";
import useTransactionQueries from "../../../../queries/transactions";
import { find, truncate, orderBy, difference, pick, pickBy, get, intersection } from 'lodash';
import { Row, Col, Modal, Form, Alert, Tabs, Tab, Container, Badge, Button, ListGroup } from "react-bootstrap";
import { Loading, errorToast, DescriptionPopover, AppButton } from "../../../../blocks/components";
import { Icon } from "@iconify/react";
import DataTable from 'react-data-table-component';
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, FormProvider, useFormContext, Controller, useWatch, useFieldArray } from "react-hook-form";
import { useQueryClient } from "react-query";
import { flattenObject } from "../../../../utility";
import { displayFormCode } from "../../../../pages/form";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { t } from "../../../../config/text";
import { NotFound } from "../../../../app";
import { datatablesConfig } from "../../../../config/app";

const HierarchyContext = React.createContext();
HierarchyContext.displayName = 'HierarchyContext';

export default function HierarchyTab() {
    const {getCodes:getPayrollCodes} = useCodesQueries('payroll');
    const payrolls = getPayrollCodes();
    const {getHierarchy} = useHierarchyQueries('form');
    const {groups} = useContext(WorkflowContext);
    const hierarchy = getHierarchy({retry:false,select:d=>{
        return d.map(w => {
            const hryGroups = (w.HIERARCHY_GROUPS)?w.HIERARCHY_GROUPS.split(','):[];
            w.HIERARCHY_GROUPS_ARRAY = hryGroups.map(g => {
                const grp = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:grp?.GROUP_NAME,GROUP_DESCRIPTION:grp?.GROUP_DESCRIPTION}
            });
            const wfGroups = (w.WORKFLOW_GROUPS)?w.WORKFLOW_GROUPS.split(','):[];
            w.WORKFLOW_GROUPS_ARRAY = wfGroups.map(g => {
                const grp = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:grp?.GROUP_NAME,GROUP_DESCRIPTION:grp?.GROUP_DESCRIPTION}
            });
            return w;
        });
    }});

    if (hierarchy.isError) {
        if (hierarchy.error.status == 408) {
            return (
                <>
                    <Alert variant="warning">
                        <p className="m-0"><Icon icon="mdi:alert" className="iconify-inline" width={24} height={24}/> Loading the full hiearchy took too long.  Displaying a limited number of records.  Additional records loaded on page change.  Search restricted to current page.</p>
                    </Alert>
                    <PagedHierarchyTab payrolls={payrolls.data} />
                </>
            );
        } else {
            return <Loading isError error={hierarchy.error}>Error Loading Hierarchies</Loading>;
        }
    }
    if (payrolls.isError) return <Loading isError error={payrolls.error}>Error Loading Payrolls</Loading>;
    if (hierarchy.isLoading||payrolls.isLoading) return <Loading type="alert">Loading Data</Loading>;
    return (
        <HierarchyContext.Provider value={{hierarchy:hierarchy.data,payrolls:payrolls.data}}>
            <HierarchyTable/>
        </HierarchyContext.Provider>
    );
}

function PagedHierarchyTab(payrolls) {
    const [page,setPage] = useState(1);
    const [perPage,setPerPage] = useState(10);
    const [totalRows,setTotalRows] = useState(0);
    const [isLoading,setIsLoading] = useState(true);

    const {getHierarchyPaged} = useHierarchyQueries('form');
    const {groups} = useContext(WorkflowContext);
    const hierarchy = getHierarchyPaged({page:page,results:perPage},{select:d=>{
        d.results.map(w => {
            const hryGroups = (w.HIERARCHY_GROUPS)?w.HIERARCHY_GROUPS.split(','):[];
            w.HIERARCHY_GROUPS_ARRAY = hryGroups.map(g => {
                const grp = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:grp?.GROUP_NAME,GROUP_DESCRIPTION:grp?.GROUP_DESCRIPTION}
            });
            const wfGroups = (w.WORKFLOW_GROUPS)?w.WORKFLOW_GROUPS.split(','):[];
            w.WORKFLOW_GROUPS_ARRAY = wfGroups.map(g => {
                const grp = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:grp?.GROUP_NAME,GROUP_DESCRIPTION:grp?.GROUP_DESCRIPTION}
            });
            return w;
        });
        return d;
    },onSuccess:d=>{
        setTotalRows(d.info?.total_rows);
        setIsLoading(false);
    },keepPreviousData:true});

    if (hierarchy.isError) return <Loading isError error={hierarchy.error}>Error Loading Hierarchies</Loading>;
    if (hierarchy.isLoading) return <Loading type="alert">Loading Data</Loading>;
    return (
        <HierarchyContext.Provider value={{
            hierarchy:hierarchy.data.results,
            payrolls:payrolls,
            isLoading:isLoading,
            setIsLoading:setIsLoading,
            totalRows:totalRows,
            setPage:setPage,
            setPerPage:setPerPage
        }}>
            <HierarchyTable isPaged={true}/>
        </HierarchyContext.Provider>
    );
}

function HierarchyTable(isPaged) {
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});
    const [deleteHierarchy,setDeleteHierarchy] = useState({});

    const {isNew,activeTab} = useContext(WorkflowContext);
    //const {hierarchy} = useContext(HierarchyContext);
    const {hierarchy,isLoading,setIsLoading,totalRows,setPage,setPerPage} = useContext(HierarchyContext);
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

    const handleChangePage = page => {
        setIsLoading(true);
        setPage(page);
    }

    const handleChangeRowsPerPage = (newPerPage,page) => {
        setIsLoading(true);
        setPerPage(newPerPage);
        setPage(page);
    }

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
        return rows.filter(row => {
            if(!filterText) return true;
            const fields = pickBy(row,(v,k)=>k.endsWith('_CODE')||k.endsWith('_TITLE')); // Only filter on code and title fields
            ['HIERARCHY_GROUPS_ARRAY','WORKFLOW_GROUPS_ARRAY'].forEach(f => {
                fields[f] = get(row,f,[]).map(g=>pick(g,'GROUP_NAME'));
            });
            const searchString = Object.values(flattenObject(fields));
            searchString.push(displayFormCode({separator:'-',codes:[row.FORM_CODE,row.ACTION_CODE,row.TRANSACTION_CODE]}));
            const r = searchString.filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ');
            const tokens = filterText.toLocaleLowerCase().split(' ');
            return tokens.reduce((a,b)=>a&&r.includes(b),true);
        });
    },[rows,filterText]);

    const columns = useMemo(() => [
        {name:'Actions',id:'actions',cell:row=>{
            return (
                <div className="button-group">
                    <AppButton format="delete" size="sm" title="Delete Hierarchy" onClick={()=>setDeleteHierarchy(row)}></AppButton>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Payroll',selector:row=>(
            <DescriptionPopover
                id={`${row.HIERARCHY_ID}_payroll_description`}
                content={row.PAYROLL_DESCRIPTION}
            >
                <p className="mb-0">{row.PAYROLL_TITLE}</p>
            </DescriptionPopover>
        ),sortable:true,sortField:'PAYROLL_CODE',grow:2},
        {name:'Form Code',selector:row=>(
            <DescriptionPopover
                id={`${row.HIERARCHY_ID}_form_description`}
                content={displayFormCode({variant:"title",separator:" /",titles:[row.FORM_TITLE,row.ACTION_TITLE,row.TRANSACTION_TITLE]})}
            >
                <p className="mb-0">{displayFormCode({codes:[row.FORM_CODE,row.ACTION_CODE,row.TRANSACTION_CODE]})}</p>
            </DescriptionPopover>
        ),sortable:true,grow:2},
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
        {name:'Workflow Routing',selector:row=><HierarchyChain list={row.WORKFLOW_GROUPS_ARRAY} conditions={row.CONDITIONS} sendToGroup={row.SENDTOGROUP}/>,grow:5,style:{flexWrap:'wrap'}},
    ],[hierarchy]);

    useEffect(()=>{
        setRows(hierarchy);
        searchRef.current.focus();
    },[hierarchy,activeTab]);

    let tableParams = {};
    if (isPaged) {
        tableParams = {
            progressPending:isLoading,
            paginationServer:true,
            paginationRowsPerPageOptions:[10,15,20,25,30],
            paginationResetDefaultPage:resetPaginationToggle,
            onChangeRowsPerPage:handleChangeRowsPerPage,
            onChangePage:handleChangePage,
            paginationTotalRows:totalRows
        };
    } else {
        tableParams = {...datatablesConfig};
    }
    return (
        <>
            <DataTable 
                {...tableParams}
                keyField="HIERARCHY_ID"
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
                defaultSortFieldId={3}
                onSort={handleSort}
                sortServer
                onRowClicked={handleRowClick}
                noDataComponent={<p className="m-3">No Form Hierarchies Found Matching Your Criteria</p>}
            />
            {isNew && <AddEditHierarchy {...selectedRow} setSelectedRow={setSelectedRow} isNew={isNew}/>}
            {selectedRow?.HIERARCHY_ID && <AddEditHierarchy {...selectedRow} setSelectedRow={setSelectedRow}/>}
            {deleteHierarchy?.HIERARCHY_ID && <DeleteHierarchy {...deleteHierarchy} setDeleteHierarchy={setDeleteHierarchy}/>}
        </>
    );
}

function DeleteHierarchy({HIERARCHY_ID,setDeleteHierarchy}) {
    const [show,setShow] = useState(true);
    const queryclient = useQueryClient();
    const {deleteHierarchy} = useHierarchyQueries('form',HIERARCHY_ID);
    const del = deleteHierarchy();
    const handleDelete = () => {
        setShow(false);
        toast.promise(new Promise((resolve,reject) => {
            del.mutateAsync().then(() => {
                queryclient.refetchQueries(['hierarchy','form'],{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err));
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
                <Modal.Title><Icon className="iconify-inline" icon="mdi:alert"/> {t('dialog.form.hierarchy.delete.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {t('dialog.form.hierarchy.delete.message')}
            </Modal.Body>
            <Modal.Footer>
                <AppButton format="close" onClick={()=>setDeleteHierarchy({})}>Cancel</AppButton>
                <AppButton format="delete" onClick={handleDelete}>Delete</AppButton>
            </Modal.Footer>
        </Modal>
    );
}

function AddEditHierarchy(props) {
    const [activeTab,setActiveTab] = useState('hierarchy-info');
    const [disableGroupsTab,setDisableGroupsTab] = useState(!!props.isNew);
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:true,groups:[]};
    const tabs = [
        {id:'hierarchy-info',title:'Information'},
        {id:'hierarchy-groups',title:'Groups'}
    ];
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
    const {postHierarchy,patchHierarchy} = useHierarchyQueries('form',props.HIERARCHY_ID);
    const create = postHierarchy();
    const update = patchHierarchy();

    const methods = useForm({defaultValues:{
        hierarchyId: props.HIERARCHY_ID,
        payroll: props.PAYROLL_CODE,
        formCode: props.PAYTRANS_ID,
        workflowId: props.WORKFLOW_ID||'',
        workflowSearch: '',
        assignedGroups:props.HIERARCHY_GROUPS_ARRAY||[],
        availableGroups:[]
    }});

    const navigate = tab => setActiveTab(tab);

    const findGroupsIntersection = useCallback(data =>{
        const assignedGroupsArray = data.assignedGroups.map(g=>g.GROUP_ID);
        const existingGroupsArray = hierarchy.filter(h=>h.PAYTRANS_ID==data.formCode&&h.HIERARCHY_ID!=data.hierarchyId).map(h=>h.WORKFLOW_GROUPS_ARRAY.map(g=>g.GROUP_ID)).flat();
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
            if (find(hierarchy,{PAYROLL_CODE:data.payroll,PAYTRANS_ID:data.formCode,WORKFLOW_ID:data.workflowId})) {
                setStatus({state:'error',message:'A hierarchy already exists for this Payroll, Form and Workflow.'});
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
                payroll:data.payroll,
                formCode:data.formCode,
                workflowId:data.workflowId,
                groups:data.assignedGroups.map(g=>g.GROUP_ID).join(',')
            }).then(()=>{
                queryclient.refetchQueries(['hierarchy','form']).then(() => {
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
                    queryclient.refetchQueries(['hierarchy','form']).then(() => {
                        setStatus({state:'clear'});
                        toast.success('Hierarchy updated successfully');
                        closeModal();
                    });
                }).catch(e => {
                    setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
                });
            } else {
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
            if (type == 'change') {
                setDisableGroupsTab(!(frmData.payroll&&frmData.formCode&&frmData.workflowId));
                setStatus({state:'clear'});
            }
            if (name == 'assignedGroups'&&frmData.assignedGroups.length>0) setStatus({state:'clear'});
        });
        return () => watchFields.unsubscribe();
    },[methods.watch]);
    useEffect(() => {
        if (!disableGroupsTab) {
            // Update available groups removing groups assigned under the same PAYTRANS_ID regardless of hierarchy.
            const assgn = hierarchy.filter(h=>h.PAYTRANS_ID==methods.getValues('formCode')).map(h=>h.HIERARCHY_GROUPS_ARRAY).flat().map(g=>g.GROUP_ID);
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
    const [filter,setFilter] = useState([]);
    const { control, getValues, formState:{ errors }} = useFormContext();
    const { isNew } = useContext(WorkflowContext);
    const { payrolls, hierarchy } = useContext(HierarchyContext);
    const [watchPayroll,watchFormCode] = useWatch({name:['payroll','formCode']});

    useEffect(() => {
        const wfId = getValues('workflowId');
        const f = hierarchy.filter(h=>h.PAYTRANS_ID==watchFormCode).map(h=>h.WORKFLOW_ID).filter(w=>w!=wfId);
        setFilter(f);
    },[watchFormCode,getValues]);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="payroll">
                    <Form.Label>Payroll:</Form.Label>
                    <Controller
                        name="payroll"
                        control={control}
                        rules={{required:{value:true,message:'Payroll is required'}}}
                        render={({field}) => (
                            <Form.Control {...field} as="select" disabled={!isNew} isInvalid={errors.payroll}>
                                <option></option>
                                {payrolls.map(p=>{
                                    return p.ACTIVE==1 && <option key={p.PAYROLL_CODE} value={p.PAYROLL_CODE}>{p.PAYROLL_TITLE}</option>
                                })}
                            </Form.Control>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors.payroll?.message}</Form.Control.Feedback>
                </Form.Group>
            </Form.Row>
            <HierarchyFormFormCode payrollCode={watchPayroll}/>
            <HierarchyFormWorkflow payrollCode={watchPayroll} formCode={watchFormCode} filter={filter}/>
        </>
    );
}
function HierarchyFormFormCode({payrollCode}) {
    const { control, formState: { errors } } = useFormContext();
    const { isNew } = useContext(WorkflowContext);
    const { getPayTrans } = useTransactionQueries(payrollCode);
    const paytrans = getPayTrans({enabled:!!payrollCode});
    return (
        <Form.Row>
            <Form.Group as={Col} controlId="formCode">
                <Form.Label>Form:</Form.Label>
                <Controller
                    name="formCode"
                    control={control}
                    rules={{required:{value:true,message:'Form is required'}}}
                    render={({field}) => (
                        <>
                            {!payrollCode&&<p className="text-muted font-italic">Select A Payroll</p>}
                            {paytrans.isError && <p><Loading isError>Error Loading Forms</Loading></p>}
                            {paytrans.isLoading && <p><Loading>Loading Forms...</Loading></p>}
                            {payrollCode&&paytrans.data &&
                                <Form.Control {...field} as="select" disabled={!isNew} isInvalid={errors.formCode}>
                                    <option></option>
                                    {paytrans.data&&paytrans.data.map(c=>(
                                        <option key={c.PAYTRANS_ID} value={c.PAYTRANS_ID}>{displayFormCode({variant:"list",separator:" | ",codes:[c.FORM_CODE,c.ACTION_CODE,c.TRANSACTION_CODE],titles:[c.FORM_TITLE,c.ACTION_TITLE,c.TRANSACTION_TITLE]})}</option>
                                    ))}
                                </Form.Control>
                            }
                        </>
                    )}
                />
                <Form.Control.Feedback type="invalid">{errors.formCode?.message}</Form.Control.Feedback>
            </Form.Group>
        </Form.Row>
    );
}

function HierarchyFormWorkflow({payrollCode,formCode,filter}) {
    const [searchText,setSearchText] = useState('');
    const { control, setValue, formState:{ errors }} = useFormContext();
    const { workflows } = useContext(WorkflowContext);

    const searchWorkFlows = (e,field) => {
        field.onChange(e.target.value);
        setSearchText(e.target.value);
    };

    const filteredWorkflows = useMemo(() => {
        return workflows.filter(w => !filter.includes(w.WORKFLOW_ID)&&w.GROUPS_ARRAY.map(g=>g.GROUP_NAME.toLowerCase()).join(' ').includes(searchText.toLocaleLowerCase()));
    },[searchText,workflows,filter]);

    const selectedWorkflow = useCallback((workflowId) => {
        const w = workflows.filter(w=>w.WORKFLOW_ID==workflowId)[0];
        return (!w)?{GROUPS_ARRAY:[],CONDITIONS:[]}:w;
    },[workflows]);
    const clearWorkflow = useCallback(() => {
        setValue('workflowId','');
    },[setValue]);

    const listItemClick = (e,field) => {
        e.preventDefault();
        field.onChange(e.target.value);
    };

    if (!payrollCode) return <HierarchyRequiredFieldMessage><p className="text-muted font-italic">Select A Payroll</p></HierarchyRequiredFieldMessage>;
    if (!formCode) return <HierarchyRequiredFieldMessage><p className="text-muted font-italic">Select A Form</p></HierarchyRequiredFieldMessage>;
    if (filter.length==workflows.length) return <HierarchyRequiredFieldMessage><p className="text-muted font-italic mb-0">All available workflows assigned</p></HierarchyRequiredFieldMessage>;

    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="workflowId">
                    <Form.Label>Current Workflow: <Button title="Clear" variant="danger" style={{padding:'0.1rem 0.25rem',fontSize:'0.8rem'}} onClick={clearWorkflow}>X</Button></Form.Label>
                    <Controller
                        name="workflowId"
                        control={control}
                        render={({field}) => (
                            <div className="border rounded p-3 bg-secondary-light">
                                {<HierarchyChain list={selectedWorkflow(field.value)?.GROUPS_ARRAY} conditions={selectedWorkflow(field.value)?.CONDITIONS}/>}
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
                            {filteredWorkflows.map(w => ( 
                                <ListGroup.Item key={w.WORKFLOW_ID} action active={field.value==w.WORKFLOW_ID} onClick={e=>listItemClick(e,field)} value={w.WORKFLOW_ID}>{w.WORKFLOW_ID}:{' '}
                                    {w.SENDTOGROUP=='Y'&&'Group > '}{truncate(w.GROUPS_ARRAY.map(g=>g.GROUP_NAME).join(' > '),{length:70,separator:' > '})}
                                </ListGroup.Item>)
                            )}
                        </ListGroup>
                    )}
                />
                </Form.Group>
            </Form.Row>
        </>
    );
}

function HierarchyRequiredFieldMessage({children}) {
    return (
        <Form.Row>
            <Form.Group as={Col}>
                <Form.Label>Workflow:</Form.Label>
                {children}
            </Form.Group>
        </Form.Row>
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