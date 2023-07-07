import React, { useMemo, useState, useRef } from "react";
import { Row, Col, Form } from "react-bootstrap";
import DataTable from 'react-data-table-component';
import { t } from "../../config/text";
import { useHotkeys } from "react-hotkeys-hook";
import useListsQueries from "../../queries/lists";

export default function AdminDepartments() {
    const searchRef = useRef();

    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [filterText,setFilterText] = useState('');

    const { getListData } = useListsQueries();
    const depts = getListData('deptOrgs');

    const paginationComponentOptions = {selectAllRowsItem:true};

    const filterComponent = useMemo(() => {
        const handleKeyDown = e => {
            if(e.key=="Escape"&&!filterText) searchRef.current.blur();
        }
        const handleFilterChange = e => {
            console.log(e);
            /*if (e.target.value) {
                setResetPaginationToggle(false);
                setFilterText(e.target.value);
                if (startsWith(e.target.value,'id:')) history.push('/admin/users/'+e.target.value.split(':')[1]);
            } else {
                setResetPaginationToggle(true);
                setFilterText('');
                history.push('/admin/users');
            }*/
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
                    </Form>
                </Col>
            </>
        );
    },[filterText,useHotkeys]);

    const columns = useMemo(() => [
        {name:'Dept Code',selector:row=>row.DEPARTMENT_CODE,sortable:true},
        {name:'Dept Name',selector:row=>row.DEPARTMENT_NAME,sortable:true},
        {name:'Dept Description',selector:row=>row.DEPARTMENT_DESC,sortable:true}
    ],[depts]);

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
                        data={depts.data}
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
                        noDataComponent={<p className="m-3">No Groups Found Matching Your Criteria</p>}
                    />
                </Col>
            </Row>
        </>
    );
}

