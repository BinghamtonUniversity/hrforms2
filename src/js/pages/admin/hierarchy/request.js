import React, { useState, useMemo, useEffect, useRef, useCallback, useContext } from "react";
import useHierarchyQueries from "../../../queries/hierarchy";
import useGroupQueries from "../../../queries/groups";
import { find, startsWith, truncate } from 'lodash';
import { Container, Row, Col, Tabs, Tab, Modal, Badge, Button, Form } from "react-bootstrap";
import { Loading } from "../../../blocks/components";
import { Icon } from "@iconify/react";
import DataTable from 'react-data-table-component';
import { useHotkeys } from "react-hotkeys-hook";
import { useForm, FormProvider, useFormContext, Controller } from "react-hook-form";

const WorkflowContext = React.createContext();
WorkflowContext.displayName = 'WorkflowContext';

export default function AdminRequestHierarchy() {
    const tabs = [
        {id:'hierarchy',title:'Hierarchy'},
        {id:'workflow',title:'Workflow'}
    ];

    const [activeTab,setActiveTab] = useState('hierarchy');

    const {getGroups} = useGroupQueries();
    const {getWorkflows} = useHierarchyQueries();
    const groups = getGroups();
    const workflows = getWorkflows({enabled:!!groups.data,select:d=>{
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
        <WorkflowContext.Provider value={{workflows:workflows.data}}>
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
                                    <Col as="h3">{t.title}</Col>
                                </Row>
                                <HierarchyRouter tab={t.id} groups={groups.data} workflows={workflows.data}/>
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
        case "hierarchy": return <HierarchyTab {...props}/>;
        case "workflow": return <WorkflowTab {...props}/>;
        default: return <p>{tab}</p>;
    }
}

function HierarchyTab({groups}) {
    const {getHierarchy} = useHierarchyQueries();
    const hierarchy = getHierarchy({select:d=>{
        return d.map(w => {
            w.GROUPS_ARRAY = w.GROUPS.split(',').map(g => {
                const name = find(groups,{GROUP_ID:g})
                return {GROUP_ID:g,GROUP_NAME:name?.GROUP_NAME}
            });
            return w;
        });
    }});

    if (hierarchy.isError) return <Loading isError>Error Loading Data</Loading>;
    if (hierarchy.isLoading) return <Loading type="alert">Loading Data</Loading>;
    return <HierarchyTable groups={groups} hierarchy={hierarchy.data}/>;
}

function HierarchyTable({groups,hierarchy}) {
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [selectedRow,setSelectedRow] = useState({});

    const searchRef = useRef();

    useHotkeys('ctrl+f',e=>{
        e.preventDefault();
        searchRef.current.focus()
    });

    const handleRowClick = useCallback(row=>setSelectedRow(row));

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
                    <Button variant="danger" className="no-label" size="sm" title="Delete Group" onClick={()=>console.log('delete')}><Icon icon="mdi:delete"/></Button>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Position Type',selector:row=>row.POSITION_TYPE,sortable:true,sortField:'POSITION_TYPE'},
        {name:'Group Name',selector:row=>row.GROUP_NAME,sortable:true,sortField:'GROUP_NAME'},
        {name:'Workflow ID',selector:row=>row.WORKFLOW_ID,sortable:true,sortField:'WORKFLOW_ID'},
        {name:'Workflow Chain',selector:row=>row.GROUPS,grow:5,style:{flexWrap:'wrap'},cell:row=><HierarchyChain list={row.GROUPS_ARRAY}/>},
    ],[hierarchy]);

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };
    useEffect(()=>{
        setRows(hierarchy);
    },[hierarchy]);

    return (
        <>
            {selectedRow?.HIERARCHY_ID && <AddEditHierarchy {...selectedRow} setSelectedRow={setSelectedRow}/>}
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
                sortServer
                defaultSortFieldId={3}
                onRowClicked={handleRowClick}
            />
        </>
    );
}

function AddEditHierarchy(props) {

    const methods = useForm({defaultValues:{
        posType: props.POSITION_TYPE||'',
        groupName: props.GROUP_NAME||'',
        workflowId: props.WORKFLOW_ID||''
    }});

    const closeModal = () => {
        //if (status.state == 'saving') return false;
        props.setSelectedRow({});
        //props.setNewGroup(false);
    }

    const handleSubmit = data => {
        console.log(data);
    }
    const handleError = error => {
        console.error(error);
    }

    return(
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Hierarchy</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <HierarchyForm/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    )
}

function HierarchyForm() {
    const {control} = useFormContext();
    const {workflows} = useContext(WorkflowContext);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="posType">
                    <Form.Label>Position Type</Form.Label>
                    <Controller
                        name="posType"
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="groupName">
                    <Form.Label>Group Name</Form.Label>
                    <Controller
                        name="groupName"
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
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
                                    {truncate(w.GROUPS_ARRAY.map(g=>g.GROUP_NAME).join(' > '),{length:70,separator:' > '})}
                                </option>)}
                            </Form.Control>
                        )}
                    />
                </Form.Group>
            </Form.Row>            
        </>
    );
}

function WorkflowTab({workflows}) {
    const [filterText,setFilterText] = useState('');
    const [rows,setRows] = useState([]);
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);

    const searchRef = useRef();

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
                    <Button variant="primary">Edit</Button>
                </div>
            );
        },ignoreRowClick:true},
        {name:'Workflow ID',selector:row=>row.WORKFLOW_ID,sortable:true,sortField:'WORKFLOW_ID'},
        {name:'Workflow Chain',selector:row=>row.GROUPS,grow:5,style:{flexWrap:'wrap'},cell:row=><HierarchyChain list={row.GROUPS_ARRAY}/>},
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
                sortServer
            />
        </>
    );
}

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
