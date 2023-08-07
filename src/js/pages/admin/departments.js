import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Row, Col, Form, Modal, Button } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { t } from "../../config/text";
import { useHotkeys } from "react-hotkeys-hook";
import { AppButton, errorToast } from "../../blocks/components";
import { FormProvider, useForm, Controller } from "react-hook-form";
import useGroupQueries from "../../queries/groups";
import useDeptQueries from "../../queries/departments";
import { sortBy } from "lodash";
import { toast } from "react-toastify";
import { useQueryClient } from "react-query";
import { CSVLink } from "react-csv";

export default function AdminDepartments() {
    const searchRef = useRef();
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [groupAssignedFilter,setGroupAssignedFilter] = useState('all');
    const [filterText,setFilterText] = useState('');
    const [selectedRow,setSelectedRow] = useState({});

    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
    });

    const handleRowClick = useCallback(row=>setSelectedRow(row));

    const {getDeptGroups} = useDeptQueries();
    const depts = getDeptGroups();

    const paginationComponentOptions = {selectAllRowsItem:true};

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
            <>
                <Col sm={6} md={5} lg={4} xl={3} className="pr-0">
                    <Form onSubmit={e=>e.preventDefault()}>
                        <Form.Group as={Row} controlId="filter">
                            <Form.Label column sm="2">Search: </Form.Label>
                            <Col sm="10">
                                <Form.Control ref={searchRef} className="ml-2" type="search" value={filterText} placeholder="search..." onChange={handleFilterChange} onKeyDown={handleKeyDown}/>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="group_assignment">
                            <Form.Label column sm="6">Group Status:</Form.Label>
                            <Col sm="6">
                                <Form.Control as="select" onChange={e=>setGroupAssignedFilter(e.target.value)}>
                                    <option value="all">All</option>
                                    <option value="yes">Assigned</option>
                                    <option value="no">Not Assigned</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </Form.Control>
                            </Col>
                        </Form.Group>
                    </Form>
                </Col>
            </>
        );
    },[filterText,groupAssignedFilter,useHotkeys]);

    const filteredRows = useMemo(() => {
        if (!depts.data) return [];
        return depts.data.filter(row => {
            if (groupAssignedFilter == 'yes' && row.GROUP_ID == "") return false;
            if (groupAssignedFilter == 'no' && row.GROUP_ID != "") return false;
            if (groupAssignedFilter == 'active' && !row.active) return false;
            if (groupAssignedFilter == 'inactive' && row.active) return false;
            return Object.values(row).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase());
        });
    },[filterText,depts]);

    const columns = useMemo(() => [
        {name:'Dept Code',selector:row=>row.DEPARTMENT_CODE,sortable:true},
        {name:'Dept Name',selector:row=>row.DEPARTMENT_NAME,sortable:true},
        {name:'Dept Description',selector:row=>row.DEPARTMENT_DESC,sortable:true},
        {name:'Primary Group',selector:row=>{
            if (row.active) return row.GROUP_NAME;
            return <div className="text-muted"><del>{row.GROUP_NAME}</del> <em>(inactive)</em></div>;
        },sortable:true}
    ],[depts]);

    const actionsMemo = useMemo(() => {
        let data = filteredRows || [];
        if (!data.length) return <Button disabled>No Data Available</Button>;
        return <CSVLink data={data} filename="HRForms2_Depts.csv" className="btn btn-primary" target="_blank">Dowload CSV</CSVLink>;
    },[filteredRows,filterText,depts]);

    useEffect(()=>searchRef.current.focus(),[]);
    return (
        <>
            <Row>
                <Col><h2>{t('admin.departments.title')}</h2></Col>
            </Row>
            <Row>
                <Col>
                    <DataTable 
                        keyField="DEPARTMENT_CODE"
                        columns={columns} 
                        actions={actionsMemo}
                        data={filteredRows}
                        progressPending={depts.isLoading}
                        striped 
                        responsive
                        subHeader
                        subHeaderComponent={filterComponent} 
                        pagination 
                        paginationRowsPerPageOptions={[10,20,30,40,50,100]}
                        paginationResetDefaultPage={resetPaginationToggle}
                        paginationComponentOptions={paginationComponentOptions}
                        pointerOnHover
                        highlightOnHover
                        onRowClicked={handleRowClick}
                        noDataComponent={<p className="m-3">No Groups Found Matching Your Criteria</p>}
                    />
                </Col>
            </Row>
            {(selectedRow?.DEPARTMENT_CODE) && <EditDepartmentForm {...selectedRow} setSelectedRow={setSelectedRow}/>}
        </>
    );
}

function EditDepartmentForm(props) {
    const queryclient = useQueryClient();
    const {putDeptGroup,deleteDeptGroup} = useDeptQueries(props.DEPARTMENT_CODE);
    const putgroup = putDeptGroup();
    const delgroup = deleteDeptGroup();

    const methods = useForm({defaultValues:{
        DEPARTMENT_CODE:props.DEPARTMENT_CODE,
        DEPARTMENT_NAME:props.DEPARTMENT_NAME,
        DEPARTMENT_DESC:props.DEPARTMENT_DESC,
        primaryGroup:props.GROUP_ID
    }});

    const {getGroups} = useGroupQueries();
    const groups = getGroups({select:data=>sortBy(data.filter(g=>g.active),['GROUP_NAME'])});

    const closeModal = () => {
        props.setSelectedRow({});
    }

    const handleSave =  data => {
        if (data.primaryGroup == props.GROUP_ID) {
            toast.info('No changes to department data');
            closeModal();
            return true;
        }
        if (data.primaryGroup == "") {
            toast.promise(new Promise((resolve,reject) => {
                delgroup.mutateAsync().then(() => {
                    queryclient.refetchQueries('deptGroups',{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err));
                }).catch(err=>reject(err)).finally(()=>{
                    closeModal();
                });
            }),{
                pending:'Updating Department Group...',
                success:'Department Group updated successfully',
                error:errorToast('Failed to update Department Group')
            });
        } else {
            toast.promise(new Promise((resolve,reject) => {
                putgroup.mutateAsync(data).then(() => {
                    queryclient.refetchQueries('deptGroups',{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err));
                }).catch(err=>reject(err)).finally(()=>{
                    closeModal();
                });
            }),{
                pending:'Updating Department Group...',
                success:'Department Group updated successfully',
                error:errorToast('Failed to update Department Group')
            });
        }
    }

    const handleError = error => {
        console.error(error);
    }

    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSave,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{props.DEPARTMENT_NAME}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Row>
                            <Form.Group as={Col} controlId="DEPARTMENT_CODE">
                                <Form.Label>Dept Code:</Form.Label>
                                <Controller
                                    name="DEPARTMENT_CODE"
                                    defaultValue=""
                                    control={methods.control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled/>}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col} controlId="DEPARTMENT_NAME">
                                <Form.Label>Dept Name:</Form.Label>
                                <Controller
                                    name="DEPARTMENT_NAME"
                                    defaultValue=""
                                    control={methods.control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled/>}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col} controlId="DEPARTMENT_DESC">
                                <Form.Label>Dept Description:</Form.Label>
                                <Controller
                                    name="DEPARTMENT_DESC"
                                    defaultValue=""
                                    control={methods.control}
                                    render={({field}) => <Form.Control {...field} type="text" disabled/>}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col} controlId="primaryGroup">
                                <Form.Label>Primary Group:</Form.Label>
                                <Controller
                                    name="primaryGroup"
                                    defaultValue=""
                                    control={methods.control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select">
                                            <option></option>
                                            {groups.data && groups.data.map(g=><option key={g.GROUP_ID} value={g.GROUP_ID}>{g.GROUP_NAME}</option>)}
                                        </Form.Control>
                                    )}
                                />
                                {!props.active && <Form.Text className="text-warning">The currently assigned group &quot;<em>{props.GROUP_NAME}</em>&quot; is inactive.  Select a different group</Form.Text>}
                            </Form.Group>
                        </Form.Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <AppButton format="close" onClick={closeModal}>Cancel</AppButton>
                        <AppButton format="save" type="submit">Save</AppButton>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}
