import React, { useState, useReducer, useEffect, useMemo, lazy, useRef } from "react";
import useRequestQueries from "../../queries/requests";
import { Row, Col, Form, Button, ButtonGroup, Accordion, Card } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { format, endOfToday, subDays } from "date-fns";
import DataTable from 'react-data-table-component';
import { AppButton, Loading, WorkflowExpandedComponent } from "../../blocks/components";
import useListsQueries from "../../queries/lists";
import { useQueryClient } from "react-query";
import { useSettingsContext, useAuthContext } from "../../app";
import useGroupQueries from "../../queries/groups";
import { find, orderBy, pick } from "lodash";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import useUserQueries from "../../queries/users";

const ArchiveView = lazy(()=>import("./view"));

const defaultValues = {
    days:30,
    startDate:subDays(endOfToday(),31),
    endDate:endOfToday(),
    reqId:'',
    posType:'',
    reqType:'',
    candidateName:'',
    lineNumber:'',
    multiLines:'N',
    createdBy:'',
    page:1,
    results:10,
    sortField:'effdate',
    sortDir:'desc'
};

export default function ListArchiveTable() {
    const {isAdmin} = useAuthContext();
    const {general} = useSettingsContext();

    const accordionViewRef = useRef();

    const [data,setData] = useState([]);
    const [userData,setUserData] = useState([]);
    const [totalRows,setTotalRows] = useState(0);
    const [submitted,setSubmitted] = useState(false);
    const [selectedRowId,setSelectedRowId] = useState();

    const { getUsers } = useUserQueries();
    const { getGroups } = useGroupQueries();
    const users = getUsers({onSuccess: d => {
        const r = orderBy(d.filter(u=>(!!u.LEGAL_FIRST_NAME&&!!u.LEGAL_LAST_NAME)),['LEGAL_LAST_NAME','LEGAL_FIRST_NAME'],['asc','asc']).map(u=>({id:u.SUNY_ID, label:`${u.LEGAL_FIRST_NAME} ${u.LEGAL_LAST_NAME}`}));
        setUserData(r);
    }});
    const groups = getGroups();

    const calculateDates = args => {
        const obj = {...args};
        if (args.days>0) {
            obj.endDate = endOfToday();
            obj.startDate = subDays(obj.endDate, parseInt(args.days)+1);
        }
        return obj;
    }

    const [filter,setFilter] = useReducer((state,action) => {
        let newState = {};
        if (action?.reqId) {
            newState = {...defaultValues, ...action};
        } else {
            const dates = calculateDates(action);
            newState = {...state, ...action,...dates};
        }
        return newState;
    },defaultValues,calculateDates);

    const queryClient = useQueryClient();
    const {getArchiveRequestList} = useRequestQueries();
    const listdata = getArchiveRequestList(filter,{
        enabled:submitted,
        keepPreviousData:true,
        staleTime:30000
    });

    const handleSearch = () => {
        setSubmitted(true);
    }

    const handleReset = (reset=true) => {
        setSubmitted(false);
        setSelectedRowId(null);
        queryClient.removeQueries(['archivelist','request']);
        setData([]);
        if (reset) setFilter(defaultValues);
    }

    const handleChangePage = page => {
        setFilter({page:page});
        handleSearch();
    }

    const handleChangeRowsPerPage = (newPerPage,page) => {
        setFilter({page:page,results:newPerPage});
        handleSearch();
    }

    const handleSort = (column, sortDirection) => {
        console.log(column?.id, sortDirection);
        setFilter({sortField:column?.id,sortDir:sortDirection});
        handleSearch();
    }

    const handleRowClick = row => {
        accordionViewRef.current.click();
        setSelectedRowId(row.REQUEST_ID);
    }

    const expandRow = useMemo(()=>((isAdmin && general.showFormWF == 'A')||general.showFormWF == 'Y'),[general,isAdmin]);

    const columns = [
        {id:'request_id',name:'ID',selector:row=>row.REQUEST_ID,sortable:true},
        {id:'pos_type',name:'Position Type',selector:row=>row.POSTYPE.id,format:row=>`${row.POSTYPE.id} - ${row.POSTYPE.title}`,sortable:true},
        {id:'req_type',name:'Request Type',selector:row=>row.REQTYPE.id,format:row=>`${row.REQTYPE.id} - ${row.REQTYPE.title}`,sortable:true},
        {id:'effdate',name:'Effective Date',selector:row=>row.EFFDATE,format:row=>format(new Date(row.EFFDATE),'P'),sortable:true},
        {id:'candidate_name',name:'Candidate Name',selector:row=>row.CANDIDATENAME,sortable:true,wrap:true},
        {id:'line_number',name:'Line #',selector:row=>row.LINENUMBER,sortable:true},
        {id:'title',name:'Title',selector:row=>row.REQBUDGETTITLE,sortable:true,wrap:true},
        {id:'created_by',name:'Created By',selector:row=>row.CREATED_BY_SUNY_ID,sortable:true,format:row=>`${row.fullName} (${row.CREATED_BY_SUNY_ID})`,wrap:true},
    ];

    const customStyles = {
        subHeader: {
            style: {
                flexDirection: 'column',
                alignItems: 'flex-end',
                padding: '0.25rem 0.75rem 0.5rem',
                border: '1px solid #004333',
                marginBottom: '0.25rem',
                borderRadius: '4px'
            }
        }
    };

    const conditionalRowStyles = [
        {
            when: row => row.REQUEST_ID == selectedRowId,
            classNames: ['bg-primary-light']
        }
    ];

    useEffect(() => {
        if (!submitted) return;
        listdata.refetch().then(d => {
            for (const r of d.data.results) {
                if (r.CREATED_BY_SUNY_ID) r.createdByFullName = [r.CREATED_BY_FIRST_NAME,r.CREATED_BY_LEGAL_LAST_NAME].join(' ');
                r.fullName = [r.FIRST_NAME,r.LEGAL_LAST_NAME].join(' ');
                r.sortName = [r.LEGAL_LAST_NAME,r.FIRST_NAME].join(', ') + ' ' + (r.LEGAL_MIDDLE_NAME && r.LEGAL_MIDDLE_NAME.slice(0,1));
                r.GROUPS_ARRAY = (!r.GROUPS)?[]:r.GROUPS.split(',').map(g=>pick(find(groups.data,{GROUP_ID:g}),['GROUP_ID','GROUP_NAME','GROUP_DESCRIPTION']));
            }
            setData(d.data.results);
            setTotalRows(d.data.info.total_rows);
            setSubmitted(false);
        });
    },[filter,submitted,groups,listdata]);

    if (listdata.isError) return <Loading type="alert" isError>Error Loading List Data</Loading>;
    return (
        <Accordion defaultActiveKey="0">
            <Card style={{overflow:'visible'}}>
                <Accordion.Toggle as={Card.Header} className="d-print-none" eventKey="0">
                    <h3 className="m-0">Archive Search</h3>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="0">
                    <DataTable 
                        keyField="REQUEST_ID"
                        defaultSortFieldId={4}
                        defaultSortAsc={false}
                        className="compact"
                        columns={columns} 
                        data={data}
                        noDataComponent={<div className="p-3">{listdata.isFetched?"No Records Found":"Perform A Search"}</div>}
                        persistTableHead
                        progressPending={listdata.isLoading}
                        pagination 
                        paginationServer
                        paginationTotalRows={totalRows}
                        subHeader
                        subHeaderComponent={<ArchiveTableSubHeader filter={filter} setFilter={setFilter} handleSearch={handleSearch} handleReset={handleReset} calculateDates={calculateDates} userData={userData}/>}
                        onChangeRowsPerPage={handleChangeRowsPerPage}
                        onChangePage={handleChangePage}
                        onRowClicked={handleRowClick}
                        striped 
                        responsive
                        pointerOnHover
                        highlightOnHover
                        customStyles={customStyles}
                        conditionalRowStyles={conditionalRowStyles}
                        expandableRows={expandRow}
                        expandableRowsComponent={WorkflowExpandedComponent}
                        sortServer={true}
                        onSort={handleSort}
                    />
                </Accordion.Collapse>
            </Card>
            <Card>
                <Accordion.Toggle ref={accordionViewRef} as={Card.Header} className="d-print-none" eventKey="1">
                    <h3 className="m-0">Archive View</h3>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="1">
                    <Card.Body>
                        {!selectedRowId?<p className="mb-0 text-center">Perform a search and select a row</p>:<ArchiveView reqId={selectedRowId}/>}
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </Accordion>
    );
}
/*
        <DataTable 
            keyField="REQUEST_ID"
            className="compact"
            columns={columns} 
            data={data}
            noDataComponent={<div className="p-3">{submitted?"No Records Found":"Perform A Search"}</div>}
            persistTableHead
            progressPending={listdata.isPending}
            pagination 
            subHeader
            subHeaderComponent={<ArchiveTableSubHeader filter={filter} setFilter={setFilter} handleSearch={handleSearch} handleReset={handleReset}/>}
            onChangeRowsPerPage={handleChangeRowsPerPage}
            onChangePage={handleChangePage}
            striped 
            responsive
            pointerOnHover
            highlightOnHover
            customStyles={customStyles}
        />
*/

function ArchiveTableSubHeader({filter,setFilter,handleSearch,handleReset,calculateDates,userData}) {
    const daysButtons = [
        {id: 'btn-days-14', label: '14 Days', value: '14' },
        { id: 'btn-days-30', label: '30 Days', value: '30' },
        { id: 'btn-days-60', label: '60 Days', value: '60' },
        { id: 'btn-days-90', label: '90 Days', value: '90' },
        { id: 'btn-days-custom', label: 'Custom', value: '-1' }
    ];
    const [days,setDays] = useState('btn-days-30');
    const [filteredUsers,setFilteredUsers] = useState(userData);
    const [createdBySearch,setCreatedBySearch] = useState([{id:'',label:''}]);
    const [dateRange,setDateRange] = useState([filter.startDate,filter.endDate]);
    const [startDate,endDate] = dateRange;

    // get position type and request type
    const { getListData } = useListsQueries();
    const posTypes = getListData('posTypes');
    const reqTypes = getListData('reqTypes');

    const handleDaysChange = e => {
        setDays(e.target.id);
        const daysObj = calculateDates({days:daysButtons.find(d=>d.id === e.target.id)?.value||0});
        setDateRange([daysObj.startDate,daysObj.endDate]);
        setFilter({days:daysObj.days});
        handleReset(false);
    }

    const handleDateChange = range => { 
        setDateRange(range);
        if (!!range[0]&&!!range[1]) setFilter({startDate:range[0], endDate:range[1]});
    }

    const handleFilterChange = e => {
        const obj = {};
        obj[e.target.id] = e.target.value;
        if (e.target.id == 'reqId') setCreatedBySearch([{id:'',label:''}]);
        if (e.target.id == 'multiLines') obj[e.target.id] = (e.target.checked)?'Y':'N';
        setFilter(obj);
        handleReset(false);
    }

    const handlePersonSearch = search => {
        setFilteredUsers(userData.filter(u=>u.label.toLowerCase().includes(search.toLowerCase())));
    }
    const handlePersonSearchChange = value => {
        setCreatedBySearch(value);
        setFilter({createdBy:value[0]?.id});
    }

    const resetDays = () => {
        setDays('btn-days-30');
        setCreatedBySearch([{id:'',label:''}]);
        handleReset();
    }

    return(
        <Form style={{width:'100%'}}>
            <Row>
                <Col><h3>Archive Search</h3></Col>
            </Row>
            <Form.Row className="justify-content-end">
                <Form.Group as={Col} sm={2} lg={1} controlId="reqId">
                    <Form.Label>ID</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.reqId} onChange={handleFilterChange}/>
                </Form.Group>
                <Form.Group as={Col} sm={3} lg={2} controlId="posType">
                    <Form.Label>Position Type</Form.Label>
                    <Form.Control size="sm" as="select" value={filter.posType} onChange={handleFilterChange} disabled={filter.reqId!=""}>
                        <option></option>
                        {posTypes.data && Object.keys(posTypes.data).map(p=>(<option key={p} value={p}>{p} - {posTypes.data[p]?.title}</option>))}
                    </Form.Control>
                </Form.Group>
                <Form.Group as={Col} sm={3} lg={2} controlId="reqType">
                    <Form.Label>Request Type</Form.Label>
                    <Form.Control size="sm" as="select" value={filter.reqType} onChange={handleFilterChange} disabled={filter.posType==""}>
                        <option></option>
                        {(reqTypes.data&&filter.posType!="") && reqTypes.data.filter(r=>posTypes.data[filter.posType]?.reqTypes.includes(r[0])).map(r=>(<option key={r[0]} value={r[0]}>{r[0]} - {r[1]}</option>))}
                    </Form.Control>
                </Form.Group>
                <Form.Group as={Col} sm={3} md={2} controlId="candidateName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.candidateName} onChange={handleFilterChange} placeholder="Enter Name" disabled={filter.reqId!=""}/>
                </Form.Group>
                <Form.Group as={Col} sm={2} lg={1} controlId="lineNumber">
                    <Form.Label>Line #</Form.Label>
                    <Form.Control type="search" size="sm" value={filter.lineNumber} onChange={handleFilterChange} placeholder="Line #" disabled={filter.reqId!=""}/>
                </Form.Group>
                <Form.Group as={Col} sm={1} lg={1} controlId="multiLines" className="text-center">
                    <Form.Label>Multi-Line?</Form.Label>
                    <Form.Check type="checkbox" value="Y" className="mt-1" checked={(filter.multiLines=='Y')} onChange={handleFilterChange} disabled={filter.reqId!=""}/>
                </Form.Group>
                <Form.Group as={Col} sm={3} md={2} controlId="createdBy">
                    <Form.Label>Created By</Form.Label>
                    <AsyncTypeahead
                        size="sm"
                        id="createdBy-search"
                        clearButton
                        filterBy={()=>true}
                        onSearch={handlePersonSearch}
                        onChange={handlePersonSearchChange}
                        selected={createdBySearch}
                        minLength={2}
                        flip={true}
                        allowNew={false}
                        options={filteredUsers}
                        placeholder="Search for people..."
                        disabled={filter.reqId!=""}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row className="justify-content-end">
                <div className="form-group col-lg-2 col-sm-3 text-right pt-1">Effective Date:</div>
                <div>
                    <ButtonGroup size="sm" toggle>
                        {daysButtons.map(btn => <Button key={btn.id} id={btn.id} variant={(days==btn.id&&filter.reqId=='')?'primary':'secondary'} active={days==btn.id} onClick={handleDaysChange} disabled={filter.reqId!=''}>{btn.label}</Button>)}
                    </ButtonGroup>
                </div>
                <Form.Group as={Col} sm={3} lg={2} controlId="customDateRange">
                    <Form.Control 
                        size="sm"
                        as={DatePicker} 
                        name="customDateRange"
                        autoComplete="off"
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={handleDateChange}
                        isClearable={true}
                        placeholderText="Select Custom Date Range"
                        disabled={days!='btn-days-custom'||filter.reqId!=''}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row className="justify-content-end">
                <AppButton format="clear" className="mr-2" onClick={resetDays}>Clear</AppButton>
                <AppButton format="search" onClick={handleSearch}>Submit</AppButton>
            </Form.Row>
        </Form>
    );
}
